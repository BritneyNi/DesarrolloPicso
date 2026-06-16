using testback.Data;
using testback.Models;

public class NotificacionesScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;

    public NotificacionesScheduler(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<NotificacionesProcessor>();
                await processor.EjecutarTodas();

                // Notificaciones de programación semanal
                await EnviarRecordatorioProgramacion(scope);
            }

            await Task.Delay(TimeSpan.FromMinutes(120), stoppingToken);
        }
    }

    private async Task EnviarRecordatorioProgramacion(IServiceScope scope)
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var zonaColombia = TimeZoneInfo.FindSystemTimeZoneById("America/Bogota");
        var ahoraColombia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zonaColombia);

        bool esViernes = ahoraColombia.DayOfWeek == DayOfWeek.Friday   && ahoraColombia.Hour >= 8;
        bool esSabado  = ahoraColombia.DayOfWeek == DayOfWeek.Saturday && ahoraColombia.Hour >= 18;
        bool esDomingo = ahoraColombia.DayOfWeek == DayOfWeek.Sunday   && ahoraColombia.Hour >= 6;

        if (!esViernes && !esSabado && !esDomingo) return;

        var responsables = context.Usuario
            .Where(u => u.Rol.ToLower() == "responsable" && u.Estado == "Activo")
            .ToList();

        if (!responsables.Any()) return;

        string mensaje = esDomingo
            ? "⚠️ ¡Urgente! No olvides programar los empleados de la próxima semana antes del lunes."
            : "📅 Recuerda programar los empleados de la próxima semana.";

        var yaEnviada = context.Notificaciones
            .Any(n => n.Tipo == "ProgramacionSemanal" &&
                      n.FechaCreacion.Date == DateTime.UtcNow.Date);

        if (yaEnviada) return;

        var notificacion = new Notificacion
        {
            Titulo = "Programación Semanal",
            Mensaje = mensaje,
            Tipo = "ProgramacionSemanal",
            FechaCreacion = DateTime.UtcNow,
            Activa = true
        };

        context.Notificaciones.Add(notificacion);

        try
        {
            await context.SaveChangesAsync();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            // Notificación duplicada — ignorar y salir
            return;
        }

        foreach (var responsable in responsables)
        {
            var usuarioNoti = new UsuarioNotificacion
            {
                UsuarioId = responsable.Id,
                NotificacionId = notificacion.Id,
                Leida = false
            };
            context.UsuarioNotificaciones.Add(usuarioNoti);
        }

        await context.SaveChangesAsync();
    }
}
