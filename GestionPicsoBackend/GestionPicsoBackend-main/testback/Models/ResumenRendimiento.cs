public class ActividadResumen
{
    public string Actividad { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public decimal TotalCantidad { get; set; }
    public decimal TotalDias { get; set; }
}

public class ResumenRendimiento
{
    public int IdEmpleado { get; set; }
    public string NombreEmpleado { get; set; } = string.Empty;
    public int? ObraId { get; set; }
    public List<ActividadResumen> Actividades { get; set; } = new();
}