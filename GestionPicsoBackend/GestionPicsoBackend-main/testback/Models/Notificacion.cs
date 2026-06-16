public class Notificacion
{
    public int Id { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string Mensaje { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty; // Contrato, Afiliacion, etc

    public int? ReferenciaId { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public bool Leida { get; set; } = false;

    // 🔥 NUEVO
    public bool Activa { get; set; } = true;

    public DateTime? FechaResolucion { get; set; }
}
