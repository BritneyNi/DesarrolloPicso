using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Services.Pdf;

namespace testback.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermisoTrabajoAlturasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EvaluacionAlturasPdfService _pdfService;

        public PermisoTrabajoAlturasController(
            ApplicationDbContext context,
            EvaluacionAlturasPdfService pdfService)
        {
            _context    = context;
            _pdfService = pdfService;
        }

        // ===========================
        //        CREATE (POST)
        // ===========================
        [HttpPost]
        public async Task<IActionResult> CrearPermiso([FromBody] PermisoTrabajoAlturas permiso)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (permiso.ResponsablePermisoEmpleadoId != null)
                permiso.ResponsablePermiso = null;

            if (permiso.PersonaAutorizaEmpleadoId != null)
                permiso.PersonaAutoriza = null;

            if (permiso.CoordinadorTrabajoAlturasEmpleadoId != null)
                permiso.CoordinadorTrabajoAlturas = null;

            _context.PermisosTrabajoAlturas.Add(permiso);
            await _context.SaveChangesAsync();

            return Ok(permiso);
        }

        // ===========================
        //  ADD PERSONAL TO PERMISO
        // ===========================
        [HttpPost("{permisoId:int}/personal")]
        public async Task<IActionResult> AgregarPersonal(
            int permisoId,
            [FromBody] PersonalAutorizado personal)
        {
            var permiso = await _context.PermisosTrabajoAlturas
                .FirstOrDefaultAsync(p => p.Id == permisoId);

            if (permiso == null)
                return NotFound("Permiso no encontrado");

            personal.PermisoTrabajoAlturasId = permisoId;

            _context.PersonalAutorizado.Add(personal);
            await _context.SaveChangesAsync();

            return Ok(personal);
        }

        // ===========================
        //  GET PERSONAL BY PERMISO
        // ===========================
        [HttpGet("{permisoId:int}/personal")]
        public async Task<IActionResult> ObtenerPersonal(int permisoId)
        {
            var personal = await _context.PersonalAutorizado
                .Include(p => p.Empleado)
                .Where(p => p.PermisoTrabajoAlturasId == permisoId)
                .ToListAsync();

            return Ok(personal);
        }

        // ===========================
        //  ADD COMPROBACION PREVIA
        // ===========================
        [HttpPost("personal/{personalId:int}/comprobaciones")]
        public async Task<IActionResult> CrearComprobacion(
            int personalId,
            [FromBody] ComprobacionPrevia dto)
        {
            var persona = await _context.PersonalAutorizado
                .FirstOrDefaultAsync(p => p.Id == personalId);

            if (persona == null)
                return NotFound("Persona no encontrada");

            var comprobacion = new ComprobacionPrevia
            {
                PersonalAutorizadoId = personalId,
                EvaluacionJson       = dto.EvaluacionJson,
                Fecha                = DateTime.Now,
                FirmaEmpleadoBase64  = dto.FirmaEmpleadoBase64
            };

            _context.ComprobacionesPrevias.Add(comprobacion);
            await _context.SaveChangesAsync();

            return Ok(comprobacion);
        }

        // ===========================
        //  GET COMPROBACIONES POR PERSONA
        // ===========================
        [HttpGet("personal/{personalId:int}/comprobaciones")]
        public async Task<IActionResult> ObtenerComprobaciones(int personalId)
        {
            var existePersona = await _context.PersonalAutorizado
                .AnyAsync(p => p.Id == personalId);

            if (!existePersona)
                return NotFound("Persona no encontrada");

            var comprobaciones = await _context.ComprobacionesPrevias
                .Where(c => c.PersonalAutorizadoId == personalId)
                .OrderByDescending(c => c.Fecha)
                .ToListAsync();

            return Ok(comprobaciones);
        }

        // ===========================
        //      GET BY ID
        // ===========================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var permiso = await _context.PermisosTrabajoAlturas
                .Include(p => p.ResponsablePermisoEmpleado)
                .Include(p => p.AyudanteSeguridadEmpleado)
                .Include(p => p.PersonaAutorizaEmpleado)
                .Include(p => p.CoordinadorTrabajoAlturasEmpleado)
                .Include(p => p.PersonalAutorizado)
                    .ThenInclude(pa => pa.Empleado)
                .Include(p => p.ResponsablesPlanEmergencia)
                    .ThenInclude(r => r.Empleado)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (permiso == null)
                return NotFound();

            return Ok(permiso);
        }

        // ===========================
        //      GET ALL
        // ===========================
        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var permisos = await _context.PermisosTrabajoAlturas
                .Include(p => p.ResponsablePermisoEmpleado)
                .Include(p => p.PersonalAutorizado)
                .ToListAsync();

            return Ok(permisos);
        }

        // ===========================
        //      UPDATE (PUT)
        // ===========================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] PermisoTrabajoAlturas permiso)
        {
            var current = await _context.PermisosTrabajoAlturas
                .Include(p => p.ResponsablesPlanEmergencia)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (current == null)
                return NotFound();

            permiso.Id = id;

            if (permiso.ResponsablesPlanEmergencia != null)
            {
                var toRemove = current.ResponsablesPlanEmergencia
                    .Where(r => !permiso.ResponsablesPlanEmergencia.Any(p => p.Id == r.Id))
                    .ToList();
                _context.ResponsablePlanEmergencia.RemoveRange(toRemove);

                foreach (var item in permiso.ResponsablesPlanEmergencia)
                {
                    item.PermisoTrabajoAlturasId = id;

                    if (item.Id == 0)
                    {
                        _context.ResponsablePlanEmergencia.Add(item);
                    }
                    else
                    {
                        var existing = current.ResponsablesPlanEmergencia.First(r => r.Id == item.Id);
                        _context.Entry(existing).CurrentValues.SetValues(item);
                    }
                }
            }

            _context.Entry(current).CurrentValues.SetValues(permiso);
            await _context.SaveChangesAsync();

            return Ok(current);
        }

        // ===========================
        //  DELETE PERSONAL AUTORIZADO
        // ===========================
        [HttpDelete("personal/{id:int}")]
        public async Task<IActionResult> EliminarPersonal(int id)
        {
            var persona = await _context.PersonalAutorizado
                .FirstOrDefaultAsync(p => p.Id == id);

            if (persona == null)
                return NotFound("Persona no encontrada");

            _context.PersonalAutorizado.Remove(persona);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Persona eliminada correctamente" });
        }

        // ===========================
        //        DELETE
        // ===========================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var permiso = await _context.PermisosTrabajoAlturas
                .FirstOrDefaultAsync(x => x.Id == id);

            if (permiso == null)
                return NotFound();

            _context.PermisosTrabajoAlturas.Remove(permiso);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Eliminado correctamente" });
        }

        // ===========================
        //  DELETE COMPROBACION PREVIA
        // ===========================
        [HttpDelete("comprobaciones/{id:int}")]
        public async Task<IActionResult> EliminarComprobacion(int id)
        {
            var comprobacion = await _context.ComprobacionesPrevias
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comprobacion == null)
                return NotFound();

            _context.ComprobacionesPrevias.Remove(comprobacion);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Evaluación eliminada" });
        }

        // ===========================
        //  BUSCADOR DE EMPLEADOS
        // ===========================
        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarEmpleados([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

            var empleados = await _context.Empleado
                .Where(e => e.Estado == "Activo" && e.NombreCompleto.Contains(q))
                .Select(e => new { e.Id, e.NombreCompleto, e.Cedula, e.Cargo })
                .Take(10)
                .ToListAsync();

            return Ok(empleados);
        }

        // ===========================
        //  GET PDF EVALUACIÓN
        // ===========================
        [HttpGet("{permisoId:int}/personal/{personalId:int}/evaluacion/{evaluacionId:int}/pdf")]
        public async Task<IActionResult> DescargarPdfEvaluacion(
            int permisoId,
            int personalId,
            int evaluacionId)
        {
            var permiso = await _context.PermisosTrabajoAlturas
                .Include(p => p.ResponsablePermisoEmpleado)
                .Include(p => p.AyudanteSeguridadEmpleado)
                .Include(p => p.PersonaAutorizaEmpleado)
                .Include(p => p.CoordinadorTrabajoAlturasEmpleado)
                .Include(p => p.ResponsablesPlanEmergencia)
                    .ThenInclude(r => r.Empleado)
                .FirstOrDefaultAsync(p => p.Id == permisoId);

            if (permiso == null)
                return NotFound("Permiso no encontrado");

            var persona = await _context.PersonalAutorizado
                .Include(p => p.Empleado)
                .FirstOrDefaultAsync(p => p.Id == personalId
                    && p.PermisoTrabajoAlturasId == permisoId);

            if (persona == null)
                return NotFound("Personal no encontrado");

            var evaluacion = await _context.ComprobacionesPrevias
                .FirstOrDefaultAsync(c => c.Id == evaluacionId
                    && c.PersonalAutorizadoId == personalId);

            if (evaluacion == null)
                return NotFound("Evaluación no encontrada");

            var pdfBytes = _pdfService.Generar(permiso, persona, evaluacion);
            var fileName = $"Evaluacion_{persona.Nombres?.Replace(" ", "_")}_{evaluacion.Id}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}
