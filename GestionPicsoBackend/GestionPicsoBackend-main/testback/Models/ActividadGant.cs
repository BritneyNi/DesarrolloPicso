public class ActividadGantt
{
    public int Id { get; set; }

    // 🔥 NUEVO
    public int ProyectoGanttId { get; set; }
    public ProyectoGantt? Proyecto { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public string TipoUnidad { get; set; } = string.Empty;

    public decimal CantidadTotal { get; set; }

    // ⭐⭐⭐ CLAVE DEL SISTEMA
    public decimal PesoProyecto { get; set; } // %

    public string CreadoPor { get; set; } = string.Empty;

    public ICollection<AvanceSemanal> Avances { get; set; }
        = new List<AvanceSemanal>();

    public int? PrecedenteId { get; set; }
    public ActividadGantt? Precedente { get; set; }
}