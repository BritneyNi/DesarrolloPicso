using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Services.Pdf;
using System.Text.Json;

namespace testback.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AtsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AtsPdfService _pdfService;

        public AtsController(ApplicationDbContext context, AtsPdfService pdfService)
        {
            _context    = context;
            _pdfService = pdfService;
        }

        // ============================================================
        // GET PDF INDIVIDUAL
        // GET api/Ats/{atsId}/actividad/{actividadId}/pdf
        // ============================================================
        [HttpGet("{atsId:int}/actividad/{actividadId:int}/pdf")]
        public async Task<IActionResult> PdfIndividual(int atsId, int actividadId)
        {
            var ats = await _context.Ats
                .Include(a => a.Actividades)
                    .ThenInclude(a => a.Empleado)
                .FirstOrDefaultAsync(a => a.Id == atsId);

            if (ats == null) return NotFound("ATS no encontrado");

            var actividad = ats.Actividades.FirstOrDefault(a => a.Id == actividadId);
            if (actividad == null) return NotFound("Actividad no encontrada");

            var pdfBytes = _pdfService.GenerarIndividual(ats, actividad);
            var nombre   = actividad.Empleado?.NombreCompleto?.Replace(" ", "_") ?? "empleado";
            return File(pdfBytes, "application/pdf", $"ATS_{nombre}.pdf");
        }

        // ============================================================
        // GET PDF MASIVO
        // GET api/Ats/{atsId}/pdf
        // ============================================================
        [HttpGet("{atsId:int}/pdf")]
        public async Task<IActionResult> PdfMasivo(int atsId)
        {
            var ats = await _context.Ats
                .Include(a => a.Actividades)
                    .ThenInclude(a => a.Empleado)
                .FirstOrDefaultAsync(a => a.Id == atsId);

            if (ats == null) return NotFound("ATS no encontrado");
            if (!ats.Actividades.Any()) return BadRequest("No hay actividades en este ATS");

            var pdfBytes = _pdfService.GenerarMasivo(ats);
            return File(pdfBytes, "application/pdf", $"ATS_{ats.Descripcion?.Replace(" ", "_")}.pdf");
        }

        // ============================================================

        // ============================================================
        // GET ATS PRINCIPALES
        // GET api/Ats/principal
        // ============================================================
        [HttpGet("principal")]
        public async Task<ActionResult<IEnumerable<Ats>>> GetPrincipales()
        {
            var lista = await _context.Ats
                .Include(a => a.Actividades)
                    .ThenInclude(a => a.Empleado)
                .ToListAsync();
            return Ok(lista);
        }
        // 1) CREAR ATS PRINCIPAL
        // ============================================================
        [HttpPost("principal")]
        public async Task<IActionResult> CreatePrincipal([FromBody] Ats ats)
        {
            try
            {
                if (ats == null) return BadRequest("ATS inválido");
                _context.Ats.Add(ats);
                await _context.SaveChangesAsync();
                return Ok(ats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // 2) AGREGAR ACTIVIDAD A UN ATS
        // ============================================================
        [HttpPost("{atsId}/actividad")]
        public async Task<IActionResult> AddActividad(int atsId, [FromBody] Actividad actividad)
        {
            var ats = await _context.Ats.FindAsync(atsId);
            if (ats == null) return NotFound("ATS no encontrado");

            actividad.AtsId = atsId;
            _context.Actividades.Add(actividad);
            await _context.SaveChangesAsync();
            return Ok(actividad);
        }

        // ============================================================
        // 3) OBTENER ATS POR ID
        // ============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ats = await _context.Ats
                .Include(a => a.Actividades)
                    .ThenInclude(a => a.Empleado)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (ats == null) return NotFound();
            return Ok(ats);
        }

        // ============================================================
        // 4) OBTENER TODOS
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var lista = await _context.Ats
                .Include(a => a.Actividades)
                    .ThenInclude(a => a.Empleado)
                .ToListAsync();
            return Ok(lista);
        }

        // ============================================================
        // 5) ACTUALIZAR ATS
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Ats ats)
        {
            var existing = await _context.Ats.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Descripcion   = ats.Descripcion;
            existing.Peligros      = ats.Peligros;
            existing.Riesgo        = ats.Riesgo;
            existing.QueSucede     = ats.QueSucede;
            existing.QueHacer      = ats.QueHacer;
            existing.FirmaSst      = ats.FirmaSst;
            existing.ResponsableAts = ats.ResponsableAts;
            existing.Responsable   = ats.Responsable;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // ============================================================
        // 6) ELIMINAR ATS
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ats = await _context.Ats.FindAsync(id);
            if (ats == null) return NotFound();
            _context.Ats.Remove(ats);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "ATS eliminado" });
        }

        // ============================================================
        // 7) ACTUALIZAR FIRMA EMPLEADO EN ACTIVIDAD
        // ============================================================
        [HttpPut("actividad/{actividadId}/firma-empleado")]
        public async Task<IActionResult> ActualizarFirmaEmpleado(int actividadId, [FromBody] JsonElement body)
        {
            var actividad = await _context.Actividades.FindAsync(actividadId);
            if (actividad == null) return NotFound();

            actividad.FirmaEmpleado = body.GetProperty("firmaEmpleado").GetString();
            await _context.SaveChangesAsync();
            return Ok(actividad);
        }
    }
}


