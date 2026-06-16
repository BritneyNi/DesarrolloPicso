using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Dtos;
using testback.Services.Pdf;


namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ElementoEppInventarioController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ElementoEppInventarioController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<List<InventarioGeneralPdfDto>> ObtenerInventarioGeneralBase()
{
    return await _context.ElementosEppInventario
        .Include(i => i.ElementoEpp)
        .GroupBy(i => new
        {
            i.ElementoEppId,
            i.ElementoEpp.Nombre,
            i.ElementoEpp.Tipo
        })
        .Select(g => new InventarioGeneralPdfDto
        {   
            ElementoEppId = g.Key.ElementoEppId,
            ElementoNombre = g.Key.Nombre,
            ElementoTipo = g.Key.Tipo,
            TotalCantidad = g.Sum(x => x.CantidadTotal),
            TotalDisponible = g.Sum(x => x.CantidadDisponible)
        })
        .OrderBy(x => x.ElementoNombre)
        .ToListAsync();
}


        // 🔹 GET: api/ElementoEppInventario/elemento/5
        // Inventario por elemento (detalle por talla / tipo)
        [HttpGet("elemento/{elementoId}")]
        public async Task<ActionResult> GetByElemento(int elementoId)
        {
            var inventarios = await _context.ElementosEppInventario
                .Where(i => i.ElementoEppId == elementoId)
                .Select(i => new
                {
                    i.Id,
                    i.Talla,
                    i.Tipo,
                    i.FechaRecepcion,
                    i.CantidadTotal,
                    i.CantidadDisponible,
                    i.EvidenciaUrl,
                    i.StockMinimo,
                    estadoStock =
                        i.CantidadDisponible == 0 ? "Agotado" :
                        i.CantidadDisponible <= i.StockMinimo ? "Bajo" :
                        "OK"
                })
                .OrderBy(i => i.Talla)
                .ToListAsync();

            return Ok(inventarios);
        }

        // 🔹 GET: api/ElementoEppInventario
        // Listado plano de inventarios
        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var inventarios = await _context.ElementosEppInventario
                .Include(i => i.ElementoEpp)
                .Select(i => new
                {
                    i.Id,
                    elementoNombre = i.ElementoEpp.Nombre,
                    i.Talla,
                    i.Tipo,
                    i.CantidadTotal,
                    i.CantidadDisponible,
                    i.StockMinimo,
                    estadoStock =
                        i.CantidadDisponible == 0 ? "Agotado" :
                        i.CantidadDisponible <= i.StockMinimo ? "Bajo" :
                        "OK"
                })
                .OrderBy(i => i.elementoNombre)
                .ThenBy(i => i.Talla)
                .ToListAsync();

            return Ok(inventarios);
        }

        // 🔹 GET: api/ElementoEppInventario/inventario-general
        // Resumen general + detalle
       [HttpGet("inventario-general")]
public async Task<ActionResult> GetInventarioGeneral()
{
    var data = await ObtenerInventarioGeneralBase();
    return Ok(data);
}


        // 🔹 POST: api/ElementoEppInventario
        // Crear o sumar inventario
[HttpPost]
public async Task<ActionResult> Create(
    [FromForm] ElementoEppInventarioCreateDto dto)
{
    dto.Tipo = string.IsNullOrWhiteSpace(dto.Tipo)
    ? null
    : dto.Tipo.Trim();

    if (dto.CantidadTotal <= 0)
        return BadRequest("La cantidad debe ser mayor a cero");

    string? evidenciaUrl = null;

    if (dto.Evidencia != null)
    {
        var fileName = $"{Guid.NewGuid()}_{dto.Evidencia.FileName}";
        var path = Path.Combine("wwwroot/evidencias", fileName);

        Directory.CreateDirectory("wwwroot/evidencias");

        using var stream = new FileStream(path, FileMode.Create);
        await dto.Evidencia.CopyToAsync(stream);

        evidenciaUrl = $"/evidencias/{fileName}";
    }

    var existente = await _context.ElementosEppInventario
        .FirstOrDefaultAsync(i =>
            i.ElementoEppId == dto.ElementoEppId &&
            i.Talla == dto.Talla &&
            i.Tipo == dto.Tipo
        );

    if (existente != null)
    {
        existente.CantidadTotal += dto.CantidadTotal;
        existente.CantidadDisponible += dto.CantidadTotal;

        _context.InventarioMovimientos.Add(new InventarioMovimiento
        {
            ElementoEppId = existente.ElementoEppId,
            Talla = existente.Talla,
            Tipo = existente.Tipo,
            TipoMovimiento = "Entrada",
            Cantidad = dto.CantidadTotal,
            Fecha = DateTime.UtcNow,
            
 
            EvidenciaUrl = evidenciaUrl,
            Observacion = "Recepción de inventario"
        });

        if (evidenciaUrl != null)
            existente.EvidenciaUrl = evidenciaUrl;

        await _context.SaveChangesAsync();
        return Ok(existente);
    }

    var inventario = new ElementoEppInventario
    {
        ElementoEppId = dto.ElementoEppId,
        Talla = dto.Talla,
        Tipo = dto.Tipo,
        FechaRecepcion = dto.FechaRecepcion,
        CantidadTotal = dto.CantidadTotal,
        CantidadDisponible = dto.CantidadTotal,
        EvidenciaUrl = evidenciaUrl
    };

    _context.ElementosEppInventario.Add(inventario);

    _context.InventarioMovimientos.Add(new InventarioMovimiento
    {
        ElementoEppId = dto.ElementoEppId,
        Talla = dto.Talla,
        Tipo = dto.Tipo,
        TipoMovimiento = "Entrada",
        Cantidad = dto.CantidadTotal,
        Fecha = DateTime.UtcNow,
        EvidenciaUrl = evidenciaUrl,
        Observacion = "Recepción inicial de inventario"
    });

    await _context.SaveChangesAsync();

    return Ok(inventario);
}

[HttpGet("movimientos")]
public async Task<ActionResult> GetMovimientos(
    int elementoEppId,
    string? talla,
    string? tipo)
{
    // 1️⃣ Query base
    var query = _context.InventarioMovimientos.AsQueryable();

    // 2️⃣ Filtro por elemento
    query = query.Where(m => m.ElementoEppId == elementoEppId);

    // 3️⃣ Filtros opcionales
    if (!string.IsNullOrEmpty(talla))
        query = query.Where(m => m.Talla == talla);

    if (!string.IsNullOrEmpty(tipo))
        query = query.Where(m => m.Tipo == tipo);

    // 4️⃣ Incluir relaciones necesarias
    query = query
        .Include(m => m.UsuarioEntrega)
        .Include(m => m.EmpleadoRecibe)
        .Include(m => m.EntregaEpp);

    // 5️⃣ Proyección a DTO anónimo con agrupación por acta
    var movimientos = await query
        .OrderByDescending(m => m.Fecha)
        .Select(m => new
        {
            m.Id,
            m.EntregaEppId,
            ActaEntregaEppId = m.EntregaEpp != null ? m.EntregaEpp.ActaEntregaEppId : (int?)null, 
            m.Fecha,
            m.TipoMovimiento,
            m.Cantidad,
            m.Talla,
            m.Tipo,
            m.Observacion,
            usuarioEntregaNombre = m.UsuarioEntrega != null ? m.UsuarioEntrega.NombreCompleto : null,
            empleadoRecibeNombre = m.EmpleadoRecibe != null ? m.EmpleadoRecibe.NombreCompleto : null
        })
        .ToListAsync();

    // 6️⃣ Agrupar por ActaEntregaEppId
    var agrupado = movimientos
        .GroupBy(m => m.ActaEntregaEppId)
        .Select(g => new
        {
            ActaEntregaEppId = g.Key,
            Movimientos = g.ToList()
        })
        .ToList();

    return Ok(agrupado);
}

        // 🔹 DELETE: api/ElementoEppInventario/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var inventario = await _context.ElementosEppInventario
                .FirstOrDefaultAsync(i => i.Id == id);

            if (inventario == null)
                return NotFound("Registro de inventario no encontrado");

            if (inventario.CantidadDisponible < inventario.CantidadTotal)
                return BadRequest("No se puede eliminar: el inventario ya tiene movimientos");

            _context.ElementosEppInventario.Remove(inventario);
            await _context.SaveChangesAsync();

            return Ok();
        }

       [HttpPost("pdf-general")]
public async Task<IActionResult> PdfGeneral(
    [FromBody] InventarioPdfRequestDto request,
    [FromServices] InventarioGeneralPdfService pdfService)
{
    var data = await ObtenerInventarioGeneralBase();

    foreach (var e in data)
        e.Estado = Estado(e.TotalCantidad, e.TotalDisponible);

    int ok = data.Count(e => e.Estado == "OK");
    int bajo = data.Count(e => e.Estado == "Bajo");
    int agotado = data.Count(e => e.Estado == "Agotado");

    var detallePorElemento = await _context.ElementosEppInventario
        .GroupBy(i => i.ElementoEppId)
        .ToDictionaryAsync(
            g => g.Key,
            g => g.GroupBy(x => new { x.Talla, x.Tipo })
                  .Select(x => new InventarioElementoDetallePdfDto
                  {
                      Talla = x.Key.Talla,
                      Tipo = x.Key.Tipo,
                      CantidadTotal = x.Sum(v => v.CantidadTotal),
                      CantidadDisponible = x.Sum(v => v.CantidadDisponible)
                  })
                  .OrderBy(x => x.Talla)
                  .ToList()
        );

    var pdf = pdfService.Generar(
        data,
        detallePorElemento,
        ok,
        bajo,
        agotado,
        request.GraficoBase64 // 👈 AQUÍ
    );

    return File(pdf, "application/pdf", "Inventario-General.pdf");
}


[HttpGet("pdf-elemento/{elementoId}")]
public async Task<IActionResult> PdfPorElemento(
    int elementoId,
    [FromServices] InventarioElementoPdfService pdfService)
{
    var elemento = await _context.ElementosEpp
        .Where(e => e.Id == elementoId)
        .Select(e => new
        {
            e.Id,
            e.Nombre,
            e.Tipo
        })
        .FirstOrDefaultAsync();

    if (elemento == null)
        return NotFound("Elemento no encontrado");

    var detalle = await _context.ElementosEppInventario
        .Where(i => i.ElementoEppId == elementoId)
        .GroupBy(i => new { i.Talla, i.Tipo })
        .Select(g => new InventarioElementoDetallePdfDto
        {
            Talla = g.Key.Talla,
            Tipo = g.Key.Tipo,
            CantidadTotal = g.Sum(x => x.CantidadTotal),
            CantidadDisponible = g.Sum(x => x.CantidadDisponible)
        })
        .OrderBy(x => x.Talla)
        .ToListAsync();

    var pdf = pdfService.Generar(
        elemento.Nombre,
        elemento.Tipo,
        detalle
    );

    return File(pdf, "application/pdf", $"Inventario-{elemento.Nombre}.pdf");
}


private string Estado(int total, int disponible)
{
    if (disponible == 0) return "Agotado";
    if (disponible <= total * 0.3) return "Bajo";
    return "OK";
}

    }
}
