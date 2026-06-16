using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RevisionInventarioController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RevisionInventarioController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRevisiones()
        {
            var revisiones = await _context.RevisionInventario
                .Include(r => r.Inventario)
                .OrderByDescending(r => r.FechaRevision)
                .ToListAsync();

            return Ok(revisiones);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRevision(int id)
        {
            var item = await _context.RevisionInventario
                .Include(r => r.Inventario)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpGet("por-inventario/{inventarioId}")]
        public async Task<IActionResult> GetPorInventario(int inventarioId)
        {
            var revisiones = await _context.RevisionInventario
                .Include(r => r.Inventario)
                .Where(r => r.InventarioId == inventarioId)
                .OrderByDescending(r => r.FechaRevision)
                .ToListAsync();

            return Ok(revisiones);
        }
        [HttpPost]
        public async Task<IActionResult> CrearRevision([FromBody] RevisionInventario data)
        {
            ModelState.Remove(nameof(data.FechaRevision));
            ModelState.Remove(nameof(data.Inventario));

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var valoresPermitidos = new[] { "Bueno", "Regular", "Malo", "Dado de baja", "Extraviado" };

            if (string.IsNullOrWhiteSpace(data.EstadoFisico) ||
                !valoresPermitidos.Contains(data.EstadoFisico.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest($"El estado físico debe ser uno de los siguientes: {string.Join(", ", valoresPermitidos)}.");
            }

            var existeInventario = await _context.Inventario.AnyAsync(i => i.Id == data.InventarioId);
            if (!existeInventario)
                return BadRequest($"Inventario con ID {data.InventarioId} no existe");

            data.FechaRevision = DateTime.UtcNow;

            _context.RevisionInventario.Add(data);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRevision), new { id = data.Id }, data);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarRevision(int id, [FromBody] RevisionInventario data)
        {
            if (id != data.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.Entry(data).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.RevisionInventario.Any(r => r.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarRevision(int id)
        {
            var item = await _context.RevisionInventario.FindAsync(id);
            if (item == null)
                return NotFound();

            _context.RevisionInventario.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(item);
        }
    }
}
