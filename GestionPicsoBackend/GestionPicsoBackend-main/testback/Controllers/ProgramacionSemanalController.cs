using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProgramacionSemanalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProgramacionSemanalController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── Obtener programación de la semana actual por obra ─────────────────
        [HttpGet("semana-actual")]
        public async Task<IActionResult> GetSemanaActual([FromQuery] int obraId)
        {
            var (inicio, fin) = GetSemanaActualRango();

            var programaciones = await _context.ProgramacionSemanal
                .Include(p => p.Empleado)
                .Include(p => p.Obra)
                .Include(p => p.Residente)
                .Where(p => p.ObraId == obraId &&
                            p.FechaInicioSemana <= fin &&
                            p.FechaFinSemana >= inicio)
                .ToListAsync();

            return Ok(programaciones.Select(p => new
            {
                p.Id,
                p.EmpleadoId,
                empleadoNombre = p.Empleado!.NombreCompleto,
                p.ObraId,
                obraNombre = p.Obra!.NombreObra,
                residenteNombre = p.Residente!.NombreCompleto,
                p.FechaInicioSemana,
                p.FechaFinSemana
            }));
        }

        // ── Verificar disponibilidad de un empleado ───────────────────────────
        [HttpGet("empleado/{empleadoId}/disponibilidad")]
        public async Task<IActionResult> GetDisponibilidad(int empleadoId)
        {
            var (inicio, fin) = GetSemanaActualRango();

            var programacion = await _context.ProgramacionSemanal
                .Include(p => p.Obra)
                .Include(p => p.Residente)
                .Where(p => p.EmpleadoId == empleadoId &&
                            p.FechaInicioSemana <= fin &&
                            p.FechaFinSemana >= inicio)
                .FirstOrDefaultAsync();

            if (programacion == null)
                return Ok(new { disponible = true, programacion = (object?)null });

            return Ok(new
            {
                disponible = false,
                programacion = new
                {
                    programacion.Id,
                    programacion.ObraId,
                    obraNombre = programacion.Obra!.NombreObra,
                    residenteNombre = programacion.Residente!.NombreCompleto,
                    programacion.FechaInicioSemana,
                    programacion.FechaFinSemana
                }
            });
        }

        // ── Verificar si empleado está programado esta semana ─────────────────
        [HttpGet("empleado/{empleadoId}/semana-actual")]
        public async Task<IActionResult> GetProgramacionEmpleado(int empleadoId)
        {
            var (inicio, fin) = GetSemanaActualRango();

            var existe = await _context.ProgramacionSemanal
                .AnyAsync(p => p.EmpleadoId == empleadoId &&
                               p.FechaInicioSemana <= fin &&
                               p.FechaFinSemana >= inicio);

            return Ok(new { programado = existe });
        }

        // ── Obtener todas (con filtro de rango opcional) ──────────────────────
        // FIX: ahora acepta fechaInicio y fechaFin como query params opcionales.
        // Si no se envían, filtra la semana actual por defecto.
        [HttpGet("todas")]
        public async Task<IActionResult> GetTodas(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            DateTime inicio;
            DateTime fin;

            if (fechaInicio.HasValue && fechaFin.HasValue)
            {
                inicio = fechaInicio.Value.Date;
                fin = fechaFin.Value.Date.AddDays(1).AddTicks(-1);
            }
            else
            {
                // Sin parámetros: semana actual
                (inicio, fin) = GetSemanaActualRango();
            }

            var programaciones = await _context.ProgramacionSemanal
                .Include(p => p.Empleado)
                .Include(p => p.Obra)
                .Include(p => p.Residente)
                .Where(p => p.FechaInicioSemana <= fin && p.FechaFinSemana >= inicio)
                .OrderByDescending(p => p.FechaInicioSemana)
                .ToListAsync();

            return Ok(programaciones.Select(p => new
            {
                p.Id,
                p.EmpleadoId,
                empleadoNombre = p.Empleado!.NombreCompleto,
                p.ObraId,
                obraNombre = p.Obra!.NombreObra,
                residenteNombre = p.Residente!.NombreCompleto,
                p.FechaInicioSemana,
                p.FechaFinSemana,
                p.FechaCreacion
            }));
        }

        // ── Historial por obra ────────────────────────────────────────────────
        [HttpGet("historico")]
        public async Task<IActionResult> GetHistorico([FromQuery] int obraId)
        {
            var programaciones = await _context.ProgramacionSemanal
                .Include(p => p.Empleado)
                .Include(p => p.Residente)
                .Where(p => p.ObraId == obraId)
                .OrderByDescending(p => p.FechaInicioSemana)
                .ToListAsync();

            return Ok(programaciones.Select(p => new
            {
                p.Id,
                p.EmpleadoId,
                empleadoNombre = p.Empleado!.NombreCompleto,
                residenteNombre = p.Residente!.NombreCompleto,
                p.FechaInicioSemana,
                p.FechaFinSemana,
                p.FechaCreacion
            }));
        }

        // ── Crear programación ────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] List<CrearProgramacionDto> dtos)
        {
            if (dtos == null || !dtos.Any())
                return BadRequest("Debe enviar al menos un empleado.");

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;

            var esEspecial =
                rol == "ADMIN" ||
                rol == "SST";

            var (inicio, fin) = GetSemanaActualRango();

            var errores = new List<string>();
            var nuevas = new List<ProgramacionSemanal>();

            foreach (var dto in dtos)
            {
                var existente = await _context.ProgramacionSemanal
                    .Include(p => p.Obra)
                    .Where(p => p.EmpleadoId == dto.EmpleadoId &&
                                p.FechaInicioSemana <= fin &&
                                p.FechaFinSemana >= inicio)
                    .FirstOrDefaultAsync();

                if (!esEspecial && existente != null)
                {
                    var emp = await _context.Empleado.FindAsync(dto.EmpleadoId);
                    errores.Add(
                        $"{emp?.NombreCompleto} ya está programado en {existente.Obra?.NombreObra} esta semana."
                    );
                    continue;
                }

                nuevas.Add(new ProgramacionSemanal
                {
                    EmpleadoId = dto.EmpleadoId,
                    ObraId = dto.ObraId,
                    ResidenteId = dto.ResidenteId,
                    FechaInicioSemana = inicio,
                    FechaFinSemana = fin,
                    FechaCreacion = DateTime.UtcNow
                });
            }

            if (nuevas.Any())
            {
                _context.ProgramacionSemanal.AddRange(nuevas);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                guardados = nuevas.Count,
                errores
            });
        }

        // ── Eliminar programación ─────────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var p = await _context.ProgramacionSemanal.FindAsync(id);

            if (p == null)
                return NotFound();

            _context.ProgramacionSemanal.Remove(p);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Programación eliminada." });
        }

        // ── Helper: calcular semana actual ────────────────────────────────────
        private static (DateTime inicio, DateTime fin) GetSemanaActualRango()
        {
            var hoy = DateTime.UtcNow.Date;
            int diasDesdeElLunes = ((int)hoy.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
            var lunes = hoy.AddDays(-diasDesdeElLunes);
            var domingo = lunes.AddDays(6);
            return (lunes, domingo);
        }
    }

    // ── DTO ──────────────────────────────────────────────────────────────────
    public class CrearProgramacionDto
    {
        public int EmpleadoId { get; set; }
        public int ObraId { get; set; }
        public int ResidenteId { get; set; }
    }
}
