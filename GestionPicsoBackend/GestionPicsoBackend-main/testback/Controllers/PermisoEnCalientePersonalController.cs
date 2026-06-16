using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Dtos;

[ApiController]
[Route("api/permiso-en-caliente-personal")]
public class PermisoEnCalientePersonalController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PermisoEnCalientePersonalController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 🔹 Obtener personal de un permiso
    [HttpGet("{permisoId}")]
    public async Task<IActionResult> ObtenerPorPermiso(int permisoId)
    {
        var personal = await _context.PermisosEnCalientePersonal
            .Include(p => p.Empleado)
            .Where(p => p.PermisoEnCalienteId == permisoId)
            .ToListAsync();

        return Ok(personal);
    }

    // 🔹 Agregar personal
    [HttpPost]
    public async Task<IActionResult> Agregar([FromBody] PermisoEnCalientePersonal dto)
    {
        _context.PermisosEnCalientePersonal.Add(dto);
        await _context.SaveChangesAsync();
        return Ok(dto.Id);
    }

    // 🔹 Eliminar personal
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var item = await _context.PermisosEnCalientePersonal.FindAsync(id);
        if (item == null)
            return NotFound();

        _context.PermisosEnCalientePersonal.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/firmar")]
public async Task<IActionResult> Firmar(int id, [FromBody] FirmarDto dto)
{
    var registro = await _context.PermisosEnCalientePersonal
        .FirstOrDefaultAsync(x => x.Id == id);

    if (registro == null)
        return NotFound();

    registro.FirmaBase64 = dto.FirmaBase64;

    await _context.SaveChangesAsync();

    return Ok();
}


// 🔹 Obtener evaluación de un personal
[HttpGet("{id}/evaluacion")]
public async Task<IActionResult> ObtenerEvaluacion(int id)
{
    var registro = await _context.PermisosEnCalientePersonal
        .Where(x => x.Id == id)
        .Select(x => new
        {
            x.Id,
            x.EvaluacionJson
        })
        .FirstOrDefaultAsync();

    if (registro == null)
        return NotFound();

    return Ok(registro);
}

// 🔹 Guardar evaluación
[HttpPost("{id}/evaluacion")]
public async Task<IActionResult> GuardarEvaluacion(int id, [FromBody] GuardarEvaluacionDto dto)
{
    var registro = await _context.PermisosEnCalientePersonal
        .FirstOrDefaultAsync(x => x.Id == id);

    if (registro == null)
        return NotFound();

    registro.EvaluacionJson = dto.EvaluacionJson;

    await _context.SaveChangesAsync();

    return Ok();
}

}
