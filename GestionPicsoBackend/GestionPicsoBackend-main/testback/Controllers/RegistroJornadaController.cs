using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;
using testback.Services;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegistroJornadaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly CalculadoraJornada _calculadora;
        private readonly FestivoApiService _festivoService;
        private readonly ExcelJornadaService _excelService;

        public RegistroJornadaController(
            ApplicationDbContext context,
            CalculadoraJornada calculadora,
            FestivoApiService festivoService,
            ExcelJornadaService excelService)
        {
            _context = context;
            _calculadora = calculadora;
            _festivoService = festivoService;
            _excelService = excelService;
        }

        [HttpGet("resumenhoras")]
        public async Task<ActionResult<IEnumerable<RegistroJornada>>> ObtenerResumenHoras(
            [FromQuery] bool usarFestivos = false,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var empleados = await _context.Empleado
                    .Where(e => e.Estado == "Activo")
                    .ToListAsync();

                var ingresosRaw = await _context.IngresosPersonal.ToListAsync();
                var salidasRaw = await _context.SalidasPersonal.ToListAsync();

                if (fechaInicio.HasValue)
                {
                    ingresosRaw = ingresosRaw
                        .Where(i => i.FechaHoraEntrada.Date >= fechaInicio.Value)
                        .ToList();
                    salidasRaw = salidasRaw
                        .Where(s => s.FechaHoraSalida.Date >= fechaInicio.Value.AddDays(-1))
                        .ToList();
                }
                if (fechaFin.HasValue)
                {
                    ingresosRaw = ingresosRaw
                        .Where(i => i.FechaHoraEntrada <= fechaFin.Value.AddDays(1))
                        .ToList();
                    salidasRaw = salidasRaw
                        .Where(s => s.FechaHoraSalida.Date <= fechaFin.Value.AddDays(1))
                        .ToList();
                }

                var festivos = new List<DateTime>();

                var diasAdicionales = salidasRaw
                    .Where(s =>
                        !ingresosRaw.Any(i =>
                            i.EmpleadoId == s.EmpleadoId &&
                            i.FechaHoraEntrada.Date == s.FechaHoraSalida.Date
                        )
                    )
                    .Select(s => new { s.EmpleadoId, Fecha = s.FechaHoraSalida.Date })
                    .ToList();

                var ingresosConDiasExtra = ingresosRaw
                    .Select(i => new { i.EmpleadoId, Fecha = i.FechaHoraEntrada.Date })
                    .Concat(diasAdicionales)
                    .Distinct()
                    .ToList();

                if (fechaInicio.HasValue && fechaFin.HasValue)
                {
                    var existentes = _context.RegistroJornada
                        .Where(r => r.Fecha >= fechaInicio && r.Fecha <= fechaFin)
                        .ToList();
                    _context.RegistroJornada.RemoveRange(existentes);
                    await _context.SaveChangesAsync();
                }

                var resultados = new List<RegistroJornada>();
                var grupos = ingresosConDiasExtra.GroupBy(g => new { g.EmpleadoId, g.Fecha });

                foreach (var g in grupos)
                {
                    int empleadoId = g.Key.EmpleadoId;
                    DateTime fecha = g.Key.Fecha;

                    var ingresosDelDia = ingresosRaw
                        .Where(i => i.EmpleadoId == empleadoId && i.FechaHoraEntrada.Date == fecha)
                        .OrderBy(i => i.FechaHoraEntrada)
                        .ToList();

                    if (!ingresosDelDia.Any())
                        continue;

                    var salidasDelDia = salidasRaw
                        .Where(s =>
                            s.EmpleadoId == empleadoId &&
                            (
                                s.FechaHoraSalida.Date == fecha ||
                                (
                                    s.FechaHoraSalida.Date == fecha.AddDays(1) &&
                                    s.FechaHoraSalida.TimeOfDay <= TimeSpan.FromHours(12)
                                )
                            )
                        )
                        .OrderBy(s => s.FechaHoraSalida)
                        .ToList();

                    if (!salidasDelDia.Any())
                        continue;

                    var emp = empleados.FirstOrDefault(e => e.Id == empleadoId);
                    if (emp == null)
                        continue;

                    var pares = new List<(DateTime Entrada, DateTime Salida)>();

                    foreach (var entrada in ingresosDelDia.OrderBy(x => x.FechaHoraEntrada))
                    {
                        var salida = salidasDelDia
                            .Where(s => s.FechaHoraSalida >= entrada.FechaHoraEntrada)
                            .OrderBy(s => s.FechaHoraSalida)
                            .FirstOrDefault();

                        if (salida == null)
                            continue;

                        pares.Add((entrada.FechaHoraEntrada, salida.FechaHoraSalida));
                        salidasDelDia.Remove(salida);
                    }

                    foreach (var par in pares)
                    {
                        var entrada = par.Entrada;
                        var salida = par.Salida;

                        var regCalc = _calculadora.CalcularRegistro(
                            emp,
                            new List<IngresosPersonal> {
                                new IngresosPersonal { FechaHoraEntrada = entrada, EmpleadoId = empleadoId }
                            },
                            new List<SalidasPersonal> {
                                new SalidasPersonal { FechaHoraSalida = salida, EmpleadoId = empleadoId }
                            },
                            festivos
                        );

                        var reg = new RegistroJornada
                        {
                            NombreCompleto = emp.NombreCompleto,
                            Ubicacion = string.IsNullOrWhiteSpace(emp.Ubicacion)
                                ? "Sin ubicación"
                                : emp.Ubicacion,
                            Obra = emp.Obra,
                            Fecha = entrada.Date,
                            HoraEntrada = entrada,
                            HoraSalida = salida,
                            HorasTrabajadas = regCalc.HorasTrabajadas,
                            HorasDiurnas = regCalc.HorasDiurnas,
                            HorasNocturnas = regCalc.HorasNocturnas,
                            HorasExtrasDiurnas = regCalc.HorasExtrasDiurnas,
                            HorasExtrasNocturnas = regCalc.HorasExtrasNocturnas,
                            TrabajoDomingo = regCalc.TrabajoDomingo,
                            TrabajoFestivo = regCalc.TrabajoFestivo,
                            HorasDominicales = regCalc.HorasDominicales,
                            HorasRecargoNocturnoDominical = regCalc.HorasRecargoNocturnoDominical,
                            HorasExtrasDominicales = regCalc.HorasExtrasDominicales
                        };

                        resultados.Add(reg);

                        if (fechaInicio.HasValue && fechaFin.HasValue)
                        {
                            _context.RegistroJornada.Add(reg);
                        }
                    }
                }

                if (fechaInicio.HasValue && fechaFin.HasValue)
                {
                    await _context.SaveChangesAsync();
                }

                return Ok(resultados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [HttpGet("exportar-excel")]
        public async Task<IActionResult> ExportarExcel(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] string? ubicacion = null,
            [FromQuery] string? obra = null)
        {
            try
            {
                var query = _context.RegistroJornada.AsQueryable();

                if (fechaInicio.HasValue)
                    query = query.Where(r => r.Fecha >= fechaInicio.Value);

                if (fechaFin.HasValue)
                    query = query.Where(r => r.Fecha <= fechaFin.Value);

                if (!string.IsNullOrWhiteSpace(ubicacion) && ubicacion.ToLower() != "todos")
                    query = query.Where(r => r.Ubicacion.ToLower() == ubicacion.ToLower());

                if (!string.IsNullOrWhiteSpace(obra) && obra.ToLower() != "todos")
                    query = query.Where(r => r.Obra != null && r.Obra.ToLower() == obra.ToLower());

                var registros = await query.OrderBy(r => r.NombreCompleto).ThenBy(r => r.Fecha).ToListAsync();

                var ausentismos = await _context.DocumentoPermisos.ToListAsync();

                if (!registros.Any())
                    return NotFound("No hay registros para exportar con los filtros indicados.");


                var bytes = _excelService.GenerarExcelJornada(registros,ausentismos);

                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"Jornada_{fechaInicio:yyyy-MM-dd}_{fechaFin:yyyy-MM-dd}.xlsx"
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }
    }
}