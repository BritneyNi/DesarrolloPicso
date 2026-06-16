using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ObrasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ObrasController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetObras()
        {
            var obras = await _context.Obra
                .Where(o => o.Estado == "Activo")
                .OrderByDescending(o => o.Id)
                .ToListAsync();

            var usuarios = await _context.Usuario
                .Select(u => new { u.Id, u.NombreCompleto })
                .ToListAsync();

            var dto = obras.Select(o => new
            {
                o.Id,
                o.NombreObra,
                o.ClienteObra,
                o.CostoObra,
                o.Estado,
                o.Ciudad,
                o.Ubicacion,
                o.ResponsableId,
                ResponsableNombre = usuarios.FirstOrDefault(u => u.Id == o.ResponsableId)?.NombreCompleto,
                o.ResponsableSecundario,
                Tamano = o.tamano,
                o.FechaCreacion,
                o.FechaInicio,
                o.FechaFin,
                o.TurnoObra
            });

            return Ok(dto);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetObra(int id)
        {
            var o = await _context.Obra
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.Estado == "Activo");

            if (o == null) return NotFound();

            var nombreResp = await _context.Usuario
                .Where(u => u.Id == o.ResponsableId)
                .Select(u => u.NombreCompleto)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                o.Id,
                o.NombreObra,
                o.ClienteObra,
                o.CostoObra,
                o.Estado,
                o.Ciudad,
                o.Ubicacion,
                o.ResponsableId,
                ResponsableNombre = nombreResp,
                o.ResponsableSecundario,
                Tamano = o.tamano,
                o.FechaCreacion,
                o.FechaInicio,
                o.FechaFin,
                o.TurnoObra
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateObra([FromBody] Obra o)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(o.Ubicacion))
                return BadRequest("Ubicación requerida.");

            if (o.ResponsableId.HasValue)
            {
                bool existe = await _context.Usuario.AnyAsync(u => u.Id == o.ResponsableId);
                if (!existe) return BadRequest("Responsable no existe.");
            }

            if(o.CostoObra <= 0)
                return BadRequest("Costo inválido");

            if(o.tamano <= 0)
                return BadRequest("Área inválida");

            if(o.FechaFin <= o.FechaInicio)
                return BadRequest("Fecha fin debe ser mayor a fecha inicio");

            o.Estado = "Activo";
            o.FechaCreacion = DateTime.Now;
            o.TurnoObra = o.TurnoObra ?? "Diurno";
            _context.Obra.Add(o);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetObra), new { id = o.Id }, new { o.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditObra(int id, [FromBody] Obra o)
        {
            if (id != o.Id) return BadRequest("ID no coincide.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (o.ResponsableId.HasValue)
            {
                bool existe = await _context.Usuario.AnyAsync(u => u.Id == o.ResponsableId);
                if (!existe) return BadRequest("Responsable no existe.");
            }

            var orig = await _context.Obra.FindAsync(id);
            if (orig == null) return NotFound();

            orig.NombreObra = o.NombreObra;
            orig.ClienteObra = o.ClienteObra;
            orig.CostoObra = o.CostoObra;
            orig.Estado = o.Estado;
            orig.Ciudad = o.Ciudad;
            orig.Ubicacion = o.Ubicacion;
            orig.ResponsableId = o.ResponsableId;
            orig.ResponsableSecundario = o.ResponsableSecundario;
            orig.tamano = o.tamano;
            orig.FechaFin = o.FechaFin;
            orig.FechaInicio = o.FechaInicio;
            orig.TurnoObra = o.TurnoObra ?? "Diurno";

            await _context.SaveChangesAsync();

            string? nombreResponsable = null;
            if (o.ResponsableId.HasValue)
            {
                var usuario = await _context.Usuario.FirstOrDefaultAsync(u => u.Id == o.ResponsableId.Value);
                if (usuario != null)
                    nombreResponsable = usuario.NombreCompleto;
            }

            var empleadosRelacionados = await _context.Empleado
                .Where(e => e.Obra == o.NombreObra)
                .ToListAsync();

            foreach (var empleado in empleadosRelacionados)
            {
                empleado.Responsable = nombreResponsable ?? "Sin responsable";
                empleado.ResponsableSecundario = o.ResponsableSecundario ?? "Sin responsable";
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteObra(int id)
        {
            var o = await _context.Obra.FindAsync(id);
            if (o == null) return NotFound();

            o.Estado = "Inactivo";
            await _context.SaveChangesAsync();
            return Ok(new { o.Id });
        }

        [HttpGet("inactivas")]
        public async Task<IActionResult> GetObrasInactivas()
        {
            var obras = await _context.Obra
                .Where(o => o.Estado == "Inactivo")
                .OrderByDescending(o => o.Id)
                .ToListAsync();

            var usuarios = await _context.Usuario
                .Select(u => new { u.Id, u.NombreCompleto })
                .ToListAsync();

            var dto = obras.Select(o => new
            {
                o.Id,
                o.NombreObra,
                o.ClienteObra,
                o.CostoObra,
                o.Estado,
                o.Ubicacion,
                o.ResponsableId,
                ResponsableNombre = usuarios.FirstOrDefault(u => u.Id == o.ResponsableId)?.NombreCompleto,
                o.ResponsableSecundario,
                Tamano = o.tamano,
                o.FechaCreacion,
                o.FechaFin,
                o.FechaInicio,
                o.TurnoObra
            });

            return Ok(dto);
        }

        [HttpPut("{id}/reactivar")]
        public async Task<IActionResult> ReactivarObra(int id)
        {
            var o = await _context.Obra.FindAsync(id);
            if (o == null) return NotFound();

            o.Estado = "Activo";
            await _context.SaveChangesAsync();

            return Ok(new { o.Id });
        }

        [HttpGet("dashboard/costo-mt2")]
        public async Task<IActionResult> GetDashboardCostoMt2()
        {
            var data = await _context.Obra
                .Where(x => x.Estado == "Activo")
                .GroupBy(x => x.NombreObra)
                .Select(g => new DashboardCostoMt2Dto
                {
                    Obra = g.Key,
                    CostoTotal = g.Sum(x => x.CostoObra),
                    Mt2Total = g.Sum(x => x.tamano),
                    PrecioMt2 = g.Sum(x => x.tamano) == 0
                        ? 0
                        : g.Sum(x => x.CostoObra) / g.Sum(x => x.tamano)
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/personal-obra")]
        public async Task<IActionResult> GetDashboardPersonalObra()
        {
            var data = await _context.Obra
                .Where(o => o.Estado == "Activo")
                .GroupJoin(
                    _context.Empleado.Where(e => e.Estado == "Activo"),
                    obra => obra.NombreObra,
                    emp => emp.Obra,
                    (obra, empleados) => new
                    {
                        Obra = obra.NombreObra,
                        Cantidad = empleados.Count()
                    })
                .OrderByDescending(x => x.Cantidad)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/personal-obra-rango")]
        public async Task<IActionResult> GetDashboardPersonalObraRango(DateTime fechaInicio, DateTime fechaFin)
        {
            var asignacionesFiltradas = _context.AsignacionesEmpleadoObra
                .Where(a =>
                    a.FechaInicio <= fechaFin &&
                    (a.FechaFin == null || a.FechaFin >= fechaInicio)
                );

            var data = await asignacionesFiltradas
                .Join(_context.Obra,
                    asignacion => asignacion.ObraId,
                    obra => obra.Id,
                    (asignacion, obra) => new { obra.NombreObra })
                .GroupBy(x => x.NombreObra)
                .Select(g => new { Obra = g.Key, Cantidad = g.Count() })
                .OrderByDescending(x => x.Cantidad)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/personal-ciudad")]
        public async Task<IActionResult> GetDashboardPersonalCiudad()
        {
            var data = await _context.Empleado
                .Where(e => e.Estado == "Activo")
                .Join(
                    _context.Obra.Where(o => o.Estado == "Activo"),
                    emp => emp.Obra,
                    obra => obra.NombreObra,
                    (emp, obra) => new { obra.Ciudad })
                .GroupBy(x => x.Ciudad)
                .Select(g => new { Ciudad = g.Key, Cantidad = g.Count() })
                .OrderByDescending(x => x.Cantidad)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/personal-ciudad-rango")]
        public async Task<IActionResult> GetDashboardPersonalCiudadRango(DateTime fechaInicio, DateTime fechaFin)
        {
            var asignacionesFiltradas = _context.AsignacionesEmpleadoObra
                .Where(a =>
                    a.FechaInicio <= fechaFin &&
                    (a.FechaFin == null || a.FechaFin >= fechaInicio)
                );

            var data = await asignacionesFiltradas
                .Join(_context.Obra,
                    asignacion => asignacion.ObraId,
                    obra => obra.Id,
                    (asignacion, obra) => new { obra.Ciudad })
                .GroupBy(x => x.Ciudad)
                .Select(g => new { Ciudad = g.Key, Cantidad = g.Count() })
                .OrderByDescending(x => x.Cantidad)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/obra-resumen")]
        public async Task<IActionResult> GetDashboardObraResumen()
        {
            var data = await _context.Obra
                .Where(o => o.Estado == "Activo")
                .GroupJoin(
                    _context.Empleado.Where(e => e.Estado == "Activo"),
                    obra => obra.NombreObra,
                    emp => emp.Obra,
                    (obra, empleados) => new
                    {
                        Obra = obra.NombreObra,
                        Ubicacion = obra.Ubicacion,
                        Empleados = empleados.Count(),
                        SalarioTotal = empleados.Sum(x => (decimal?)x.Salario) ?? 0
                    })
                .Select(x => new
                {
                    x.Obra,
                    x.Ubicacion,
                    x.Empleados,
                    x.SalarioTotal,
                    SalarioPromedio = x.Empleados == 0 ? 0 : x.SalarioTotal / x.Empleados
                })
                .OrderByDescending(x => x.SalarioTotal)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/obra-resumen-rango")]
        public async Task<IActionResult> GetDashboardObraResumenRango(DateTime fechaInicio, DateTime fechaFin)
        {
            var asignacionesFiltradas = _context.AsignacionesEmpleadoObra
                .Where(a =>
                    a.FechaInicio <= fechaFin &&
                    (a.FechaFin == null || a.FechaFin >= fechaInicio)
                );

            var data = await asignacionesFiltradas
                .Join(_context.Obra,
                    asignacion => asignacion.ObraId,
                    obra => obra.Id,
                    (asignacion, obra) => new { asignacion, obra })
                .Join(_context.Empleado,
                    temp => temp.asignacion.EmpleadoId,
                    empleado => empleado.Id,
                    (temp, empleado) => new
                    {
                        temp.obra.NombreObra,
                        temp.obra.Ubicacion,
                        Salario = empleado.Salario ?? 0
                    })
                .GroupBy(x => new { x.NombreObra, x.Ubicacion })
                .Select(g => new
                {
                    Obra = g.Key.NombreObra,
                    Ubicacion = g.Key.Ubicacion,
                    Empleados = g.Count(),
                    SalarioTotal = g.Sum(x => x.Salario),
                    SalarioPromedio = g.Count() == 0 ? 0 : g.Sum(x => x.Salario) / g.Count()
                })
                .OrderByDescending(x => x.SalarioTotal)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/salario-ciudad")]
        public async Task<IActionResult> GetDashboardSalarioCiudad()
        {
            var data = await _context.Obra
                .Where(o => o.Estado == "Activo")
                .Join(
                    _context.Empleado.Where(e => e.Estado == "Activo"),
                    obra => obra.NombreObra,
                    emp => emp.Obra,
                    (obra, emp) => new { obra.Ciudad, emp.Salario })
                .GroupBy(x => x.Ciudad)
                .Select(g => new { Ciudad = g.Key, SalarioTotal = g.Sum(x => x.Salario) })
                .OrderByDescending(x => x.SalarioTotal)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("dashboard/salario-ciudad-rango")]
        public async Task<IActionResult> GetDashboardSalarioCiudadRango(DateTime fechaInicio, DateTime fechaFin)
        {
            var asignacionesFiltradas = _context.AsignacionesEmpleadoObra
                .Where(a =>
                    a.FechaInicio <= fechaFin &&
                    (a.FechaFin == null || a.FechaFin >= fechaInicio)
                );

            var data = await asignacionesFiltradas
                .Join(_context.Obra,
                    asignacion => asignacion.ObraId,
                    obra => obra.Id,
                    (asignacion, obra) => new { asignacion, obra })
                .Join(_context.Empleado,
                    temp => temp.asignacion.EmpleadoId,
                    empleado => empleado.Id,
                    (temp, empleado) => new
                    {
                        temp.obra.Ciudad,
                        Salario = empleado.Salario ?? 0
                    })
                .GroupBy(x => x.Ciudad)
                .Select(g => new { Ciudad = g.Key, SalarioTotal = g.Sum(x => x.Salario) })
                .OrderByDescending(x => x.SalarioTotal)
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost("{id}/asignar-empleados")]
        public async Task<IActionResult> AsignarEmpleados(int id, [FromBody] List<int> empleadoIds)
        {
            var obra = await _context.Obra.FindAsync(id);
            if (obra == null) return NotFound("Obra no encontrada.");

            string? nombreResponsable = null;
            if (obra.ResponsableId.HasValue)
            {
                nombreResponsable = await _context.Usuario
                    .Where(u => u.Id == obra.ResponsableId)
                    .Select(u => u.NombreCompleto)
                    .FirstOrDefaultAsync();
            }

            // Limpiar empleados que ya no están en la lista
            var empleadosAnteriores = await _context.Empleado
                .Where(e => e.Obra == obra.NombreObra && e.Estado == "Activo")
                .ToListAsync();

            foreach (var empAnterior in empleadosAnteriores)
            {
                if (!empleadoIds.Contains(empAnterior.Id))
                {
                    empAnterior.Obra = "Sin obra";
                    empAnterior.Responsable = "Sin responsable";
                    empAnterior.ResponsableSecundario = "Sin responsable";
                }
            }

            foreach (var empleadoId in empleadoIds)
            {
                var empleado = await _context.Empleado.FindAsync(empleadoId);
                if (empleado == null) continue;

                var asignacionAnterior = await _context.AsignacionesEmpleadoObra
                    .FirstOrDefaultAsync(a => a.EmpleadoId == empleadoId && a.Activo);

                if (asignacionAnterior != null)
                {
                    asignacionAnterior.Activo = false;
                    asignacionAnterior.FechaFin = DateTime.Now;
                }

                empleado.Obra = obra.NombreObra;
                empleado.Responsable = nombreResponsable ?? "Sin responsable";
                empleado.ResponsableSecundario = obra.ResponsableSecundario ?? "Sin responsable";

                if (obra.TurnoObra == "Nocturno" || obra.TurnoObra == "Diurno")
                {
                    empleado.Turno = obra.TurnoObra;
                }

                _context.AsignacionesEmpleadoObra.Add(new AsignacionEmpleadoObra
                {
                    EmpleadoId = empleadoId,
                    ObraId = id,
                    FechaInicio = DateTime.Now,
                    Activo = true
                });
            }

            // Programación semanal automática
            var hoy = DateTime.UtcNow.Date;
            int diasDesdeElLunes = ((int)hoy.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
            var lunes = hoy.AddDays(-diasDesdeElLunes);
            var domingo = lunes.AddDays(6);
            int residenteId = obra.ResponsableId.HasValue ? obra.ResponsableId.Value : id;
            foreach (var empId in empleadoIds)
            {
                // FIX: buscar programación existente esta semana para este empleado
                var progExistente = await _context.ProgramacionSemanal
                    .FirstOrDefaultAsync(p => p.EmpleadoId == empId && p.FechaInicioSemana <= domingo && p.FechaFinSemana >= lunes);

                if (progExistente == null)
                {
                    // No tiene programación esta semana — crear nueva
                    _context.ProgramacionSemanal.Add(new ProgramacionSemanal
                    {
                        EmpleadoId        = empId,
                        ObraId            = id,
                        ResidenteId       = residenteId,
                        FechaInicioSemana = lunes,
                        FechaFinSemana    = domingo,
                        FechaCreacion     = DateTime.UtcNow
                    });
                }
                else if (progExistente.ObraId != id)
                {
                    // Está programado en otra obra — actualizar a la nueva
                    progExistente.ObraId = id;
                    progExistente.ResidenteId = residenteId;
                }
                // Si ya está en esta misma obra, no hacer nada
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Empleados asignados correctamente.", total = empleadoIds.Count });
        }

        [HttpGet("{id}/empleados")]
        public async Task<IActionResult> GetEmpleadosPorObra(int id)
        {
            var obra = await _context.Obra.FindAsync(id);
            if (obra == null) return NotFound("Obra no encontrada.");

            var empleados = await _context.Empleado
                .Where(e => e.Obra == obra.NombreObra && e.Estado == "Activo")
                .Select(e => new
                {
                    e.Id,
                    e.NombreCompleto,
                    e.Cargo,
                    e.Obra
                })
                .ToListAsync();

            return Ok(empleados);
        }
    }
}