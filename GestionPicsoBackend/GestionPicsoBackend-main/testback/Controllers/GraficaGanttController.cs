using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Services.Pdf;


namespace Gantt.Controllers
{
    [ApiController]
    [Route("api/gantt")]
    public class GanttController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly BlobService _blobService;
        private readonly InformePdfService _pdfService;
        public GanttController(ApplicationDbContext context,BlobService blobService,
            InformePdfService pdfService)
        {
            _context = context;
            _blobService = blobService;
            _pdfService = pdfService;
        }

        [HttpPost("crear-actividad")]
        public async Task<IActionResult> CrearActividad([FromBody] ActividadGantt dto)
        {
            if (dto.ProyectoGanttId == 0)
            return BadRequest("Debe enviar ProyectoGanttId");
            
            _context.ActividadesGantt.Add(dto);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        [HttpPost("registrar-avance")]
        public async Task<IActionResult> RegistrarAvance([FromBody] AvanceSemanal dto)
        {
            // 🔒 Validar que no exista esa semana
            var existe = await _context.AvancesSemanales
                .AnyAsync(a => a.ActividadGanttId == dto.ActividadGanttId 
                            && a.NumeroSemana == dto.NumeroSemana);

            if (existe)
                return BadRequest("Ya existe un registro para esa semana.");

            // 🔥 TRAER ACTIVIDAD CON SUS AVANCES
            var actividad = await _context.ActividadesGantt
                .Include(a => a.Avances)
                .FirstOrDefaultAsync(a => a.Id == dto.ActividadGanttId);

            if (actividad == null)
                return NotFound("Actividad no encontrada");

            // 🔥 SUMAR LO YA EJECUTADO
            var totalEjecutado = actividad.Avances.Sum(a => a.CantidadEjecutada);
            var restante = actividad.CantidadTotal - totalEjecutado;

            if (dto.CantidadEjecutada > restante)
            {
                return BadRequest(new {mensaje = $"Solo puedes registrar hasta {restante} %"});
            }

            // 🔥 CALCULAR DISPONIBLE
            var disponible = actividad.CantidadTotal - totalEjecutado;

            if (disponible <= 0)
                return BadRequest("La actividad ya alcanzó el 100%");

            // 🔥 VALIDAR QUE NO SE PASE
            if (dto.CantidadEjecutada > disponible)
            {
                return BadRequest(new { mensaje = $"Solo puedes registrar hasta {disponible} %."});
            }

            // 🔥 VALIDAR PRECEDENTE
            if (actividad.PrecedenteId.HasValue)
            {
                var precedente = await _context.ActividadesGantt
                    .Include(a => a.Avances)
                    .FirstOrDefaultAsync(a => a.Id == actividad.PrecedenteId);

                if (precedente != null)
                {
                    var totalEjecutadoPrecedente = precedente.Avances.Sum(a => a.CantidadEjecutada);

                    var porcentajePrecedente =
                        precedente.CantidadTotal == 0
                        ? 0
                        : (totalEjecutadoPrecedente / precedente.CantidadTotal) * 100;

                    var semanasTotalesPrecedente = (int)Math.Ceiling(
                            (precedente.FechaFin - precedente.FechaInicio).TotalDays / 7.0
                        );

                    var semanasRegistradasPrecedente = precedente.Avances
                        .Select(a => a.NumeroSemana)
                        .Distinct()
                        .Count();

                    var semanasEsperadas = Enumerable
                        .Range(1, semanasTotalesPrecedente)
                        .ToList();

                    var semanasRegistradas = precedente.Avances
                        .Select(a => a.NumeroSemana)
                        .Distinct()
                        .ToList();

                    var faltantes = semanasEsperadas
                        .Except(semanasRegistradas)
                        .ToList();

                    if (faltantes.Any())
                    {
                    return BadRequest(new {
                            mensaje = $"No puedes registrar avance. La actividad precedente \"{precedente.Nombre}\" tiene semanas pendientes: {string.Join(",", faltantes)}"
                        });
                    }

                }
            }

            // ✅ GUARDAR
            _context.AvancesSemanales.Add(dto);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }


        [HttpGet("obtener-gantt")]
        public async Task<IActionResult> ObtenerGantt([FromQuery] int? obraId)
        {
            var query = _context.ProyectosGantt
                .Include(p => p.Obra)
                .Include(p => p.Actividades)
                    .ThenInclude(a => a.Avances)
                .AsQueryable();

            // 🔥 FILTRO POR OBRA
            if (obraId.HasValue)
                query = query.Where(p => p.ObraId == obraId.Value);

            var proyectos = await query.ToListAsync();

            var resultado = proyectos.Select(p =>
            {
                var totalProyecto = p.Actividades.Sum(a => a.CantidadTotal);

                var actividades = p.Actividades.Select(a =>
                {
                    var totalEjecutado = a.Avances.Sum(x => x.CantidadEjecutada);

                    var porcentajeActividad =
                        a.CantidadTotal == 0
                        ? 0
                        : (totalEjecutado / a.CantidadTotal) * 100;

                    var pesoProyecto =
                        totalProyecto == 0
                        ? 0
                        : (a.CantidadTotal / totalProyecto) * 100;

                    return new
                    {
                        a.Id,
                        a.Nombre,
                        a.FechaInicio,
                        a.FechaFin,
                        PesoProyecto = pesoProyecto, // ✅ dinámico
                        a.ProyectoGanttId,
                        a.CantidadTotal,
                        a.TipoUnidad,
                        a.PrecedenteId,
                        Avances = a.Avances.Select(x => new {
                            x.NumeroSemana,
                            x.CantidadEjecutada,
                            x.FechaInicioSemana,
                            x.FechaFinSemana
                        }),
                        PorcentajeAvance = porcentajeActividad
                    };
                }).ToList();

                // ⭐ AVANCE REAL DEL PROYECTO (ponderado)
                decimal sumaPesos = actividades.Sum(a => a.PesoProyecto);

                decimal porcentajeProyecto =
                    sumaPesos == 0
                    ? 0
                    : actividades.Sum(a =>
                        a.PorcentajeAvance * a.PesoProyecto) / sumaPesos;

                return new
                {
                    ProyectoId = p.Id,
                    NombreProyecto = p.Nombre,
                    NombreObra = p.Obra!.NombreObra,
                    p.FechaInicio,
                    p.FechaFin,
                    PorcentajeProyecto = porcentajeProyecto,
                    Actividades = actividades
                };
            });

            return Ok(resultado);
        }

        [HttpGet("obras")]
        public async Task<IActionResult> ObtenerObras()
        {
            var obras = await _context.Obra
                .Where(o=>o.Estado.ToLower() =="activo")
                .Select(o => new {
                    o.Id,
                    o.NombreObra,
                    o.FechaInicio,
                    o.FechaFin
                })
                .ToListAsync();

            return Ok(obras);
        }

        [HttpPut("actualizar-actividad/{id}")]
        public async Task<IActionResult> ActualizarActividad(int id, [FromBody] ActividadGantt dto)
        {
            var actividad = await _context.ActividadesGantt
                .Include(a => a.Avances)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (actividad == null)
                return NotFound("Actividad no encontrada");

            // 🔥 actualizar campos
            actividad.Nombre = dto.Nombre;
            actividad.FechaInicio = dto.FechaInicio;
            actividad.FechaFin = dto.FechaFin;
            actividad.TipoUnidad = dto.TipoUnidad;
            actividad.CantidadTotal = dto.CantidadTotal;
            actividad.ProyectoGanttId = dto.ProyectoGanttId;
            //actividad.PesoProyecto = dto.PesoProyecto;

            await _context.SaveChangesAsync();

            return Ok(actividad);
        }

        [HttpDelete("actividades/{id}")]
        public async Task<IActionResult> EliminarActividad(int id)
        {
            var actividad = await _context.ActividadesGantt
                .Include(a => a.Avances)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (actividad == null)
                return NotFound("Actividad no encontrada");

            // 🔥 eliminar avances primero
            if (actividad.Avances.Any())
            {
                _context.AvancesSemanales.RemoveRange(actividad.Avances);
            }

            // 🔥 eliminar actividad
            _context.ActividadesGantt.Remove(actividad);

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Actividad eliminada correctamente" });
        }

        [HttpPost("crear-proyecto")]
        public async Task<IActionResult> CrearProyecto([FromBody] ProyectoGantt proyecto)

        {
            _context.ProyectosGantt.Add(proyecto);
            await _context.SaveChangesAsync();

            return Ok(proyecto);
        }

        [HttpGet("proyectos")]
        public async Task<IActionResult> ObtenerProyectos(int obraId)
        {
            var proyectos = await _context.ProyectosGantt
                .Include(p=>p.Obra)
                .Where(p => p.ObraId == obraId)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.FechaInicio,
                    p.FechaFin,
                    p.ObraId,
                    NombreObra = p.Obra.NombreObra
                })
                .ToListAsync();

            return Ok(proyectos);
        }

        [HttpDelete("proyectos/{id}")]
        public async Task<IActionResult> EliminarProyecto(int id)
        {
            var proyecto = await _context.ProyectosGantt
                .Include(p => p.Actividades)
                    .ThenInclude(a => a.Avances)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (proyecto == null)
                return NotFound("Proyecto no encontrado");

            // 🔥 eliminar avances
            var avances = proyecto.Actividades
                .SelectMany(a => a.Avances);

            _context.AvancesSemanales.RemoveRange(avances);

            // 🔥 eliminar actividades
            _context.ActividadesGantt.RemoveRange(proyecto.Actividades);

            // 🔥 eliminar proyecto
            _context.ProyectosGantt.Remove(proyecto);

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Proyecto eliminado correctamente" });
        }

        [HttpPut("actualizar-proyecto/{id}")]
        public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] ProyectoGantt dto)
        {
            var proyecto = await _context.ProyectosGantt
                .FirstOrDefaultAsync(p => p.Id == id);

            if (proyecto == null)
                return NotFound("Proyecto no encontrado");

            proyecto.Nombre = dto.Nombre;
            proyecto.FechaInicio = dto.FechaInicio;
            proyecto.FechaFin = dto.FechaFin;
            proyecto.ObraId = dto.ObraId;

            await _context.SaveChangesAsync();

            return Ok(proyecto);
        }

        [HttpPost("subir-evidencia")]
        public async Task<IActionResult> SubirEvidencia(
            [FromForm] IFormFile file,
            [FromForm] int actividadId,
            [FromForm] int? numeroSemana)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido");

            var actividad = await _context.ActividadesGantt
                .FirstOrDefaultAsync(a => a.Id == actividadId);

            if (actividad == null)
                return NotFound("Actividad no encontrada");

            // 🔥 subir a Azure (usas tu servicio existente)
            var url = await _blobService.UploadFileAsync(
                file,
                "evidencias-gantt"
            );

            var evidencia = new EvidenciaGantt
            {
                ActividadGanttId = actividadId,
                NumeroSemana = numeroSemana,
                Url = url,
                NombreArchivo = file.FileName
            };

            _context.EvidenciasGantt.Add(evidencia);
            await _context.SaveChangesAsync();

            return Ok(evidencia);
        }

        [HttpGet("evidencias/{actividadId}")]
        public async Task<IActionResult> ObtenerEvidencias(int actividadId)
        {
            var evidencias = await _context.EvidenciasGantt
                .Where(e => e.ActividadGanttId == actividadId)
                .OrderByDescending(e => e.FechaSubida)
                .ToListAsync();

            return Ok(evidencias);
        }

        [HttpPost("informe")]
        public async Task<IActionResult> GenerarInforme([FromBody] InformeRequestGantt dto)
        {
            var query = _context.ActividadesGantt
                .Include(a => a.Avances)
                .Include(a => a.Proyecto)
                    .ThenInclude(p => p.Obra)
                .Where(a => a.Proyecto!.ObraId == dto.ObraId);

            if (dto.ProyectoId.HasValue)
                query = query.Where(a => a.ProyectoGanttId == dto.ProyectoId);

            var actividades = await query.ToListAsync();

            // 🔥 traer solo evidencias seleccionadas
            var evidencias = await _context.EvidenciasGantt
                .Include(e => e.Actividad)
                .Where(e => dto.EvidenciaIds.Contains(e.Id))
                .OrderByDescending(e => e.FechaSubida)
                .Take(3)
                .ToListAsync();

            var pdf = _pdfService.GenerarInforme(
                actividades,
                dto.CurvaSImage,
                evidencias
            );

            return File(pdf, "application/pdf", "informe-gantt.pdf");
        }

        [HttpGet("evidencias-informe")]
        public async Task<IActionResult> ObtenerEvidenciasInforme(int obraId, int? proyectoId)
        {
            var query = _context.EvidenciasGantt
                .Include(e => e.Actividad)
                    .ThenInclude(a => a.Proyecto)
                .Where(e => e.Actividad.Proyecto!.ObraId == obraId);

            if (proyectoId.HasValue)
                query = query.Where(e => e.Actividad.ProyectoGanttId == proyectoId);

            var evidencias = await query
                .OrderByDescending(e => e.FechaSubida)
                .Select(e => new
                {
                    e.Id,
                    e.NombreArchivo,
                    e.Url,
                    e.FechaSubida,
                    e.NumeroSemana,
                    ActividadNombre = e.Actividad.Nombre
                })
                .ToListAsync();

            return Ok(evidencias);
        }

    }

}

