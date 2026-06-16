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
    public class EntregaEppController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAzureBlobService _blobService;
        public EntregaEppController(ApplicationDbContext context,IAzureBlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        // 🔹 GET: api/EntregaEpp
        [HttpGet]
public async Task<ActionResult<IEnumerable<object>>> GetAll()
{
    var entregas = await _context.EntregasEpp
        .Include(e => e.Empleado)
        .Include(e => e.ElementoEppInventario)
            .ThenInclude(i => i.ElementoEpp)
        .OrderByDescending(e => e.FechaEntrega)
        .ToListAsync();

    var resultado = entregas.Select(e => new
    {
        e.Id,
        e.EmpleadoId,
        empleadoNombre = e.Empleado.NombreCompleto,

        e.ElementoEppInventarioId,
        elementoNombre = e.ElementoEppInventario.ElementoEpp.Nombre,
        talla = e.ElementoEppInventario.Talla,
        cantidad = e.CantidadEntregada,

        e.FechaEntrega,
        e.FechaVencimiento,
        e.Estado,
        e.Observaciones,
        actaEntregaEppId = e.ActaEntregaEppId
    });

    return Ok(resultado);
}


      // 🔹 GET: api/EntregaEpp/empleado/5
[HttpGet("empleado/{empleadoId}")]
public async Task<ActionResult<IEnumerable<object>>> GetByEmpleado(int empleadoId)
{
    var entregas = await _context.EntregasEpp
        .Where(e => e.EmpleadoId == empleadoId)
        .Include(e => e.ElementoEppInventario)
        .ThenInclude(i => i.ElementoEpp)
        .OrderByDescending(e => e.FechaEntrega)
        .ToListAsync();

    var resultado = entregas.Select(e => new
    {
        e.Id,
        e.FechaEntrega,
        e.FechaVencimiento,
        e.Estado,
        e.Observaciones,

        elementoNombre = e.ElementoEppInventario!.ElementoEpp!.Nombre,
        talla = e.ElementoEppInventario!.Talla
    });

    return Ok(resultado);
}


        // 🔹 POST: api/EntregaEpp
   [HttpPost]
public async Task<ActionResult> Create(EntregaEpp entrega)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    var inventario = await _context.ElementosEppInventario
        .FirstOrDefaultAsync(i => i.Id == entrega.ElementoEppInventarioId);

    if (inventario == null)
        return BadRequest("Inventario no encontrado");

    if (inventario.CantidadDisponible < 1)
        return BadRequest("No hay stock disponible");

    inventario.CantidadDisponible--;

    entrega.FechaEntrega = DateTime.Now;
    entrega.Estado = "Activo";

    _context.EntregasEpp.Add(entrega);
    await _context.SaveChangesAsync();

    _context.InventarioMovimientos.Add(new InventarioMovimiento
{
    ElementoEppId = inventario.ElementoEppId,
    Talla = inventario.Talla,
    Tipo = inventario.Tipo,
    TipoMovimiento = "Salida",
    Cantidad = 1,
    Fecha = DateTime.UtcNow,
    EmpleadoRecibeId = entrega.EmpleadoId,
    EntregaEppId = entrega.Id,
    Observacion = $"Entrega individual #{entrega.Id}"
});


    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

    return Ok(entrega);
}



[HttpPost("multiple")]
public async Task<IActionResult> CrearEntregaMultiple([FromBody] EntregaMultipleDto dto)
{
    if (dto.Items == null || !dto.Items.Any())
        return BadRequest("No se enviaron elementos");

    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        foreach (var item in dto.Items)
        {
            var inventario = await _context.ElementosEppInventario
                .FirstOrDefaultAsync(i => i.Id == item.InventarioId);

            if (inventario == null)
                throw new Exception("Inventario no encontrado");

            if (inventario.CantidadDisponible < item.Cantidad)
                throw new Exception($"Stock insuficiente para {inventario.ElementoEppId}");

            inventario.CantidadDisponible -= item.Cantidad;
            
        var entrega = new EntregaEpp
{
    EmpleadoId = dto.EmpleadoId,
    ElementoEppInventarioId = item.InventarioId,
    CantidadEntregada = item.Cantidad,
    FechaEntrega = DateTime.Now,
    Estado = "Activo",
    Observaciones = dto.Observaciones
};

_context.EntregasEpp.Add(entrega);
await _context.SaveChangesAsync();

_context.InventarioMovimientos.Add(new InventarioMovimiento
{
    ElementoEppId = inventario.ElementoEppId,
    Talla = inventario.Talla,
    Tipo = inventario.Tipo,
    TipoMovimiento = "Salida",
    Cantidad = item.Cantidad,
    Fecha = DateTime.UtcNow,
    EmpleadoRecibeId = dto.EmpleadoId,
    EntregaEppId = entrega.Id,
    Observacion = "Entrega múltiple"
});

        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { mensaje = "Dotación entregada correctamente" });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        return BadRequest(ex.Message);
    }
}



[HttpGet("elemento/{elementoId}")]
public async Task<ActionResult<IEnumerable<object>>> GetByElemento(int elementoId)
{
    var inventarios = await _context.ElementosEppInventario
        .Include(i => i.ElementoEpp)
        .Where(i => i.ElementoEppId == elementoId && i.CantidadDisponible > 0)
        .ToListAsync();

    var resultado = inventarios.Select(i => new
    {
        i.Id,
        i.Talla,
        i.CantidadDisponible,
        i.ElementoEppId,
        elementoNombre = i.ElementoEpp.Nombre
    });

    return Ok(resultado);
}



        // 🔹 PATCH: api/EntregaEpp/5/estado?estado=Vencido
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromQuery] string estado)
        {
            var entrega = await _context.EntregasEpp.FindAsync(id);
            if (entrega == null)
                return NotFound();

            entrega.Estado = estado;
            await _context.SaveChangesAsync();

            return Ok(entrega);
        }

        // 🔹 PATCH: api/EntregaEpp/verificar-vencimientos
[HttpPatch("verificar-vencimientos")]
public async Task<IActionResult> VerificarVencimientos()
{
    var hoy = DateTime.Today;

    var vencidos = await _context.EntregasEpp
        .Where(e =>
            e.Estado == "Activo" &&
            e.FechaVencimiento != null &&
            e.FechaVencimiento < hoy)
        .ToListAsync();

    foreach (var entrega in vencidos)
    {
        entrega.Estado = "Vencido";
    }

    await _context.SaveChangesAsync();

    return Ok(new
    {
        total = vencidos.Count,
        mensaje = "Entregas vencidas actualizadas"
    });
}

// 🔹 GET: api/EntregaEpp/resumen
[HttpGet("resumen")]
public async Task<IActionResult> Resumen()
{
    var resumen = await _context.EntregasEpp
        .GroupBy(e => e.Estado)
        .Select(g => new
        {
            Estado = g.Key,
            Total = g.Count()
        })
        .ToListAsync();

    return Ok(resumen);
}

[HttpPatch("{id}/devolver")]
public async Task<IActionResult> Devolver(int id)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    var entrega = await _context.EntregasEpp
        .FirstOrDefaultAsync(e => e.Id == id);

    if (entrega == null)
        return NotFound("Entrega no encontrada");

    if (entrega.Estado == "Devuelto")
        return BadRequest("La entrega ya fue devuelta");

    var inventario = await _context.ElementosEppInventario
        .FirstOrDefaultAsync(i => i.Id == entrega.ElementoEppInventarioId);

    if (inventario == null)
        return BadRequest("Inventario no encontrado");

    inventario.CantidadDisponible += entrega.CantidadEntregada;

    _context.InventarioMovimientos.Add(new InventarioMovimiento
{
    ElementoEppId = inventario.ElementoEppId,
    Talla = inventario.Talla,
    Tipo = inventario.Tipo,
    TipoMovimiento = "Devolucion",
    Cantidad = entrega.CantidadEntregada,
    Fecha = DateTime.UtcNow,
    EmpleadoRecibeId = entrega.EmpleadoId,
    Observacion = $"Devolución entrega #{entrega.Id}"
});


    entrega.Estado = "Devuelto";

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

    return Ok(new { mensaje = "Elemento devuelto correctamente" });
}

[HttpPatch("{id}/perdido")]
public async Task<IActionResult> Perdido(int id)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    var entrega = await _context.EntregasEpp
        .FirstOrDefaultAsync(e => e.Id == id);

    if (entrega == null)
        return NotFound();

    if (entrega.Estado == "Perdido")
        return BadRequest("La entrega ya está marcada como perdida");

    var inventario = await _context.ElementosEppInventario
        .FirstOrDefaultAsync(i => i.Id == entrega.ElementoEppInventarioId);

    if (inventario == null)
        return BadRequest("Inventario no encontrado");

    _context.InventarioMovimientos.Add(new InventarioMovimiento
    {
        ElementoEppId = inventario.ElementoEppId,
        Talla = inventario.Talla,
        Tipo = inventario.Tipo,
        TipoMovimiento = "Ajuste",
        Cantidad = entrega.CantidadEntregada,
        Fecha = DateTime.UtcNow,
        EmpleadoRecibeId = entrega.EmpleadoId,
        Observacion = $"Elemento perdido - Entrega #{entrega.Id}"
    });

    entrega.Estado = "Perdido";

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

    return Ok(new { mensaje = "Elemento marcado como perdido" });
}


[HttpPost("confirmar")]
public async Task<IActionResult> ConfirmarEntrega(
    [FromBody] ConfirmarEntregaEppDto dto)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var empleado = await _context.Empleado.FindAsync(dto.EmpleadoId);
        if (empleado == null)
            return BadRequest("Empleado no existe");

        var responsable = await _context.Empleado.FindAsync(dto.ResponsableId);
        if (responsable == null)
            return BadRequest("Responsable no existe");

        if (string.IsNullOrWhiteSpace(dto.LugarEntrega))
            return BadRequest("Debe indicar el lugar de entrega");

        var acta = new ActaEntregaEpp
        {
            EmpleadoId = dto.EmpleadoId,
            ResponsableId = dto.ResponsableId,
            QuienRecibe = dto.ResponsableEnvio,
            LugarEntrega = dto.LugarEntrega,
            Observaciones = dto.Observaciones,
            FirmaEmpleadoUrl = "pendiente",
            FirmaResponsableUrl = "pendiente"
        };

        _context.ActasEntregaEpp.Add(acta);
        await _context.SaveChangesAsync();

        foreach (var item in dto.Items)
        {
            var inventario = await _context.ElementosEppInventario
                .FirstOrDefaultAsync(i => i.Id == item.ElementoEppInventarioId);

            if (inventario == null)
                throw new Exception("Inventario no encontrado");

            if (inventario.CantidadDisponible < item.Cantidad)
                throw new Exception("Stock insuficiente");

            inventario.CantidadDisponible -= item.Cantidad;

            var entrega = new EntregaEpp
            {
                EmpleadoId = dto.EmpleadoId,
                ElementoEppInventarioId = item.ElementoEppInventarioId,
                CantidadEntregada = item.Cantidad,
                FechaVencimiento = item.FechaVencimiento,
                Estado = "Activo",
                ActaEntregaEppId = acta.Id
            };

            _context.EntregasEpp.Add(entrega);
            await _context.SaveChangesAsync();

            _context.InventarioMovimientos.Add(new InventarioMovimiento
            {
                ElementoEppId = inventario.ElementoEppId,
                Talla = inventario.Talla,
                Tipo = inventario.Tipo,
                TipoMovimiento = "Salida",
                Cantidad = item.Cantidad,
                Fecha = DateTime.UtcNow,
                UsuarioEntregaId = dto.ResponsableId,
                EmpleadoRecibeId = dto.EmpleadoId,
                EntregaEppId = entrega.Id,
                Observacion = $"Entrega EPP - Acta #{acta.Id}"
            });
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            actaId = acta.Id,
            mensaje = "Entrega confirmada y firmada"
        });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        return BadRequest(ex.Message);
    }
}

[HttpPost("firmar-acta")]
public async Task<IActionResult> FirmarActa([FromBody] FirmarActaDto dto)
{
    var acta = await _context.ActasEntregaEpp
        .FirstOrDefaultAsync(a => a.Id == dto.ActaId);

    if (acta == null)
        return NotFound("Acta no encontrada");

    var container = "firmas-actas";
    var fecha = DateTime.Now.ToString("yyyyMMddHHmmss");

    if (dto.Tipo == "empleado")
    {
        if (string.IsNullOrEmpty(dto.FirmaEmpleadoBase64))
            return BadRequest("Firma del empleado es obligatoria");

        var url = await _blobService.UploadBase64Async(
            dto.FirmaEmpleadoBase64,
            container,
            $"acta_{acta.Id}_empleado_{fecha}.png"
        );

        acta.FirmaEmpleadoUrl = url;
    }
    else if (dto.Tipo == "responsable")
    {
        if (string.IsNullOrEmpty(dto.FirmaResponsableBase64))
            return BadRequest("Firma del responsable es obligatoria");

        var url = await _blobService.UploadBase64Async(
            dto.FirmaResponsableBase64,
            container,
            $"acta_{acta.Id}_responsable_{fecha}.png"
        );

        acta.FirmaResponsableUrl = url;
    }
    else
    {
        return BadRequest("Tipo inválido");
    }

    await _context.SaveChangesAsync();

    return Ok(new
    {
        mensaje = "Firma guardada correctamente",
        actaId = acta.Id
    });
}

[HttpPost("subir-evidencia")]
public async Task<IActionResult> SubirEvidencia(
    [FromBody] SubirEvidenciaEntregaDto dto)
{
    var entrega = await _context.EntregasEpp
        .FirstOrDefaultAsync(e => e.Id == dto.EntregaEppId);

    if (entrega == null)
        return NotFound("Entrega no encontrada");

    var container = "evidencias";
    var fecha = DateTime.Now.ToString("yyyyMMddHHmmss");

    var nombreBlob = $"entrega_{entrega.Id}_{fecha}_{dto.NombreArchivo}";

    var url = await _blobService.UploadBase64Async(
        dto.ArchivoBase64,
        container,
        nombreBlob
    );

    var evidencia = new EvidenciaEntregaEpp
    {
        EntregaEppId = entrega.Id,
        Url = url,
        NombreArchivo = dto.NombreArchivo
    };

    _context.EvidenciasEntregaEpp.Add(evidencia);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        mensaje = "Evidencia subida correctamente",
        url
    });
}

[HttpGet("historial")]
public async Task<ActionResult<IEnumerable<HistorialActaDto>>> GetHistorial()
{
    var actas = await _context.ActasEntregaEpp
        .Include(a => a.Empleado)
        .Include(a => a.Responsable)
        .Include(a => a.Entregas)
        .ThenInclude(e => e.ElementoEppInventario)
        .ThenInclude(i => i.ElementoEpp)
        .Include(a => a.Entregas)
        .ThenInclude(e => e.EvidenciasEntregaEpp)
        .OrderByDescending(a => a.Id)
        .ToListAsync();

    var resultado = actas.Select(a => new HistorialActaDto
    {
        ActaId = a.Id,
        EmpleadoId = a.EmpleadoId,
        EmpleadoNombre = a.Empleado?.NombreCompleto ?? "—",
        ResponsableNombre = a.Responsable?.NombreCompleto ?? "—",
        QuienRecibe = a.QuienRecibe ?? "—",
        LugarEntrega = a.LugarEntrega ?? "—",
        FechaEntrega = a.Entregas.Any() ? a.Entregas.Min(e => e.FechaEntrega) : (DateTime?)null,
        Observaciones = a.Observaciones ?? "",
        FirmaEmpleadoUrl = a.FirmaEmpleadoUrl,
        FirmaResponsableUrl = a.FirmaResponsableUrl,
        Elementos = a.Entregas.Select(e => new HistorialElementoDto
        {
            Id = e.Id,
            Nombre = e.ElementoEppInventario?.ElementoEpp?.Nombre ?? "—",
            Talla = e.ElementoEppInventario?.Talla ?? "—",
            Cantidad = e.CantidadEntregada,
            Estado = e.Estado,
            Observaciones = e.Observaciones,
            FechaEntrega = e.FechaEntrega,
            Evidencias = e.EvidenciasEntregaEpp?.Select(ev => ev.Url).ToList() ?? new List<string>()
        }).ToList()
    });

    return Ok(resultado);
}

[HttpGet("acta/{id}/pdf")]
public async Task<IActionResult> DescargarActaPdf(
    int id,
    [FromServices] ActaEntregaEppPdfService pdfService)
{
    var acta = await _context.ActasEntregaEpp
        .Include(a => a.Empleado)
        .Include(a => a.Responsable)
        .Include(a => a.Entregas)
        .ThenInclude(e => e.ElementoEppInventario)
        .ThenInclude(i => i.ElementoEpp)
        .FirstOrDefaultAsync(a => a.Id == id);

    if (acta == null)
        return NotFound();

    var dto = new ActaEntregaEppPdfDto
    {
        ActaId = acta.Id,
        Empleado = acta.Empleado.NombreCompleto,
        EmpleadoCedula = acta.Empleado.Cedula,
        EmpleadoCargo = acta.Empleado.Cargo,
        Responsable = acta.Responsable.NombreCompleto,
        ResponsableCedula = acta.Responsable.Cedula,
        ResponsableCargo = acta.Responsable.Cargo,
        QuienRecibe = acta.QuienRecibe ?? "",
        LugarEntrega = acta.LugarEntrega ?? "",
        FechaEntrega = acta.Entregas.Min(e => e.FechaEntrega),
        Observaciones = acta.Observaciones ?? "",
        FirmaEmpleadoUrl = acta.FirmaEmpleadoUrl,
        FirmaResponsableUrl = acta.FirmaResponsableUrl,
        Elementos = acta.Entregas.Select(e => new ActaEntregaElementoPdfDto
        {
            Elemento = e.ElementoEppInventario!.ElementoEpp!.Nombre,
            Tipo = e.ElementoEppInventario!.Tipo,
            Talla = e.ElementoEppInventario.Talla,
            Cantidad = e.CantidadEntregada,
            Estado = e.Estado
        }).ToList()
    };

    var pdf = await pdfService.Generar(dto);

    return File(pdf, "application/pdf", $"Acta_Entrega_{acta.Id}.pdf");
}

[HttpGet("empleado/{empleadoId}/pdf")]
public async Task<IActionResult> DescargarPdfEmpleado(
    int empleadoId,
    DateTime? desde,
    DateTime? hasta,
    [FromServices] EntregaEppEmpleadoPdfService pdfService)
{
    var entregas = await _context.EntregasEpp
        .Include(e => e.Empleado)
        .Include(e => e.ElementoEppInventario)
        .ThenInclude(i => i.ElementoEpp)
        .Include(e => e.ActaEntregaEpp)
        .ThenInclude(a => a.Responsable)
        .Where(e => e.EmpleadoId == empleadoId)
        .OrderByDescending(e => e.FechaEntrega)
        .ToListAsync();

    if (desde.HasValue)
        entregas = entregas.Where(e => e.FechaEntrega >= desde.Value).ToList();
    if (hasta.HasValue)
        entregas = entregas.Where(e => e.FechaEntrega <= hasta.Value).ToList();

    var actasDto = entregas
        .GroupBy(e => e.ActaEntregaEppId ?? 0)
        .Select(g => new EntregaEmpleadoActaPdfDto
        {
            ActaId = g.Key,
            FechaEntrega = g.Min(e => e.FechaEntrega),
            EmpleadoNombre = g.FirstOrDefault()?.Empleado?.NombreCompleto ?? "—",
            EmpleadoCargo = g.FirstOrDefault()?.Empleado?.Cargo ?? "—",
            EmpleadoCedula = g.FirstOrDefault()?.Empleado?.Cedula ?? "—",
            ResponsableNombre = g.FirstOrDefault()?.ActaEntregaEpp?.Responsable?.NombreCompleto ?? "—",
            ResponsableCargo = g.FirstOrDefault()?.ActaEntregaEpp?.Responsable?.Cargo ?? "—",
            ResponsableCedula = g.FirstOrDefault()?.ActaEntregaEpp?.Responsable?.Cedula ?? "—",
            QuienRecibe = g.FirstOrDefault()?.ActaEntregaEpp?.QuienRecibe ?? "—",
            LugarEntrega = g.FirstOrDefault()?.ActaEntregaEpp?.LugarEntrega ?? "—",
            // 🔹 NUEVO: firmas
            FirmaEmpleadoUrl = g.FirstOrDefault()?.ActaEntregaEpp?.FirmaEmpleadoUrl,
            FirmaResponsableUrl = g.FirstOrDefault()?.ActaEntregaEpp?.FirmaResponsableUrl,
            Elementos = g.Select(e => new EntregaEmpleadoElementoPdfDto
            {
                Elemento = e.ElementoEppInventario!.ElementoEpp!.Nombre,
                Tipo = e.ElementoEppInventario!.Tipo,
                Talla = e.ElementoEppInventario.Talla,
                Cantidad = e.CantidadEntregada,
                Estado = e.Estado,
                FechaEntrega = e.FechaEntrega
            }).ToList()
        })
        .Where(a => a.Elementos.Any())
        .ToList();

    // 🔹 NUEVO: await porque Generar ahora es async
    var pdf = await pdfService.Generar(actasDto);

    return File(pdf, "application/pdf", $"Historial_Dotacion_Empleado_{empleadoId}.pdf");
}

    }
}