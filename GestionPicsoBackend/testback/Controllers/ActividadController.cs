using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActividadController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActividadController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // 1) OBTENER TODAS LAS ACTIVIDADES
        // ============================================================
        // GET: api/Actividad
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Actividad>>> GetAll()
        {
            return await _context.Actividades
                .Include(a => a.Ats)
                .Include(a => a.Empleado)
                .ToListAsync();
        }

        // ============================================================
        // 2) OBTENER ACTIVIDAD POR ID
        // ============================================================
        // GET: api/Actividad/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Actividad>> GetById(int id)
        {
            var actividad = await _context.Actividades
                .Include(a => a.Ats)
                .Include(a => a.Empleado)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (actividad == null)
                return NotFound();

            return actividad;
        }

        // ============================================================
        // 3) CREAR ACTIVIDAD DENTRO DE UN ATS
        // ============================================================
        // POST: api/Actividad/ats/5
        [HttpPost("ats/{atsId}")]
        public async Task<ActionResult<Actividad>> CreateInsideAts(int atsId, [FromBody] Actividad actividad)
        {
            var ats = await _context.Ats.FindAsync(atsId);
            if (ats == null)
                return NotFound(new { message = "ATS no encontrado" });

            actividad.AtsId = atsId;

            _context.Actividades.Add(actividad);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = actividad.Id }, actividad);
        }


        [HttpPost("crear")]
public async Task<ActionResult<Actividad>> Create([FromBody] Actividad actividad)
{
    if (actividad.AtsId == null || actividad.AtsId == 0)
        return BadRequest(new { message = "AtsId es obligatorio" });

    var ats = await _context.Ats.FindAsync(actividad.AtsId);
    if (ats == null)
        return NotFound(new { message = "ATS no encontrado" });

    _context.Actividades.Add(actividad);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetById), new { id = actividad.Id }, actividad);
}

        // ============================================================
        // 4) ACTUALIZAR ACTIVIDAD
        // ============================================================
        // PUT: api/Actividad/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Actividad data)
        {
            var actividad = await _context.Actividades.FindAsync(id);
            if (actividad == null)
                return NotFound();

            actividad.EmpresaContratista = data.EmpresaContratista ?? actividad.EmpresaContratista;
            actividad.TrabajoARealizar = data.TrabajoARealizar ?? actividad.TrabajoARealizar;
            actividad.EquiposAUtilizar = data.EquiposAUtilizar ?? actividad.EquiposAUtilizar;
            actividad.EquiposEmergencia = data.EquiposEmergencia ?? actividad.EquiposEmergencia;
            actividad.Fecha = data.Fecha ?? actividad.Fecha;
            actividad.FechaFin = data.FechaFin ?? actividad.FechaFin;
            actividad.TipoPermiso = data.TipoPermiso ?? actividad.TipoPermiso;
            actividad.FirmaEmpleado = data.FirmaEmpleado ?? actividad.FirmaEmpleado;
            actividad.EmpleadoId = data.EmpleadoId != 0 ? data.EmpleadoId : actividad.EmpleadoId;
            actividad.Observacion = data.Observacion ?? actividad.Observacion;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Actividad actualizada correctamente" });
        }
       //
        // ============================================================
        // 5) ELIMINAR ACTIVIDAD
        // ============================================================
        // DELETE: api/Actividad/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var actividad = await _context.Actividades.FindAsync(id);

            if (actividad == null)
                return NotFound();

            _context.Actividades.Remove(actividad);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Actividad eliminada" });
        }
    }
}
