using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Services.Pdf;

[ApiController]
[Route("api/permiso-en-caliente-evaluaciones")]
public class PermisoEnCalienteEvaluacionesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly PermisoCalientePdfService _pdfService;

    public PermisoEnCalienteEvaluacionesController(
        ApplicationDbContext context,
        PermisoCalientePdfService pdfService)
    {
        _context    = context;
        _pdfService = pdfService;
    }

    // GET PDF EVALUACIÓN
    [HttpGet("{evaluacionId:int}/pdf")]
    public async Task<IActionResult> DescargarPdf(int evaluacionId)
    {
        var evaluacion = await _context.PermisoEnCalienteEvaluaciones
            .Include(e => e.Personal)
                .ThenInclude(p => p!.Empleado)
            .FirstOrDefaultAsync(e => e.Id == evaluacionId);

        if (evaluacion == null)
            return NotFound("Evaluación no encontrada");

        var permiso = await _context.PermisosEnCaliente
            .Include(p => p.Autorizantes)
                .ThenInclude(a => a.Empleado)
            .FirstOrDefaultAsync(p => p.Id == evaluacion.Personal!.PermisoEnCalienteId);

        if (permiso == null)
            return NotFound("Permiso no encontrado");

        var pdfBytes = _pdfService.Generar(permiso, evaluacion.Personal!, evaluacion);
        var nombre   = evaluacion.Personal?.Empleado?.NombreCompleto?.Replace(" ", "_") ?? "trabajador";
        var fileName = $"PermisoCaliente_{nombre}_{evaluacion.Id}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    // Crear evaluación
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearEvaluacionDto dto)
    {
        var eval = new PermisoEnCalienteEvaluacion
        {
            PermisoEnCalientePersonalId = dto.PersonalId,
            EvaluacionJson = dto.EvaluacionJson
        };
        _context.Add(eval);
        await _context.SaveChangesAsync();
        return Ok(eval.Id);
    }

    // Listar evaluaciones de una persona
    [HttpGet("personal/{personalId}")]
    public async Task<IActionResult> ObtenerPorPersonal(int personalId)
    {
        var lista = await _context.PermisoEnCalienteEvaluaciones
            .Where(x => x.PermisoEnCalientePersonalId == personalId)
            .OrderByDescending(x => x.Fecha)
            .Select(x => new { x.Id, x.Fecha })
            .ToListAsync();
        return Ok(lista);
    }

    // Obtener una evaluación
    [HttpGet("{id}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var eval = await _context.PermisoEnCalienteEvaluaciones
            .FirstOrDefaultAsync(x => x.Id == id);
        if (eval == null)
            return NotFound();
        return Ok(eval);
    }

    // Eliminar evaluación
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var eval = await _context.PermisoEnCalienteEvaluaciones.FindAsync(id);
        if (eval == null)
            return NotFound();
        _context.PermisoEnCalienteEvaluaciones.Remove(eval);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
