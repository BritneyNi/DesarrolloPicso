public class AvanceSemanal
{
    public int Id { get; set; }

    public int ActividadGanttId { get; set; }

    public ActividadGantt? ActividadGantt { get; set; }

    public int NumeroSemana { get; set; }

    public DateTime FechaInicioSemana { get; set; }

    public DateTime FechaFinSemana { get; set; }

    public decimal CantidadEjecutada { get; set; }

    public string? Comentario { get; set; }
}