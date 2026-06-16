using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using testback.Data;

[ApiController]
[Route("api/notificaciones")]
public class NotificacionesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly NotificacionesProcessor _processor;

    public NotificacionesController(ApplicationDbContext context, NotificacionesProcessor processor)
    {
        _context = context;
        _processor = processor;
    }

    [HttpGet("activas")]
    public async Task<IActionResult> ObtenerActivas()
    {
        var notificaciones = await _context.Notificaciones
            .Where(n => n.Activa)
            .Join(
                _context.Empleado,
                n => n.ReferenciaId,
                e => e.Id,
                (n, e) => new { n, e }
            )
            .Where(x => x.e.Estado != null && x.e.Estado.Trim().ToLower() == "activo")
            .Select(x => x.n)
            .OrderByDescending(n => n.FechaCreacion)
            .ToListAsync();

        return Ok(notificaciones);
    }

    [Authorize]
    [HttpPut("marcar-leidas")]
    public async Task<IActionResult> MarcarComoLeidas()
    {
        var idClaim = User.FindFirst("id") ?? User.FindFirst("sub") ?? User.FindFirst("nameid");
        if (idClaim == null) return Unauthorized();
        var userId = int.Parse(idClaim.Value);

        var activas = await _context.Notificaciones
            .Where(n => n.Activa)
            .ToListAsync();

        foreach (var n in activas)
        {
            var existe = await _context.UsuarioNotificaciones
                .FirstOrDefaultAsync(x => x.UsuarioId == userId && x.NotificacionId == n.Id);

            if (existe == null)
            {
                _context.UsuarioNotificaciones.Add(new UsuarioNotificacion
                {
                    UsuarioId = userId,
                    NotificacionId = n.Id,
                    Leida = true,
                    FechaLectura = DateTime.Now
                });
            }
            else
            {
                existe.Leida = true;
                existe.FechaLectura = DateTime.Now;
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpGet("no-leidas")]
    public async Task<IActionResult> ObtenerNoLeidas()
    {
        var idClaim = User.FindFirst("id") ?? User.FindFirst("sub") ?? User.FindFirst("nameid");
        if (idClaim == null) return Unauthorized();
        var userId = int.Parse(idClaim.Value);

        var notificaciones = await _context.Notificaciones
            .Where(n => n.Activa)
            .Join(
                _context.Empleado,
                n => n.ReferenciaId,
                e => e.Id,
                (n, e) => new { n, e }
            )
            .Where(x => x.e.Estado != null && x.e.Estado.Trim().ToLower() == "activo")
            .Select(x => x.n)
            .Where(n => !_context.UsuarioNotificaciones
                .Any(u => u.UsuarioId == userId && u.NotificacionId == n.Id && u.Leida))
            .OrderByDescending(n => n.FechaCreacion)
            .ToListAsync();

        return Ok(notificaciones);
    }

    [HttpPost("verificar-todas")]
    public async Task<IActionResult> VerificarTodas()
    {
        await _processor.EjecutarTodas();
        return Ok();
    }

    [HttpPost("verificar-contratos")]
    public async Task<IActionResult> VerificarContratos()
    {
        await _processor.EjecutarTodas();
        return Ok();
    }
}
