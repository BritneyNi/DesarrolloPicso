using testback.Models;
public class UsuarioNotificacion
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; }

    public int NotificacionId { get; set; }
    public Notificacion Notificacion { get; set; }

    public bool Leida { get; set; } = false;
    public DateTime? FechaLectura { get; set; }
}