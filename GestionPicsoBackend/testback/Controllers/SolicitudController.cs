    using System;                                 
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using testback.Data;
    using testback.Models;

    namespace testback.Controllers
    {
        [ApiController]
        [Route("api/[controller]")]
        public class SolicitudController : ControllerBase
        {
            private readonly ApplicationDbContext _context;

            public SolicitudController(ApplicationDbContext context)
            {
                _context = context;
            }

        [HttpGet]
        public async Task<IActionResult> GetSolicitudes()
        {
            var list = await _context.Solicitud
                .Include(s => s.Items).ThenInclude(i => i.Inventario).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
            public async Task<IActionResult> GetSolicitudById(int id)
            {
                var solicitud = await _context.Solicitud
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (solicitud == null)
                    return NotFound();

                return Ok(solicitud);
            }
        [HttpPost]
        public async Task<IActionResult> CreateSolicitud([FromBody] Solicitud solicitud)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
       
            var zonaColombia = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time");
            solicitud.FechaSolicitud = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zonaColombia);

            solicitud.Estado = EstadoSolicitud.Pendiente;

            foreach (var item in solicitud.Items)
            {
                _context.Entry(item).State = EntityState.Added;
            }

            _context.Solicitud.Add(solicitud);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSolicitudes), new { id = solicitud.Id }, solicitud);
        }


        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromQuery] EstadoSolicitud nuevoEstado)
        {
            try
            {
                var sol = await _context.Solicitud
                    .Include(s => s.Items)
                    .ThenInclude(i => i.Inventario)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (sol == null)
                    return NotFound();

                if (sol.Estado == nuevoEstado)
                    return BadRequest("Ya está en ese estado.");

                sol.Estado = nuevoEstado;
                _context.Solicitud.Update(sol);

                if (nuevoEstado == EstadoSolicitud.Aprobada)
                {
                    foreach (var item in sol.Items)
{
    var invCentral = item.Inventario;

    if (invCentral == null) continue;

    if (item.Cantidad > invCentral.Cantidad)
    {
        return BadRequest($"No hay suficiente stock de {invCentral.Herramienta}");
    }

    // 1️⃣ Restar del inventario central
    invCentral.Cantidad -= item.Cantidad;
    _context.Inventario.Update(invCentral);

// 2️⃣ Crear InventarioInterno
var interno = new InventarioInterno
{
    InventarioId = invCentral.Id,
    Obra = sol.Obra,
    ResponsableObra = sol.Solicitante,
    Usando = sol.Solicitante,
    CantidadAsignada = item.Cantidad,
    Observaciones = $"Asignado por solicitud #{sol.Id}"
        };

        _context.InventarioInterno.Add(interno);
            
            // 3️⃣ Registrar movimiento
            var mov = new Movimiento
            {
        InventarioId = invCentral.Id,
        CodigoHerramienta = invCentral.Codigo,
        NombreHerramienta = invCentral.Herramienta,
        Responsable = sol.Solicitante,
        Obra = sol.Obra,
        FechaMovimiento = DateTime.Now,
        TipoMovimiento = "Salida",
        Estado = invCentral.Estado,
        Cantidad = item.Cantidad,
        Comentario = $"Solicitud aprobada #{sol.Id}"
        };

            _context.Movimiento.Add(mov);
        }
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message} {(ex.InnerException?.Message ?? "")}");
            }
        }

        [HttpPatch("item/{itemId}/estado")]
public async Task<IActionResult> CambiarEstadoItem(int itemId, [FromQuery] EstadoSolicitud nuevoEstado)
{
    try
    {
        var item = await _context.SolicitudItem
            .Include(i => i.Inventario)
            .Include(i => i.Solicitud)
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
            return NotFound();

        if (item.Estado == nuevoEstado)
            return BadRequest("El item ya tiene ese estado.");

        item.Estado = nuevoEstado;

        if (nuevoEstado == EstadoSolicitud.Aprobada)
        {
            var inventario = item.Inventario;

            // 🔵 Calcular items pendientes del mismo inventario
            var pendientes = await _context.SolicitudItem
                .Where(x =>
                    x.InventarioId == inventario.Id &&
                    x.Estado == EstadoSolicitud.Pendiente &&
                    x.Id != item.Id)
                .SumAsync(x => x.Cantidad);

            // 🔵 Stock disponible real
            var disponibleReal = inventario.Cantidad - pendientes;

            if (disponibleReal < item.Cantidad)
            {
                return BadRequest($"Stock insuficiente. Disponible real: {disponibleReal}");
            }

            if (inventario == null)
                return BadRequest("Inventario no encontrado.");

            if (inventario.Cantidad < item.Cantidad)
                return BadRequest($"Stock insuficiente de {inventario.Herramienta}");

            // 🔴 Descontar inventario central
            inventario.Cantidad -= item.Cantidad;

            // 🔴 Buscar inventario interno existente
            var inventarioInterno = await _context.InventarioInterno
                .FirstOrDefaultAsync(x =>
                    x.InventarioId == inventario.Id &&
                    x.Obra == item.Solicitud.Obra &&
                    x.Usando == item.Solicitud.Solicitante);

            if (inventarioInterno == null)
            {
                inventarioInterno = new InventarioInterno
                {
                    InventarioId = inventario.Id,
                    Obra = item.Solicitud.Obra,
                    ResponsableObra = item.Solicitud.Solicitante,
                    Usando = item.Solicitud.Solicitante,
                    CantidadAsignada = item.Cantidad,
                    Observaciones = $"Asignado por solicitud #{item.SolicitudId}"
                };

                _context.InventarioInterno.Add(inventarioInterno);
            }
            else
            {
                inventarioInterno.CantidadAsignada += item.Cantidad;
            }

            // 🔴 Registrar movimiento
            var mov = new Movimiento
            {
                InventarioId = inventario.Id,
                CodigoHerramienta = inventario.Codigo,
                NombreHerramienta = inventario.Herramienta,
                TipoMovimiento = "Salida",
                Cantidad = item.Cantidad,
                Responsable = item.Solicitud.Solicitante,
                Obra = item.Solicitud.Obra,
                FechaMovimiento = DateTime.UtcNow,
                Estado = "En uso",
                Comentario = $"Solicitud #{item.SolicitudId}"
            };

            _context.Movimiento.Add(mov);
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}

    }
}
