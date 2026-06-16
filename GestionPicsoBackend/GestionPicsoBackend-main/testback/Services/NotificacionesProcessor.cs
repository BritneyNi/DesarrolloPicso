using testback.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading;

public class NotificacionesProcessor
{
    private readonly ApplicationDbContext _context;

    // 🔐 LOCK GLOBAL
    private static SemaphoreSlim _lock = new SemaphoreSlim(1, 1);

    public NotificacionesProcessor(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task VerificarEmpleado(int empleadoId)
    {
    var empleado = await _context.Empleado
        .Where(e => e.Id == empleadoId && e.Estado != null && e.Estado.Trim().ToLower() == "activo")
        .FirstOrDefaultAsync();

    if (empleado == null) return;

    // 👇 Usamos tus métodos internos ya existentes
    await VerificarAfiliacionesInterno(new List<Empleado>{ empleado });
    await VerificarContratosInterno(new List<Empleado>{ empleado });
    await VerificarExamenIngresoInterno(new List<Empleado>{ empleado });
    await VerificarDotacionInterno(new List<Empleado>{ empleado });
    await VerificarAlturasInterno(new List<Empleado>{ empleado });
    await VerificarCumpleanosInterno(new List<Empleado>{ empleado });

    await _context.SaveChangesAsync();
}
private async Task ApagarNotificacionesEmpleadosInactivos()
{
    var notificaciones = await _context.Notificaciones
        .Where(n => n.Activa)
        .ToListAsync();

    var empleadosIds = notificaciones
        .Where(n => n.ReferenciaId != null)
        .Select(n => n.ReferenciaId)
        .Distinct()
        .ToList();

    var empleados = await _context.Empleado
        .AsNoTracking()
        .Where(e => empleadosIds.Contains(e.Id))
        .ToDictionaryAsync(e => e.Id);

    foreach (var n in notificaciones)
{
    if (n.ReferenciaId == null) continue;

    if (!empleados.TryGetValue(n.ReferenciaId.Value, out var emp) ||
        emp.Estado == null ||
        emp.Estado.Trim().ToLower() != "activo")
    {
        n.Activa = false;
        n.FechaResolucion = DateTime.Now;
    }
}
}


  public async Task EjecutarTodas()
{
    // 👀 Si alguien ya está ejecutando → no entramos
    if (!await _lock.WaitAsync(0))
    {
        Console.WriteLine("Notificaciones ya ejecutándose, se omite ejecución.");
        return;
    }

    try
    {

        await ApagarNotificacionesEmpleadosInactivos();
        await VerificarContratosInterno();
        await VerificarAfiliacionesInterno();
        await VerificarExamenIngresoInterno();
        await VerificarDotacionInterno();
        await VerificarAlturasInterno();
        await VerificarCumpleanosInterno();

        await _context.SaveChangesAsync();

    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error processor: {ex.Message}");
    }
    finally
    {
        _lock.Release();
    }
}
    // 👇 PEGAS AQUÍ TODOS LOS MÉTODOS PRIVADOS

    private async Task VerificarCumpleanosInterno(List<Empleado>? empleados = null)
{
    var manana = DateTime.Today.AddDays(1);

    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => n.Tipo == "Cumpleanos" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
    {
        if (e.FechaNacimiento == null) continue;

        var notificacionExistente = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id);

        bool cumpleManana =
            e.FechaNacimiento.Value.Day == manana.Day &&
            e.FechaNacimiento.Value.Month == manana.Month;

        if (cumpleManana)
        {
            var mensaje = $"Mañana cumple años {e.NombreCompleto} 🎉";

            if (notificacionExistente == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Cumpleaños próximo",
                    Mensaje = mensaje,
                    Tipo = "Cumpleanos",
                    ReferenciaId = e.Id
                });
            }
            else if (notificacionExistente.Mensaje != mensaje)
            {
                notificacionExistente.Mensaje = mensaje;
            }
        }
        else
        {
            if (notificacionExistente != null)
            {
                notificacionExistente.Activa = false;
                notificacionExistente.FechaResolucion = DateTime.Now;
            }
        }
    }
}
    private async Task VerificarAfiliacionesInterno(List<Empleado>? empleados = null)
{
    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => n.Tipo == "Afiliacion" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
{
    bool sinAfiliacion =
        string.IsNullOrWhiteSpace(e.Eps) &&
        string.IsNullOrWhiteSpace(e.ARL) &&
        string.IsNullOrWhiteSpace(e.FondoPension) &&
        string.IsNullOrWhiteSpace(e.CCF);

    bool incompleto =
        (string.IsNullOrWhiteSpace(e.Eps) ||
         string.IsNullOrWhiteSpace(e.ARL) ||
         string.IsNullOrWhiteSpace(e.FondoPension) ||
         string.IsNullOrWhiteSpace(e.CCF)) && !sinAfiliacion;

    var notificacionExistente = notificacionesActivas
        .FirstOrDefault(n => n.ReferenciaId == e.Id);

    // ⭐ CASO 1 → SIN AFILIACION
    if (sinAfiliacion)
    {
        var mensaje = $"{e.NombreCompleto} está sin afiliación registrada";

        if (notificacionExistente == null)
        {
            _context.Notificaciones.Add(new Notificacion
            {
                Titulo = "Afiliación pendiente",
                Mensaje = mensaje,
                Tipo = "Afiliacion",
                ReferenciaId = e.Id
            });
        }
        else if (notificacionExistente.Mensaje != mensaje)
        {
            // 🔥 ACTUALIZA MENSAJE
            notificacionExistente.Mensaje = mensaje;
        }
    }

    // ⭐ CASO 2 → INCOMPLETA
    else if (incompleto)
    {
        var mensaje = $"{e.NombreCompleto} tiene afiliación incompleta";

        if (notificacionExistente == null)
        {
            _context.Notificaciones.Add(new Notificacion
            {
                Titulo = "Afiliación pendiente",
                Mensaje = mensaje,
                Tipo = "Afiliacion",
                ReferenciaId = e.Id
            });
        }
        else if (notificacionExistente.Mensaje != mensaje)
        {
            // 🔥 ACTUALIZA MENSAJE
            notificacionExistente.Mensaje = mensaje;
        }
    }

    // ⭐ CASO 3 → COMPLETA
    else
    {
        if (notificacionExistente != null)
        {
            notificacionExistente.Activa = false;
            notificacionExistente.FechaResolucion = DateTime.Now;
        }
    }
}
}

private async Task VerificarContratosInterno(List<Empleado>? empleados = null)
{
    var hoy = DateTime.Today;
    var fechaLimite = hoy.AddDays(30);

    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => (n.Tipo == "Contrato" || n.Tipo == "ContratoSinRegistrar") && n.Activa)
        .ToListAsync();

    var notificacionesFirma = await _context.Notificaciones
        .Where(n => n.Tipo == "ContratoFirma" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
    {
        var notificacionContrato = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id && n.Tipo == "Contrato");

        var notificacionSinContrato = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id && n.Tipo == "ContratoSinRegistrar");

        var notifFirma = notificacionesFirma
            .FirstOrDefault(n => n.ReferenciaId == e.Id && n.Tipo == "ContratoFirma");

        // Solo validamos si hay contrato registrado
        if (e.FechaInicioContrato != null)
        {
            bool noFirmado =
                string.IsNullOrWhiteSpace(e.FirmoContrato) ||
                (e.FirmoContrato.ToLower() != "sí" && e.FirmoContrato.ToLower() != "si");

            if (noFirmado)
            {
                if (notifFirma == null)
                {
                    _context.Notificaciones.Add(new Notificacion
                    {
                        Titulo = "Contrato sin firmar",
                        Mensaje = $"{e.NombreCompleto} tiene fecha de contrato registrado pero no firmado",
                        Tipo = "ContratoFirma",
                        ReferenciaId = e.Id
                    });
                }
            }
            else
            {
                if (notifFirma != null)
                {
                    notifFirma.Activa = false;
                    notifFirma.FechaResolucion = DateTime.Now;
                }
            }
        }

        // 1️⃣ SIN CONTRATO
        if (e.FechaInicioContrato == null)
        {
            if (notificacionSinContrato == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Contrato no registrado",
                    Mensaje = $"{e.NombreCompleto} no tiene contrato con fecha de inicio registrada",
                    Tipo = "ContratoSinRegistrar",
                    ReferenciaId = e.Id
                });
            }
            continue; // si no hay contrato, no evaluamos vencimiento
        }
        else
        {
            if (notificacionSinContrato != null)
            {
                notificacionSinContrato.Activa = false;
                notificacionSinContrato.FechaResolucion = DateTime.Now;
            }
        }

        // 2️⃣ CONTRATO POR VENCER
        var fechaVencimiento = e.FechaInicioContrato.Value.AddYears(1);

        bool porVencer = fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;

        if (porVencer)
        {
            if (notificacionContrato == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Contrato próximo a vencer",
                    Mensaje = $"{e.NombreCompleto} vence el {fechaVencimiento:dd/MM/yyyy}",
                    Tipo = "Contrato",
                    ReferenciaId = e.Id
                });
            }
        }
        else
        {
            if (notificacionContrato != null)
            {
                notificacionContrato.Activa = false;
                notificacionContrato.FechaResolucion = DateTime.Now;
            }
        }
    }
}

private async Task VerificarExamenIngresoInterno(List<Empleado>? empleados = null)
{
    var hoy = DateTime.Today;
    var fechaLimite = hoy.AddDays(30);

    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => n.Tipo == "ExamenIngreso" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
    {
        var notificacionExistente = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id);

        if (e.examenIngreso == null)
        {
            if (notificacionExistente == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Examen de ingreso pendiente",
                    Mensaje = $"{e.NombreCompleto} no tiene fecha de examen de ingreso registrado",
                    Tipo = "ExamenIngreso",
                    ReferenciaId = e.Id
                });
            }
        }
        else
        {
            var fechaVencimiento = e.examenIngreso.Value.AddYears(1);

            bool porVencer = fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;

            if (porVencer)
            {
                if (notificacionExistente == null)
                {
                    _context.Notificaciones.Add(new Notificacion
                    {
                        Titulo = "Examen próximo a vencer",
                        Mensaje = $"{e.NombreCompleto} vence el {fechaVencimiento:dd/MM/yyyy}",
                        Tipo = "ExamenIngreso",
                        ReferenciaId = e.Id
                    });
                }
            }
            else
            {
                if (notificacionExistente != null)
                {
                    notificacionExistente.Activa = false;
                    notificacionExistente.FechaResolucion = DateTime.Now;
                }
            }
        }
    }
}

private async Task VerificarDotacionInterno(List<Empleado>? empleados = null)
{
    var hoy = DateTime.Today;
    var fechaLimite = hoy.AddDays(30);

    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => n.Tipo == "Dotacion" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
    {
        var notificacionExistente = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id);

        // 🔥 Última entrega activa de dotación
        var ultimaFechaEntrega = await _context.EntregasEpp
            .Where(x => x.EmpleadoId == e.Id && x.Estado == "Activo")
            .MaxAsync(x => (DateTime?)x.FechaEntrega);

        // 1️⃣ Sin dotación activa
        if (ultimaFechaEntrega == null)
        {
            if (notificacionExistente == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Dotación no registrada",
                    Mensaje = $"{e.NombreCompleto} no tiene dotación activa",
                    Tipo = "Dotacion",
                    ReferenciaId = e.Id
                });
            }
            continue;
        }

        var fechaVencimiento = ultimaFechaEntrega.Value.AddMonths(4);

        bool porVencer = fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;
        bool vencida = fechaVencimiento < hoy;

        if (porVencer || vencida)
        {
            if (notificacionExistente == null)
            {
                string mensaje = vencida
                    ? $"{e.NombreCompleto} tiene dotación vencida (venció el {fechaVencimiento:dd/MM/yyyy})"
                    : $"{e.NombreCompleto} vence el {fechaVencimiento:dd/MM/yyyy}";

                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Dotación próxima a vencer",
                    Mensaje = mensaje,
                    Tipo = "Dotacion",
                    ReferenciaId = e.Id
                });
            }
        }
        else
        {
            if (notificacionExistente != null)
            {
                notificacionExistente.Activa = false;
                notificacionExistente.FechaResolucion = DateTime.Now;
            }
        }
    }
}
private async Task VerificarAlturasInterno(List<Empleado>? empleados = null)
{
    var hoy = DateTime.Today;
    var fechaLimite = hoy.AddDays(60);

    if (empleados == null)
    {
        empleados = await _context.Empleado
            .Where(e => e.Estado != null && e.Estado.Trim().ToLower() == "activo")
            .ToListAsync();
    }

    var notificacionesActivas = await _context.Notificaciones
        .Where(n => n.Tipo == "Alturas" && n.Activa)
        .ToListAsync();

    foreach (var e in empleados)
    {
        if (e.AptitudEnAltura == null) continue; // ⚠️ Evitamos null

        var notificacionExistente = notificacionesActivas
            .FirstOrDefault(n => n.ReferenciaId == e.Id);

        var fechaVencimiento = e.AptitudEnAltura.Value.AddMonths(18);

        bool porVencer = fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;

        if (porVencer)
        {
            if (notificacionExistente == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    Titulo = "Curso de alturas próximo a vencer",
                    Mensaje = $"{e.NombreCompleto} vence el {fechaVencimiento:dd/MM/yyyy}",
                    Tipo = "Alturas",
                    ReferenciaId = e.Id
                });
            }
        }
        else
        {
            if (notificacionExistente != null)
            {
                notificacionExistente.Activa = false;
                notificacionExistente.FechaResolucion = DateTime.Now;
            }
        }
    }
}

}