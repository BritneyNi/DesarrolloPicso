using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using testback.Data;
using testback.Models;
using testback.Services;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IngresosPersonalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NominaLockService _nominaLock;

        public IngresosPersonalController(
            ApplicationDbContext context,
            NominaLockService nominaLock)
        {
            _context = context;
            _nominaLock = nominaLock;
        }

        // ─── Helpers para extraer rol y determinar si es ADMIN/SST ───────────

        private string? ObtenerRol() =>
            User.Claims
                .FirstOrDefault(c =>
                    c.Type == ClaimTypes.Role ||
                    c.Type == "role" ||
                    c.Type == "rol" ||
                    c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                ?.Value
                ?.ToUpper();

        private bool EsEspecial(string? rol) =>
            rol == "ADMIN" || rol == "SST";

        private string ObtenerNombreRegistrador() =>
            User.Claims
                .FirstOrDefault(c =>
                    c.Type == ClaimTypes.Name ||
                    c.Type == "name" ||
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")
                ?.Value ?? "Desconocido";

        // ─── GET ─────────────────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetIngresos()
        {
            var ingresos = await _context.IngresosPersonal
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            return Ok(ingresos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetIngreso(int id)
        {
            var ingreso = await _context.IngresosPersonal.FindAsync(id);

            if (ingreso == null)
                return NotFound();

            return Ok(ingreso);
        }

        [HttpGet("ultimo/{empleadoId}")]
        public async Task<IActionResult> GetUltimoIngresoPorEmpleado(int empleadoId)
        {
            var empleado = await _context.Empleado
                .Where(e => e.Id == empleadoId)
                .Select(e => new { e.Turno })
                .FirstOrDefaultAsync();

            bool esNocturno = empleado?.Turno?.ToLower() == "nocturno";
            int horasVentana = esNocturno ? 20 : 12;
            DateTime desde = DateTime.UtcNow.AddHours(-horasVentana);

            var ultimo = await _context.IngresosPersonal
                .Where(i => i.EmpleadoId == empleadoId && i.FechaHoraEntrada >= desde)
                .OrderByDescending(i => i.FechaHoraEntrada)
                .FirstOrDefaultAsync();

            if (ultimo == null)
            {
                ultimo = await _context.IngresosPersonal
                    .Where(i => i.EmpleadoId == empleadoId)
                    .OrderByDescending(i => i.FechaHoraEntrada)
                    .FirstOrDefaultAsync();
            }

            if (ultimo == null)
                return NotFound($"No se encontró ingreso para el empleado con ID {empleadoId}.");

            return Ok(ultimo);
        }

        [HttpGet("empleado/{empleadoId}")]
        public async Task<IActionResult> GetIngresosPorEmpleado(int empleadoId)
        {
            var ingresos = await _context.IngresosPersonal
                .Where(i => i.EmpleadoId == empleadoId)
                .OrderByDescending(i => i.FechaHoraEntrada)
                .ToListAsync();

            return Ok(ingresos);
        }

        // ─── POST ─────────────────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> CreateIngreso(IngresosPersonal ingreso)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                ingreso.FechaHoraEntrada = DateTime.SpecifyKind(
                    ingreso.FechaHoraEntrada,
                    DateTimeKind.Utc
                ).ToUniversalTime();
            }
            catch { }

            if (_nominaLock.EstaBloqueda(ingreso.FechaHoraEntrada, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            // ── Verificar que el empleado exista ──────────────────────────────
            var empleado = await _context.Empleado.FindAsync(ingreso.EmpleadoId);
            if (empleado == null)
                return NotFound(new { mensaje = $"El empleado con ID {ingreso.EmpleadoId} no existe." });

            // ── ADMIN y SST omiten validación de programación semanal ─────────
            var rol = ObtenerRol();
            bool esEspecial = EsEspecial(rol);

            if (!esEspecial && !await EmpleadoProgramadoEstaSemana(ingreso.EmpleadoId))
            {
                return UnprocessableEntity(new
                {
                    mensaje = "No puede registrar horarios porque el empleado no ha sido programado para esta semana.",
                    codigo = "SIN_PROGRAMACION"
                });
            }

            // ── Trazabilidad: anotar quién registró (ADMIN/SST) ───────────────
            if (esEspecial)
            {
                var registradoPor = ObtenerNombreRegistrador();
                ingreso.Comentarios = string.IsNullOrWhiteSpace(ingreso.Comentarios)
                    ? $"[Registro directo por {rol} - {registradoPor}]"
                    : $"{ingreso.Comentarios} [Registro directo por {rol} - {registradoPor}]";
            }

            _context.IngresosPersonal.Add(ingreso);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIngreso), new { id = ingreso.Id }, ingreso);
        }

        // ─── PUT ──────────────────────────────────────────────────────────────

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIngreso(int id, IngresosPersonal ingreso)
        {
            if (id != ingreso.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_nominaLock.EstaBloqueda(ingreso.FechaHoraEntrada, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            // ── ADMIN y SST omiten validación de programación semanal ─────────
            var rol = ObtenerRol();
            bool esEspecial = EsEspecial(rol);

            if (!esEspecial && !await EmpleadoProgramadoEstaSemana(ingreso.EmpleadoId))
            {
                return UnprocessableEntity(new
                {
                    mensaje = "No puede registrar horarios porque el empleado no ha sido programado para esta semana.",
                    codigo = "SIN_PROGRAMACION"
                });
            }

            _context.Entry(ingreso).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.IngresosPersonal.Any(x => x.Id == id))
                    return NotFound();

                throw;
            }

            return NoContent();
        }

        // ─── DELETE ───────────────────────────────────────────────────────────

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIngreso(int id)
        {
            var ingreso = await _context.IngresosPersonal.FindAsync(id);

            if (ingreso == null)
                return NotFound();

            if (_nominaLock.EstaBloqueda(ingreso.FechaHoraEntrada, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            _context.IngresosPersonal.Remove(ingreso);
            await _context.SaveChangesAsync();

            return Ok(ingreso);
        }

        // ─── Endpoint dedicado para registro directo ADMIN/SST ───────────────
        // POST api/IngresosPersonal/directo
        // Permite a ADMIN y SST registrar ingreso sin ninguna validación de semana.
        // Mantiene: existencia del empleado, datos válidos y trazabilidad.

        [HttpPost("directo")]
        public async Task<IActionResult> RegistroDirecto([FromBody] RegistroDirectoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var rol = ObtenerRol();
            if (!EsEspecial(rol))
                return Forbid();

            // ── El empleado debe existir ──────────────────────────────────────
            var empleado = await _context.Empleado.FindAsync(dto.EmpleadoId);
            if (empleado == null)
                return NotFound(new { mensaje = $"El empleado con ID {dto.EmpleadoId} no existe." });

            // ── Validar que la fecha sea un valor real ────────────────────────
            if (dto.FechaHoraEntrada == default)
                return BadRequest(new { mensaje = "La fecha y hora de entrada no es válida." });

            var fechaUtc = DateTime.SpecifyKind(dto.FechaHoraEntrada, DateTimeKind.Utc);

            // ── Trazabilidad ──────────────────────────────────────────────────
            var registradoPor = ObtenerNombreRegistrador();
            var trazabilidad = $"[Registro directo por {rol} - {registradoPor} - {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC]";
            var comentarios = string.IsNullOrWhiteSpace(dto.Comentarios)
                ? trazabilidad
                : $"{dto.Comentarios} {trazabilidad}";

            var ingreso = new IngresosPersonal
            {
                EmpleadoId = dto.EmpleadoId,
                FechaHoraEntrada = fechaUtc,
                Comentarios = comentarios
            };

            _context.IngresosPersonal.Add(ingreso);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = $"Ingreso registrado para {empleado.NombreCompleto}.",
                ingreso
            });
        }

        // ─── Utilidades ───────────────────────────────────────────────────────

        [HttpGet("hora-colombia")]
        public IActionResult HoraColombia()
        {
            var zona = TimeZoneInfo.FindSystemTimeZoneById("America/Bogota");
            var ahora = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);

            return Ok(new
            {
                utc = DateTime.UtcNow,
                colombia = ahora,
                dia = ahora.Day,
                hora = ahora.Hour,
                minuto = ahora.Minute
            });
        }

        // ── Helper: verificar programación semanal O asignación activa a obra ───
        private async Task<bool> EmpleadoProgramadoEstaSemana(int empleadoId)
        {
            var hoy = DateTime.UtcNow.Date;
            int diasDesdeElLunes = ((int)hoy.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
            var lunes = hoy.AddDays(-diasDesdeElLunes);
            var domingo = lunes.AddDays(6);

            // ── Opción 1: programación semanal registrada ─────────────────────
            var tieneProgramacion = await _context.ProgramacionSemanal
                .AnyAsync(p =>
                    p.EmpleadoId == empleadoId &&
                    p.FechaInicioSemana <= domingo &&
                    p.FechaFinSemana >= lunes);

            if (tieneProgramacion) return true;

            // ── Opción 2: asignación activa a una obra ────────────────────────
            return await _context.AsignacionesEmpleadoObra
                .AnyAsync(a =>
                    a.EmpleadoId == empleadoId &&
                    a.Activo &&
                    (a.FechaFin == null || a.FechaFin >= hoy));
        }
    }

    // ── DTO para registro directo ─────────────────────────────────────────────
    public class RegistroDirectoDto
    {
        public int EmpleadoId { get; set; }
        public DateTime FechaHoraEntrada { get; set; }
        public string? Comentarios { get; set; }
    }
}
