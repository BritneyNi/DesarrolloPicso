using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

[ApiController]
[Route("api/permiso-en-caliente")]
public class PermisoEnCalienteController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PermisoEnCalienteController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
public async Task<IActionResult> Crear([FromBody]PermisoEnCaliente permiso)
{
    if (permiso.Autorizantes != null)
    {
        foreach (var a in permiso.Autorizantes)
        {
            a.PermisoEnCaliente = permiso; // 🔥 CLAVE
        }
    }
    permiso.FechaCreacion = DateOnly.FromDateTime(DateTime.Now);

    _context.PermisosEnCaliente.Add(permiso);
    await _context.SaveChangesAsync();

    return Ok(permiso.Id);
}

[HttpPost("autorizar/{id}")]
public async Task<IActionResult> FirmarAutorizante(int id, [FromBody] string firmaBase64)
{
    var autorizante = await _context.PermisosEnCalienteAutorizantes.FindAsync(id);

    if (autorizante == null)
        return NotFound();

    autorizante.FirmaBase64 = firmaBase64;
    
    await _context.SaveChangesAsync();
    return Ok();
}


[HttpGet("{id}")]
public async Task<IActionResult> Obtener(int id)
{
    var permiso = await _context.PermisosEnCaliente
        .Include(x => x.Empleado)
        .Include(x => x.Autorizantes)
            .ThenInclude(a => a.Empleado)
        .Include(x => x.Personal)               // 🔥 AQUI
            .ThenInclude(p => p.Empleado)       // 🔥 AQUI
        .FirstOrDefaultAsync(x => x.Id == id);

    if (permiso == null)
        return NotFound();

    return Ok(permiso);
}


[HttpGet]
public async Task<IActionResult> ObtenerTodos()
{
    var permisos = await _context.PermisosEnCaliente
        .Include(x => x.Empleado)
        .Include(x => x.Autorizantes)
            .ThenInclude(a => a.Empleado)
        .Include(x => x.Personal)               // 🔥 AQUI
            .ThenInclude(p => p.Empleado)       // 🔥 AQUI
        .ToListAsync();

    return Ok(permisos);
}


[HttpDelete("{id}")]
public async Task<IActionResult> Eliminar(int id)
{
    var permiso = await _context.PermisosEnCaliente
        .Include(p => p.Autorizantes)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (permiso == null)
        return NotFound();

    // Eliminar autorizantes primero (si no tienes cascade)
    if (permiso.Autorizantes != null)
    {
        _context.PermisosEnCalienteAutorizantes.RemoveRange(permiso.Autorizantes);
    }

    _context.PermisosEnCaliente.Remove(permiso);
    await _context.SaveChangesAsync();

    return NoContent(); // 204
}

[HttpPut("{id}")]
public async Task<IActionResult> Actualizar(int id, [FromBody] PermisoEnCaliente dto)
{
    var permiso = await _context.PermisosEnCaliente
        .Include(p => p.Autorizantes)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (permiso == null)
        return NotFound();

    // 🔹 Campos simples
    permiso.NombreEmpresa = dto.NombreEmpresa;
    permiso.Nit = dto.Nit;
    permiso.Proyecto = dto.Proyecto;
    permiso.FechaInicio = dto.FechaInicio;
    permiso.FechaCierre = dto.FechaCierre;
    permiso.NumeroPermiso = dto.NumeroPermiso;
    permiso.Herramientas = dto.Herramientas;
    permiso.TipoTrabajo = dto.TipoTrabajo;
    permiso.DescripcionTarea = dto.DescripcionTarea;

    // 🔹 Arrays (checkboxes)
    permiso.ElementosProteccion = dto.ElementosProteccion;
    permiso.Peligros = dto.Peligros;

    // 🔹 Autorizantes (versión segura por ahora)
    if (dto.Autorizantes != null)
    {
        _context.PermisosEnCalienteAutorizantes.RemoveRange(permiso.Autorizantes);

        foreach (var a in dto.Autorizantes)
        {
            a.Id = 0; // evita conflictos
            a.PermisoEnCalienteId = permiso.Id;
            _context.PermisosEnCalienteAutorizantes.Add(a);
        }
    }

    await _context.SaveChangesAsync();
    return NoContent();
}


}
