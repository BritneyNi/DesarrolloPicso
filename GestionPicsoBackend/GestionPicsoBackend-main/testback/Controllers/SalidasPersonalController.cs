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
    public class SalidasPersonalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NominaLockService _nominaLock;

        public SalidasPersonalController(
            ApplicationDbContext context,
            NominaLockService nominaLock)
        {
            _context = context;
            _nominaLock = nominaLock;
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        private string? ObtenerRol() =>
            User.Claims
                .FirstOrDefault(c =>
                    c.Type == ClaimTypes.Role ||
                    c.Type == "role" ||
                    c.Type == "Rol" ||
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
        public async Task<IActionResult> GetSalidas()
        {
            var salidas = await _context.SalidasPersonal
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            return Ok(salidas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSalida(int id)
        {
            var salida = await _context.SalidasPersonal.FindAsync(id);

            if (salida == null)
                return NotFound();

            return Ok(salida);
        }

        [HttpGet("ultimo/{empleadoId}")]
        public async Task<IActionResult> GetUltimaSalidaPorEmpleado(int empleadoId)
        {
            var ultimo = await _context.SalidasPersonal
                .Where(s => s.EmpleadoId == empleadoId)
                .OrderByDescending(s => s.FechaHoraSalida)
                .FirstOrDefaultAsync();

            if (ultimo == null)
                return NotFound($"No se encontró salida para el empleado con ID {empleadoId}.");

            return Ok(ultimo);
        }

        [HttpGet("empleado/{empleadoId}")]
        public async Task<IActionResult> GetSalidasPorEmpleado(int empleadoId)
        {
            var salidas = await _context.SalidasPersonal
                .Where(s => s.EmpleadoId == empleadoId)
                .OrderByDescending(s => s.FechaHoraSalida)
                .ToListAsync();

            return Ok(salidas);
        }

        // ─── POST ─────────────────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> CreateSalida(SalidasPersonal salida)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                salida.FechaHoraSalida = DateTime.SpecifyKind(
                    salida.FechaHoraSalida,
                    DateTimeKind.Utc
                ).ToUniversalTime();
            }
            catch { }

            if (_nominaLock.EstaBloqueda(salida.FechaHoraSalida, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            // ── ADMIN y SST omiten validación de programación semanal ─────────
            var rol = ObtenerRol();
            bool esEspecial = EsEspecial(rol);

            if (!esEspecial && !await EmpleadoProgramadoEstaSemana(salida.EmpleadoId))
            {
                return UnprocessableEntity(new
                {
                    mensaje = "No puede registrar horarios porque el empleado no ha sido programado para esta semana.",
                    codigo = "SIN_PROGRAMACION"
                });
            }

            bool existeTraslape = await _context.SalidasPersonal.AnyAsync(r =>
                r.EmpleadoId == salida.EmpleadoId &&
                r.FechaHoraSalida == salida.FechaHoraSalida
            );

            if (existeTraslape)
            {
                return Conflict("Ya existe una salida registrada para este empleado en esa fecha y hora.");
            }

            // ── Trazabilidad para ADMIN/SST ───────────────────────────────────
            if (esEspecial)
            {
                var registradoPor = ObtenerNombreRegistrador();
                salida.Comentarios = string.IsNullOrWhiteSpace(salida.Comentarios)
                    ? $"[Registro directo por {rol} - {registradoPor}]"
                    : $"{salida.Comentarios} [Registro directo por {rol} - {registradoPor}]";
            }

            _context.SalidasPersonal.Add(salida);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSalida), new { id = salida.Id }, salida);
        }

        // ─── PUT ──────────────────────────────────────────────────────────────

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSalida(int id, SalidasPersonal salida)
        {
            if (id != salida.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_nominaLock.EstaBloqueda(salida.FechaHoraSalida, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            // ── ADMIN y SST omiten validación de programación semanal ─────────
            var rol = ObtenerRol();
            bool esEspecial = EsEspecial(rol);

            if (!esEspecial && !await EmpleadoProgramadoEstaSemana(salida.EmpleadoId))
            {
                return UnprocessableEntity(new
                {
                    mensaje = "No puede registrar horarios porque el empleado no ha sido programado para esta semana.",
                    codigo = "SIN_PROGRAMACION"
                });
            }

            _context.Entry(salida).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.SalidasPersonal.Any(x => x.Id == id))
                    return NotFound();

                throw;
            }

            return NoContent();
        }

        // ─── DELETE ───────────────────────────────────────────────────────────

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSalida(int id)
        {
            var salida = await _context.SalidasPersonal.FindAsync(id);

            if (salida == null)
                return NotFound();

            if (_nominaLock.EstaBloqueda(salida.FechaHoraSalida, User))
            {
                return UnprocessableEntity(new
                {
                    mensaje = _nominaLock.MensajeDeBloqueoCierre()
                });
            }

            _context.SalidasPersonal.Remove(salida);
            await _context.SaveChangesAsync();

            return Ok(salida);
        }

        // ─── Endpoint dedicado para registro directo ADMIN/SST ───────────────
        // POST api/SalidasPersonal/directo

        [HttpPost("directo")]
        public async Task<IActionResult> RegistroDirecto([FromBody] RegistroSalidaDirectaDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var rol = ObtenerRol();
            if (!EsEspecial(rol))
                return Forbid();

            var empleado = await _context.Empleado.FindAsync(dto.EmpleadoId);
            if (empleado == null)
                return NotFound(new { mensaje = $"El empleado con ID {dto.EmpleadoId} no existe." });

            if (dto.FechaHoraSalida == default)
                return BadRequest(new { mensaje = "La fecha y hora de salida no es válida." });

            var fechaUtc = DateTime.SpecifyKind(dto.FechaHoraSalida, DateTimeKind.Utc);

            var registradoPor = ObtenerNombreRegistrador();
            var trazabilidad = $"[Registro directo por {rol} - {registradoPor} - {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC]";
            var comentarios = string.IsNullOrWhiteSpace(dto.Comentarios)
                ? trazabilidad
                : $"{dto.Comentarios} {trazabilidad}";

            var salida = new SalidasPersonal
            {
                EmpleadoId = dto.EmpleadoId,
                FechaHoraSalida = fechaUtc,
                Comentarios = comentarios
            };

            _context.SalidasPersonal.Add(salida);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = $"Salida registrada para {empleado.NombreCompleto}.",
                salida
            });
        }

        // ── Helper: verificar programación semanal ────────────────────────────
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

    // ── DTO para registro directo de salida ───────────────────────────────────
    public class RegistroSalidaDirectaDto
    {
        public int EmpleadoId { get; set; }
        public DateTime FechaHoraSalida { get; set; }
        public string? Comentarios { get; set; }
    }
}
