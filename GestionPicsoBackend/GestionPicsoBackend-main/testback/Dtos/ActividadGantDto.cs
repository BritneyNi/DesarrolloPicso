public class ActividadDto
{
    public int Id { get; set; }

    public int ProyectoGanttId { get; set; }
    public string NombreProyecto { get; set; }

    public string NombreObra { get; set; }

    public string Nombre { get; set; }

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public string TipoUnidad { get; set; }

    public decimal CantidadTotal { get; set; }

    public decimal PesoProyecto { get; set; }

    public decimal TotalEjecutado { get; set; }

    public decimal PorcentajeAvance { get; set; }

    public List<AvanceDto> Avances { get; set; } = new();
}
public class AvanceDto
{
    public int NumeroSemana { get; set; }
    public decimal CantidadEjecutada { get; set; }
    public DateTime FechaInicioSemana { get; set; }
    public DateTime FechaFinSemana { get; set; }
}