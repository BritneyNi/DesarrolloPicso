using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RendimientoController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly string[] Actividades = new[]
        {
            "Enchape Piedra Bogotana",
            "Enchape fachaleta",
            "Enchape Blend",
            "Mortero",
            "Estructura Cielo drywall",
            "Estructura Muro drywall",
            "Tapado cielo drywall",
            "Tapado muro drywall",
            "Masilla",
            "Pintura"
        };
        private static readonly string[] Unidades = new[]
        {
            "m2",
            "m",
            "und"
        };
        public RendimientoController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("actividades")]
        public IActionResult GetActividades()
        {
            return Ok(Actividades);
        }

        [HttpGet("unidades")]
        public IActionResult GetUnidades()
        {
            return Ok(Unidades);
        }

        [HttpGet("resumen-por-empleado")]
        public async Task<IActionResult> ObtenerResumenPorEmpleado()
        {
            var resumenPlano = await _context.Rendimiento
                .GroupBy(r => new { r.IdEmpleado, r.Actividad, r.Unidad })
                .Select(g => new
                {
                    IdEmpleado = g.Key.IdEmpleado,
                    Actividad = g.Key.Actividad,
                    Unidad = g.Key.Unidad,
                    TotalCantidad = g.Sum(r => r.Cantidad),
                    TotalDias = g.Sum(r => r.Dias)
                })
                .ToListAsync();

            var empleados = await _context.Empleado
                .Where(e => resumenPlano.Select(r => r.IdEmpleado).Distinct().Contains(e.Id))
                .ToDictionaryAsync(e => e.Id, e => e.NombreCompleto);

           var obrasPorEmpleado = await _context.Rendimiento
                .GroupBy(r => r.IdEmpleado)
                .Select(g => new { IdEmpleado = g.Key, ObraId = g.Select(x => x.ObraId).FirstOrDefault() })
                .ToDictionaryAsync(g => g.IdEmpleado, g => g.ObraId);

            var resumenFinal = resumenPlano
                .GroupBy(r => r.IdEmpleado)
                .Select(g => new ResumenRendimiento
                {
                    IdEmpleado = g.Key,
                    NombreEmpleado = empleados.ContainsKey(g.Key) ? empleados[g.Key] : "Desconocido",
                    ObraId = obrasPorEmpleado.ContainsKey(g.Key) ? obrasPorEmpleado[g.Key] : null,
                    Actividades = g.Select(a => new ActividadResumen
                    {
                        Actividad = a.Actividad,
                        Unidad = a.Unidad,
                        TotalCantidad = a.TotalCantidad,
                        TotalDias = a.TotalDias
                    }).ToList()
                })
                .OrderBy(r => r.IdEmpleado)
                .ToList();

            return Ok(resumenFinal);
        }

        [HttpGet]
        public async Task<IActionResult> GetRendimientos(int page = 1, int pageSize = 20)
        {
            if (pageSize > 500) pageSize = 500;
            var list = await _context.Rendimiento
                .OrderByDescending(r => r.Fecha)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRendimiento(int id)
        {
            var item = await _context.Rendimiento.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRendimiento([FromBody] Rendimiento model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            model.Fecha = DateTime.UtcNow.Date;  

            _context.Rendimiento.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRendimiento), new { id = model.Id }, model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRendimiento(int id, [FromBody] Rendimiento model)
        {
            if (id != model.Id)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.Entry(model).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RendimientoExists(id))
                    return NotFound();
                throw;
            }
            return Ok(model);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRendimiento(int id)
        {
            var model = await _context.Rendimiento.FindAsync(id);
            if (model == null)
                return NotFound();

            _context.Rendimiento.Remove(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }
        private bool RendimientoExists(int id)
        {
            return _context.Rendimiento.Any(r => r.Id == id);
        }
    }
}
