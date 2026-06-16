using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;


namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovimientoController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MovimientoController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMovimientos()
        {
            var movimientos = await _context.Movimiento
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();

            return Ok(movimientos);
        }

        [HttpGet("por-herramienta/{codigo}")]
        public async Task<IActionResult> GetMovimientosPorHerramienta(string codigo)
        {
            var movimientos = await _context.Movimiento
                .Where(m => m.CodigoHerramienta == codigo)
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();

            if (!movimientos.Any())
                return NotFound($"No se encontraron movimientos para la herramienta con código: {codigo}");

            return Ok(movimientos);
        }

            [HttpPost]
        public async Task<IActionResult> RegistrarMovimiento(Movimiento movimiento)
        {
            movimiento.Id = 0;
            movimiento.Obra = movimiento.Obra?.Trim();
            movimiento.Responsable = string.IsNullOrWhiteSpace(movimiento.Responsable)
            ? "Sistema"
            : movimiento.Responsable.Trim();

            var inventario = await _context.Inventario.FindAsync(movimiento.InventarioId);

           // Si es entrada y no viene de obra, la herramienta vuelve a bodega
            if (movimiento.TipoMovimiento == "Entrada" && string.IsNullOrWhiteSpace(movimiento.Obra))
            {
                inventario.Ubicacion = "PICSO Central";
            }

            if (inventario == null)
                return NotFound("Herramienta no encontrada.");

            if (movimiento.Cantidad <= 0)
                return BadRequest("La cantidad debe ser mayor a 0.");

            // 🔴 SALIDA
           if (movimiento.TipoMovimiento == "Salida")
{
    if (inventario.Cantidad < movimiento.Cantidad)
        return BadRequest("Stock insuficiente.");

    inventario.Cantidad -= movimiento.Cantidad;
    inventario.Estado ="En uso";

    var inventarioInterno = await _context.InventarioInterno
    .FirstOrDefaultAsync(x =>
        x.InventarioId == inventario.Id &&
        x.Obra == movimiento.Obra &&
        x.Usando == movimiento.Responsable);

    if (inventarioInterno == null)
    {
        inventarioInterno = new InventarioInterno
            {
                InventarioId = inventario.Id,
                Obra = movimiento.Obra,
                ResponsableObra = movimiento.Responsable,
                Usando = movimiento.Responsable,
                CantidadAsignada = movimiento.Cantidad
            };

        _context.InventarioInterno.Add(inventarioInterno);
    }
    else
    {
        inventarioInterno.CantidadAsignada += movimiento.Cantidad;
    }
}

            else if (movimiento.TipoMovimiento == "Entrada")
{
    inventario.Cantidad += movimiento.Cantidad;
    inventario.Estado = "Disponible";

    // Si viene de una obra, descuenta del inventario interno
    if (!string.IsNullOrWhiteSpace(movimiento.Obra))
    {
        var inventarioInterno = await _context.InventarioInterno
            .FirstOrDefaultAsync(x =>
                x.InventarioId == inventario.Id &&
                x.Obra == movimiento.Obra);

        if (inventarioInterno == null)
        {
            return BadRequest("No existe esa herramienta en esa obra.");
        }

        if (inventarioInterno.CantidadAsignada < movimiento.Cantidad)
        {
            return BadRequest("No hay suficientes herramientas en esa obra.");
        }

        inventarioInterno.CantidadAsignada -= movimiento.Cantidad;

        if (inventarioInterno.CantidadAsignada <= 0)
        {
            _context.InventarioInterno.Remove(inventarioInterno);
        }
    }
}

            else
            {
                return BadRequest("Tipo de movimiento inválido.");
            }

            movimiento.CodigoHerramienta = inventario.Codigo;
            movimiento.NombreHerramienta = inventario.Herramienta;
            movimiento.FechaMovimiento = DateTime.UtcNow;
            movimiento.Estado = inventario.Estado;

            _context.Movimiento.Add(movimiento);
            _context.Inventario.Update(inventario);

            await _context.SaveChangesAsync();

            return Ok(movimiento);
        }

        [HttpGet("filtrar")]
        public async Task<IActionResult> FiltrarMovimientos(
            [FromQuery] string? obra,
            [FromQuery] string? responsable,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var query = _context.Movimiento.AsQueryable();

            if (!string.IsNullOrEmpty(obra))
                query = query.Where(m => m.Obra == obra);

            if (!string.IsNullOrEmpty(responsable))
                query = query.Where(m => m.Responsable == responsable);

            if (desde.HasValue)
                query = query.Where(m => m.FechaMovimiento >= desde.Value);

            if (hasta.HasValue)
                query = query.Where(m => m.FechaMovimiento <= hasta.Value);

            var resultados = await query
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();

            return Ok(resultados);
        }
    }
}
