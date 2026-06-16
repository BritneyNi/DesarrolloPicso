using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;

[ApiController]
[Route("api/rrhh-dashboard")]
public class RRHHDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RRHHDashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("contratos")]
    public async Task<ActionResult<ContratoDashboardDto>> GetEstadoContratos()
    {
        var empleadosActivos = await _context.Empleado
            .Where(e => e.Estado == "Activo")
            .ToListAsync();

        var total = empleadosActivos.Count;

        var firmados = empleadosActivos.Count(e =>
            e.FirmoContrato != null &&
            (e.FirmoContrato.ToLower() == "sí" || e.FirmoContrato.ToLower() == "si")
        );

        var pendientes = total - firmados;

        var resultado = new ContratoDashboardDto
        {
            TotalEmpleadosActivos = total,
            ContratosFirmados = firmados,
            ContratosPendientes = pendientes
        };

        return Ok(resultado);
    }

[HttpGet("examen-ingreso")]
public IActionResult ExamenIngreso()
{
    var empleadosActivos = _context.Empleado
        .Where(e => e.Estado == "Activo");

    var total = empleadosActivos.Count();
    var conExamen = empleadosActivos.Count(e => e.examenIngreso != null);
    var sinExamen = total - conExamen;

    return Ok(new {
        totalEmpleadosActivos = total,
        conExamen,
        sinExamen
    });
}

[HttpGet("alturas")]
public IActionResult Alturas()
{
    var hoy = DateTime.Today;

    var empleados = _context.Empleado
        .Where(e => e.Estado == "Activo");

    var total = empleados.Count();

    var sinCurso = empleados.Count(e => e.VencimientoAptitudAlturas == null);
    var vigentes = empleados.Count(e =>
        e.VencimientoAptitudAlturas != null &&
        e.VencimientoAptitudAlturas >= hoy
    );
    var vencidos = empleados.Count(e =>
        e.VencimientoAptitudAlturas != null &&
        e.VencimientoAptitudAlturas < hoy
    );

    return Ok(new
    {
        totalEmpleadosActivos = total,
        vigentes,
        vencidos,
        sinCurso
    });
}

[HttpGet("afiliaciones")]
public IActionResult Afiliaciones()
{
    var empleados = _context.Empleado
        .Where(e => e.Estado == "Activo");

    var total = empleados.Count();

    var completos = empleados.Count(e =>
        !string.IsNullOrWhiteSpace(e.Eps) &&
        !string.IsNullOrWhiteSpace(e.ARL) &&
        !string.IsNullOrWhiteSpace(e.FondoPension) &&
        !string.IsNullOrWhiteSpace(e.CCF)
    );

    var sinAfiliacion = empleados.Count(e =>
        string.IsNullOrWhiteSpace(e.Eps) &&
        string.IsNullOrWhiteSpace(e.ARL) &&
        string.IsNullOrWhiteSpace(e.FondoPension) &&
        string.IsNullOrWhiteSpace(e.CCF)
    );

    var incompletos = total - completos - sinAfiliacion;

    return Ok(new
    {
        totalEmpleadosActivos = total,
        completos,
        incompletos,
        sinAfiliacion
    });
}


[HttpGet("liquidacion")]
public IActionResult Liquidacion()
{
    var empleados = _context.Empleado
        .Where(e => e.Estado == "Inactivo");

    var total = empleados.Count();

    var pagadas = empleados.Count(e =>
        !string.IsNullOrWhiteSpace(e.PagoLiquidacion) &&
        e.PagoLiquidacion.Trim().ToLower() == "si"
    );

    var pendientes = empleados.Count(e =>
        !string.IsNullOrWhiteSpace(e.PagoLiquidacion) &&
        e.PagoLiquidacion.Trim().ToLower() == "no"
    );

    var sinRegistro = empleados.Count(e =>
        string.IsNullOrWhiteSpace(e.PagoLiquidacion) ||
        e.PagoLiquidacion.Trim().ToLower() == "no aplica"
    );

    return Ok(new
    {
        totalEmpleados = total,
        pagadas,
        pendientes,
        sinRegistro
    });
}

[HttpGet("inactivos")]
public IActionResult ObtenerInactivos()
{
    var empleados = _context.Empleado
        .Where(e => e.Estado == "Inactivo")
        .Select(e => new
        {
            id = e.Id,
            nombreCompleto = e.NombreCompleto,
            fechaInicio = e.FechaInicioContrato,
            fechaFin = e.FechaRetiro,
            pagoLiquidacion = e.PagoLiquidacion
        })
        .ToList();
    return Ok(empleados);
}


[HttpPut("actualizar-liquidacion/{id}")]
public IActionResult ActualizarLiquidacion(int id, [FromBody] ActualizarLiquidacionDto data)
{
    var empleado = _context.Empleado.Find(id);
    if (empleado == null) return NotFound();

    empleado.PagoLiquidacion = data.PagoLiquidacion;
    empleado.Estado = data.Estado;

    _context.SaveChanges();

    return Ok();
}


[HttpGet("contratos/pendientes")]
public async Task<IActionResult> ContratosPendientes()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
            (e.FirmoContrato == null ||
             e.FirmoContrato.ToLower() != "sí" &&
             e.FirmoContrato.ToLower() != "si"))
        .Select(e => new
        {
            e.Id,
            e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToListAsync();

    return Ok(empleados);
}


[HttpGet("contratos/firmados")]
public async Task<IActionResult> ContratosFirmados()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
            e.FirmoContrato != null &&
            (e.FirmoContrato.ToLower() == "sí" ||
             e.FirmoContrato.ToLower() == "si"))
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToListAsync();

    return Ok(empleados);
}

[HttpPut("contratos/{id}/firmar")]
public async Task<IActionResult> MarcarComoFirmado(int id)
{
    var empleado = await _context.Empleado.FindAsync(id);

    if (empleado == null)
        return NotFound();

    empleado.FirmoContrato = "Sí";

    await _context.SaveChangesAsync();

    return Ok();
}


[HttpPut("contratos/{id}/no-firmado")]
public async Task<IActionResult> MarcarComoNoFirmado(int id)
{
    var empleado = await _context.Empleado.FindAsync(id);

    if (empleado == null)
        return NotFound();

    empleado.FirmoContrato = null;

    await _context.SaveChangesAsync();

    return NoContent();
}


[HttpGet("afiliaciones/sin-afiliacion")]
public async Task<IActionResult> EmpleadosSinAfiliacion()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
            string.IsNullOrWhiteSpace(e.Eps) &&
            string.IsNullOrWhiteSpace(e.ARL) &&
            string.IsNullOrWhiteSpace(e.FondoPension) &&
            string.IsNullOrWhiteSpace(e.CCF))
        .Select(e => new
        {
            e.Id,
            e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToListAsync();

    return Ok(empleados);
}


[HttpGet("afiliaciones/completas")]
public async Task<IActionResult> EmpleadosAfiliacionCompleta()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
            !string.IsNullOrWhiteSpace(e.Eps) &&
            !string.IsNullOrWhiteSpace(e.ARL) &&
            !string.IsNullOrWhiteSpace(e.FondoPension) &&
            !string.IsNullOrWhiteSpace(e.CCF))
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToListAsync();

    return Ok(empleados);
}


[HttpGet("afiliaciones/incompletas")]
public async Task<IActionResult> EmpleadosAfiliacionIncompleta()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
            (
                string.IsNullOrWhiteSpace(e.Eps) ||
                string.IsNullOrWhiteSpace(e.ARL) ||
                string.IsNullOrWhiteSpace(e.FondoPension) ||
                string.IsNullOrWhiteSpace(e.CCF)
            ) &&
            !(
                string.IsNullOrWhiteSpace(e.Eps) &&
                string.IsNullOrWhiteSpace(e.ARL) &&
                string.IsNullOrWhiteSpace(e.FondoPension) &&
                string.IsNullOrWhiteSpace(e.CCF)
            )
        )
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra,
            e.Eps,
            e.ARL,
            e.FondoPension,
            e.CCF
        })
        .ToListAsync();

    return Ok(empleados);
}

[HttpPut("empleado/{id}/afiliacion")]
public async Task<IActionResult> ActualizarAfiliacion(int id, [FromBody] AfiliacionDto afiliacion)
{
    var empleado = await _context.Empleado.FindAsync(id);
    if (empleado == null)
        return NotFound("Empleado no encontrado");

    // Actualizamos solo los campos de afiliación
    empleado.Eps = afiliacion.Eps;
    empleado.ARL = afiliacion.ARL;
    empleado.FondoPension = afiliacion.FondoPension;
    empleado.CCF = afiliacion.CCF;

    try
    {
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Afiliación actualizada correctamente", empleado });
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.ToString());
    }
}

// DTO para enviar solo la info de afiliación
public class AfiliacionDto
{
    public string? Eps { get; set; }
    public string? ARL { get; set; }
    public string? FondoPension { get; set; }
    public string? CCF { get; set; }
}

[HttpGet("examen-ingreso/sin")]
public async Task<IActionResult> EmpleadosSinExamenIngreso()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
                    e.examenIngreso == null)
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToListAsync();

    return Ok(empleados);
}


[HttpGet("examen-ingreso/con")]
public async Task<IActionResult> EmpleadosConExamenIngreso()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
                    e.examenIngreso != null)
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra,
            fechaExamenIngreso = e.examenIngreso
        })
        .ToListAsync();

    return Ok(empleados);
}

[HttpPut("actualizar-fecha-examen/{id}")]
public async Task<IActionResult> ActualizarFechaExamen(int id, [FromBody] DateTime fecha)
{
    var empleado = await _context.Empleado.FindAsync(id);

    if (empleado == null)
        return NotFound(new { mensaje = "Empleado no encontrado" });

    empleado.examenIngreso = fecha;

    await _context.SaveChangesAsync();

    return Ok(new { mensaje = "Fecha actualizada correctamente" });
}

[HttpGet("dotacion")]
public IActionResult Dotacion()
{
    var empleadosActivos = _context.Empleado
        .Where(e => e.Estado == "Activo")
        .Select(e => e.Id)
        .ToList();

    var entregas = _context.EntregasEpp
        .Where(e => empleadosActivos.Contains(e.EmpleadoId))
        .GroupBy(e => e.EmpleadoId)
        .Select(g => new
        {
            EmpleadoId = g.Key,
            TieneVigente = g.Any(x => x.Estado == "Activo"),
            TieneVencido = g.Any(x => x.Estado == "Vencido")
        })
        .ToList();

    var conVigente = entregas.Count(e => e.TieneVigente);
    var conVencido = entregas.Count(e => !e.TieneVigente && e.TieneVencido);
    var sinDotacion = empleadosActivos.Count - entregas.Count;

    return Ok(new
    {
        totalEmpleadosActivos = empleadosActivos.Count,
        conDotacionVigente = conVigente,
        dotacionVencida = conVencido,
        sinDotacion
    });
}

[HttpGet("dotacion/vigente")]
public async Task<IActionResult> EmpleadosDotacionVigente()
{
    var entregas = await _context.EntregasEpp
        .Include(e => e.Empleado)
        .Include(e => e.ElementoEppInventario)
            .ThenInclude(i => i.ElementoEpp)
        .Where(e => e.Estado == "Activo")
        .ToListAsync();

    var resultado = entregas
        .GroupBy(e => e.EmpleadoId)
        .Select(g => new
        {
            empleadoId = g.Key,
            nombreCompleto = g.First().Empleado.NombreCompleto,
            cedula = g.First().Empleado.Cedula,
            cargo = g.First().Empleado.Cargo,
            obra = g.First().Empleado.Obra,
            fechaEntrega = g.Min(x => x.FechaEntrega),

            elementos = g.Select(x => new
            {
                elemento = x.ElementoEppInventario.ElementoEpp.Nombre,
                talla = x.ElementoEppInventario.Talla,
                cantidad = x.CantidadEntregada,
                estado = x.Estado,
                fechaVencimiento = x.FechaVencimiento
            }).ToList()
        })
        .ToList();

    return Ok(resultado);
}


[HttpGet("dotacion/sin")]
public async Task<IActionResult> EmpleadosSinDotacion()
{
    var empleadosActivos = await _context.Empleado
        .Where(e => e.Estado == "Activo")
        .ToListAsync();

    var empleadosConEntrega = await _context.EntregasEpp
        .Select(e => e.EmpleadoId)
        .Distinct()
        .ToListAsync();

    var empleadosSinDotacion = empleadosActivos
        .Where(e => !empleadosConEntrega.Contains(e.Id))
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra
        })
        .ToList();

    return Ok(empleadosSinDotacion);
}

[HttpGet("dotacion/vencida")]
public async Task<IActionResult> EmpleadosDotacionVencida()
{
    var entregas = await _context.EntregasEpp
        .Include(e => e.Empleado)
        .Include(e => e.ElementoEppInventario)
            .ThenInclude(i => i.ElementoEpp)
        .Where(e => e.Estado == "Vencido")
        .ToListAsync();

    var resultado = entregas
        .GroupBy(e => e.EmpleadoId)
        .Select(g => new
        {
            empleadoId = g.Key,
            nombreCompleto = g.First().Empleado.NombreCompleto,
            cedula = g.First().Empleado.Cedula,
            cargo = g.First().Empleado.Cargo,
            obra = g.First().Empleado.Obra,
            fechaEntrega = g.Min(x => x.FechaEntrega),

            elementos = g.Select(x => new
            {
                elemento = x.ElementoEppInventario.ElementoEpp.Nombre,
                talla = x.ElementoEppInventario.Talla,
                cantidad = x.CantidadEntregada,
                estado = x.Estado,
                fechaVencimiento = x.FechaVencimiento
            }).ToList()
        })
        .ToList();

    return Ok(resultado);
}

[HttpGet("alturas/vigentes")]
public async Task<IActionResult> EmpleadosAlturasVigentes()
{
    var hoy = DateTime.Today;

    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
                    e.VencimientoAptitudAlturas != null &&
                    e.VencimientoAptitudAlturas >= hoy)
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            cedula = e.Cedula,
            cargo = e.Cargo,
            obra = e.Obra,
            fechaCurso = e.AptitudEnAltura,
            fechaVencimiento = e.VencimientoAptitudAlturas
        })
        .ToListAsync();

    return Ok(empleados);
}



[HttpGet("alturas/vencidos")]
public async Task<IActionResult> EmpleadosAlturasVencidos()
{
    var hoy = DateTime.Today;

    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
                    e.VencimientoAptitudAlturas != null &&
                    e.VencimientoAptitudAlturas < hoy)
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra,
            fechaCurso = e.AptitudEnAltura,
            fechaVencimiento = e.VencimientoAptitudAlturas

        })
        .ToListAsync();

    return Ok(empleados);
}

[HttpPut("alturas/{id}")]
public async Task<IActionResult> ActualizarFechasAltura(int id, [FromBody] ActualizarAlturasDto dto)
{
    var empleado = await _context.Empleado.FindAsync(id);

    if (empleado == null)
        return NotFound("Empleado no encontrado");

    empleado.AptitudEnAltura = dto.AptitudEnAltura;
    empleado.VencimientoAptitudAlturas = dto.VencimientoAptitudAlturas;

    await _context.SaveChangesAsync();

    return Ok(new { mensaje = "Fechas actualizadas correctamente" });
}

[HttpGet("alturas/sin-curso")]
public async Task<IActionResult> EmpleadosAlturasSinCurso()
{
    var empleados = await _context.Empleado
        .Where(e => e.Estado == "Activo" &&
                    e.VencimientoAptitudAlturas == null)
        .Select(e => new
        {
            e.Id,
            nombreCompleto = e.NombreCompleto,
            e.Cedula,
            e.Cargo,
            e.Obra,
            fechaCurso = e.AptitudEnAltura,
            fechaVencimiento = e.VencimientoAptitudAlturas
        })
        .ToListAsync();

    return Ok(empleados);
}
[HttpGet("tendencias")]
public IActionResult Tendencias([FromQuery] int meses = 6)
{
    var hoy = DateTime.Today;
    var inicio = new DateTime(hoy.Year, hoy.Month, 1).AddMonths(-meses + 1);

    var empleados = _context.Empleado.ToList();

    var resultado = new List<object>();

    for (int i = 0; i < meses; i++)
    {
        var mesInicio = inicio.AddMonths(i);
        var mesFin = mesInicio.AddMonths(1).AddDays(-1);
        var etiqueta = mesInicio.ToString("MMM yyyy");

        var contratosNuevos = empleados.Count(e =>
            e.FechaInicioContrato != null &&
            e.FechaInicioContrato >= mesInicio &&
            e.FechaInicioContrato <= mesFin
        );

        var examenesNuevos = empleados.Count(e =>
            e.examenIngreso != null &&
            e.examenIngreso >= mesInicio &&
            e.examenIngreso <= mesFin
        );

        var alturasNuevas = empleados.Count(e =>
            e.AptitudEnAltura != null &&
            e.AptitudEnAltura >= mesInicio &&
            e.AptitudEnAltura <= mesFin
        );

        var liquidacionesPagadas = empleados.Count(e =>
            e.FechaRetiro != null &&
            e.FechaRetiro >= mesInicio &&
            e.FechaRetiro <= mesFin &&
            e.PagoLiquidacion != null &&
            e.PagoLiquidacion.Trim().ToLower() == "si"
        );

        resultado.Add(new
        {
            mes = etiqueta,
            contratos = contratosNuevos,
            examenes = examenesNuevos,
            alturas = alturasNuevas,
            liquidaciones = liquidacionesPagadas
        });
    }

    return Ok(resultado);
}

}
