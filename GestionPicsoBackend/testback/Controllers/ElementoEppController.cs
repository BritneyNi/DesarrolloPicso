using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Models;
using testback.Data;
using testback.Dtos;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ElementoEppController : ControllerBase
    {
        
        private readonly ApplicationDbContext _context;
        private readonly BlobService _blobService;
        public ElementoEppController(ApplicationDbContext context,BlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        // 🔹 GET: api/ElementoEpp
        [HttpGet]
public async Task<ActionResult<IEnumerable<ElementoEppDto>>> GetAll()
{
    return await _context.ElementosEpp
        .OrderBy(e => e.Nombre)
        .Select(e => new ElementoEppDto
        {
            
            Id = e.Id,
            Nombre = e.Nombre,
            Tipo = e.Tipo,
            Descripcion = e.Descripcion,
            VidaUtilMeses = e.VidaUtilMeses,
            RequiereEvidencia = e.RequiereEvidencia,
            Estado = e.Estado,
            EvidenciaPath = e.EvidenciaPath,

            // 🔥 AQUÍ SE ARREGLA TODO
           FechaCreacion = DateTime.SpecifyKind(
                e.FechaCreacion,
                DateTimeKind.Utc
            ).ToString("o")
            // ISO UTC

        })
        .ToListAsync();
}


        // 🔹 GET: api/ElementoEpp/activos
       [HttpGet("activos")]
public async Task<ActionResult<IEnumerable<ElementoEppDto>>> GetActivos()
{
    return await _context.ElementosEpp
        .Where(e => e.Estado == "Activo")
        .OrderBy(e => e.Nombre)
        .Select(e => new ElementoEppDto
        {
            Id = e.Id,
            Nombre = e.Nombre,
            Tipo = e.Tipo,
            Descripcion = e.Descripcion,
            VidaUtilMeses = e.VidaUtilMeses,
            RequiereEvidencia = e.RequiereEvidencia,
            Estado = e.Estado,
            EvidenciaPath = e.EvidenciaPath,
            FechaCreacion = DateTime.SpecifyKind(
    e.FechaCreacion,
    DateTimeKind.Utc
).ToString("o")
 // ISO UTC

        })
        .ToListAsync();
}


        // 🔹 POST: api/ElementoEpp
       [HttpPost]
public async Task<ActionResult<ElementoEpp>> Create(
    [FromForm] ElementoEppCreateDto dto,
    IFormFile? evidencia)
{
    
    var elemento = new ElementoEpp
    {
        Nombre = dto.Nombre,
        Tipo = dto.Tipo,
        Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? null : dto.Descripcion,
        VidaUtilMeses = dto.VidaUtilMeses,
        RequiereEvidencia = dto.RequiereEvidencia,
        FechaCreacion = DateTime.UtcNow,
        Estado = "Activo"
    };

    if (evidencia != null)
    {
        elemento.EvidenciaPath = await _blobService.UploadFileAsync(evidencia);
    }

    _context.ElementosEpp.Add(elemento);
    await _context.SaveChangesAsync();
   
    return Ok(new ElementoEppDto
{
    Id = elemento.Id,
    Nombre = elemento.Nombre,
    Tipo = elemento.Tipo,
    Descripcion = elemento.Descripcion,
    VidaUtilMeses = elemento.VidaUtilMeses,
    RequiereEvidencia = elemento.RequiereEvidencia,
    Estado = elemento.Estado,
    EvidenciaPath = elemento.EvidenciaPath,
    FechaCreacion = DateTime.SpecifyKind(
    elemento.FechaCreacion,
    DateTimeKind.Utc
).ToString("o")
 // ISO UTC

});

}


        // 🔹 PUT: api/ElementoEpp/{id}
    [HttpPut("{id}")]
public async Task<IActionResult> Update(
    int id,
    [FromForm] ElementoEppCreateDto dto,
    IFormFile? evidencia)
{
    var existente = await _context.ElementosEpp.FindAsync(id);
    if (existente == null)
        return NotFound();

    // campos normales
    existente.Nombre = dto.Nombre;
    existente.Tipo = dto.Tipo;
    existente.VidaUtilMeses = dto.VidaUtilMeses;
    existente.RequiereEvidencia = dto.RequiereEvidencia;

    // descripción (CLAVE)
    if (string.IsNullOrWhiteSpace(dto.Descripcion))
        existente.Descripcion = null;
    else
        existente.Descripcion = dto.Descripcion;

    // evidencia
    if (evidencia != null)
    {
        existente.EvidenciaPath = await _blobService.UploadFileAsync(evidencia);
    }

    await _context.SaveChangesAsync();
    return NoContent();
}


        // 🔹 PATCH: api/ElementoEpp/{id}/estado
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(int id)
        {
            var elemento = await _context.ElementosEpp.FindAsync(id);
            if (elemento == null)
                return NotFound();

            elemento.Estado = elemento.Estado == "Activo" ? "Inactivo" : "Activo";
            await _context.SaveChangesAsync();

            return Ok(elemento);
        }

        // 🔹 GET: api/ElementoEpp/by-id/5
        [HttpGet("by-id/{id}")]
public async Task<ActionResult<ElementoEppDto>> GetById(int id)
{
    var e = await _context.ElementosEpp.FindAsync(id);
    if (e == null) return NotFound();
    return new ElementoEppDto
    {
        Id = e.Id,
        Nombre = e.Nombre,
        Tipo = e.Tipo,
        Descripcion = e.Descripcion,
        VidaUtilMeses = e.VidaUtilMeses,
        RequiereEvidencia = e.RequiereEvidencia,
        Estado = e.Estado,
        EvidenciaPath = e.EvidenciaPath,
        FechaCreacion = DateTime.SpecifyKind(
    e.FechaCreacion,
    DateTimeKind.Utc
).ToString("o")
 // ISO UTC

    };
}


        // 🔹 DELETE: api/ElementoEpp/{id}
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    var elemento = await _context.ElementosEpp.FindAsync(id);
    if (elemento == null)
        return NotFound();

    _context.ElementosEpp.Remove(elemento);
    await _context.SaveChangesAsync();

    return NoContent();
}



    }
}
