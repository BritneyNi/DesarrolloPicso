using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public InventarioController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventario()
        {
            if (_context.Inventario == null)
                return NotFound("No hay elementos en el inventario.");

            var inventario = await _context.Inventario
                .Where(i => i.Estado != "Inactivo")
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            return inventario.Any() ? Ok(inventario) : NotFound("No hay elementos activos en el inventario.");
        }

        [HttpGet("stock-real")]
        public async Task<IActionResult> GetInventarioConReservas()
        {
            var inventario = await _context.Inventario.ToListAsync();
            var resultado = new List<object>();

            foreach (var inv in inventario)
            {
                var reservado = await _context.SolicitudItem
                    .Where(x => x.InventarioId == inv.Id && x.Estado == EstadoSolicitud.Pendiente)
                    .SumAsync(x => (int?)x.Cantidad) ?? 0;

                resultado.Add(new
                {
                    inv.Id, inv.Codigo, inv.Herramienta, inv.NumeroSerie, inv.Marca,
                    inv.Modulo, inv.Nivel, inv.Observaciones, inv.Ubicacion,
                    inv.Responsable, inv.Estado, inv.Cantidad,
                    StockReservado = reservado,
                    StockDisponible = inv.Cantidad - reservado
                });
            }

            return Ok(resultado);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetItem(int id)
        {
            var item = await _context.Inventario
                .FirstOrDefaultAsync(i => i.Id == id && i.Estado != "Inactivo");

            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> CreateItem(Inventario item)
        {
            item.Estado = "Activo";
            _context.Inventario.Add(item);
            await _context.SaveChangesAsync();

            var movimientoInicial = new Movimiento
            {
                InventarioId = item.Id,
                CodigoHerramienta = item.Codigo,
                NombreHerramienta = item.Herramienta,
                Responsable = item.Responsable,
                Obra = item.Ubicacion,
                FechaMovimiento = DateTime.Now,
                TipoMovimiento = "Entrada",
                Estado = "Disponible",
                Cantidad = item.Cantidad,
                Comentario = "Entrada inicial por creación de herramienta"
            };

            _context.Movimiento.Add(movimientoInicial);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditItem(int id, Inventario item)
        {
            if (id != item.Id) return BadRequest("El ID no coincide.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var itemExistente = await _context.Inventario.FindAsync(id);
            if (itemExistente == null) return NotFound();

            itemExistente.Codigo = item.Codigo;
            itemExistente.Herramienta = item.Herramienta;
            itemExistente.NumeroSerie = item.NumeroSerie;
            itemExistente.Marca = item.Marca;
            itemExistente.Observaciones = item.Observaciones;
            itemExistente.Modulo = item.Modulo;
            itemExistente.Nivel = item.Nivel;
            itemExistente.Ubicacion = item.Ubicacion;
            itemExistente.Responsable = item.Responsable;
            itemExistente.Estado = item.Estado;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.Inventario.FindAsync(id);
            if (item == null) return NotFound();

            item.Estado = "Inactivo";
            _context.Inventario.Update(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpGet("por-obra/{nombreObra}")]
        public IActionResult ObtenerPorObra(string nombreObra)
        {
            var materiales = _context.Inventario
                .Where(m => m.Ubicacion.Trim().ToLower() == nombreObra.Trim().ToLower())
                .ToList();
            return Ok(materiales);
        }

        [HttpGet("exportar-excel")]
        public async Task<IActionResult> ExportarExcel()
        {
            var inventario = await _context.Inventario
                .Where(i => i.Estado != "Inactivo")
                .OrderBy(i => i.Codigo)
                .ToListAsync();

            using var wb = new ClosedXML.Excel.XLWorkbook();
            var ws = wb.Worksheets.Add("Inventario");

            ws.Cell(1, 1).Value = "#";
            ws.Cell(1, 2).Value = "Código";
            ws.Cell(1, 3).Value = "Herramienta";
            ws.Cell(1, 4).Value = "Marca";
            ws.Cell(1, 5).Value = "Serie";
            ws.Cell(1, 6).Value = "Cantidad";
            ws.Cell(1, 7).Value = "Ubicación";
            ws.Cell(1, 8).Value = "Responsable";
            ws.Cell(1, 9).Value = "Módulo";
            ws.Cell(1, 10).Value = "Nivel";

            var headerRow = ws.Range(1, 1, 1, 10);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#4F4E4D");
            headerRow.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;

            for (int i = 0; i < inventario.Count; i++)
            {
                var m = inventario[i];
                int row = i + 2;
                ws.Cell(row, 1).Value = i + 1;
                ws.Cell(row, 2).Value = m.Codigo;
                ws.Cell(row, 3).Value = m.Herramienta;
                ws.Cell(row, 4).Value = m.Marca ?? "-";
                ws.Cell(row, 5).Value = m.NumeroSerie ?? "-";
                ws.Cell(row, 6).Value = m.Cantidad;
                ws.Cell(row, 7).Value = m.Ubicacion;
                ws.Cell(row, 8).Value = m.Responsable;
                ws.Cell(row, 9).Value = m.Modulo ?? "-";
                ws.Cell(row, 10).Value = m.Nivel ?? "-";
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Inventario_Completo.xlsx");
        }

        [HttpGet("exportar-excel-interno/{nombreObra}")]
        public async Task<IActionResult> ExportarExcelInterno(string nombreObra)
        {
            var padre = await _context.Inventario
                .Where(i => i.Ubicacion.Trim().ToLower() == nombreObra.Trim().ToLower())
                .ToListAsync();

            var internos = await _context.InventarioInterno
                .Include(i => i.Inventario)
                .Where(i => i.Obra.Trim().ToLower() == nombreObra.Trim().ToLower())
                .ToListAsync();

            using var wb = new ClosedXML.Excel.XLWorkbook();
            var ws = wb.Worksheets.Add("Inventario");

            ws.Cell(1, 1).Value = "Código";
            ws.Cell(1, 2).Value = "Herramienta";
            ws.Cell(1, 3).Value = "Marca";
            ws.Cell(1, 4).Value = "Serie";
            ws.Cell(1, 5).Value = "Cantidad";
            ws.Cell(1, 6).Value = "Ubicación";
            ws.Cell(1, 7).Value = "Responsable";
            ws.Cell(1, 8).Value = "Usando";
            ws.Cell(1, 9).Value = "Observaciones";

            var headerRow = ws.Range(1, 1, 1, 9);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#4F4E4D");
            headerRow.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;

            int row = 2;

            foreach (var p in padre)
            {
                var hijos = internos.Where(i => i.InventarioId == p.Id).ToList();

                if (!hijos.Any())
                {
                    ws.Cell(row, 1).Value = p.Codigo;
                    ws.Cell(row, 2).Value = p.Herramienta;
                    ws.Cell(row, 3).Value = p.Marca ?? "-";
                    ws.Cell(row, 4).Value = p.NumeroSerie ?? "-";
                    ws.Cell(row, 5).Value = p.Cantidad;
                    ws.Cell(row, 6).Value = p.Ubicacion;
                    ws.Cell(row, 7).Value = p.Responsable;
                    ws.Cell(row, 8).Value = "-";
                    ws.Cell(row, 9).Value = "-";
                    row++;
                }
                else
                {
                    foreach (var h in hijos)
                    {
                        ws.Cell(row, 1).Value = p.Codigo;
                        ws.Cell(row, 2).Value = p.Herramienta;
                        ws.Cell(row, 3).Value = p.Marca ?? "-";
                        ws.Cell(row, 4).Value = p.NumeroSerie ?? "-";
                        ws.Cell(row, 5).Value = h.CantidadAsignada;
                        ws.Cell(row, 6).Value = h.Obra;
                        ws.Cell(row, 7).Value = h.ResponsableObra;
                        ws.Cell(row, 8).Value = h.Usando ?? "-";
                        ws.Cell(row, 9).Value = h.Observaciones ?? "-";
                        row++;
                    }
                }
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Inventario_{nombreObra}.xlsx");
        }
    }
}