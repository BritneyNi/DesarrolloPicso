using testback.Dtos;
public class HistorialActaDto
{
    public int ActaId { get; set; }
    public int EmpleadoId { get; set; }
    public string EmpleadoNombre { get; set; } = "";
    public string ResponsableNombre { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public string QuienRecibe { get; set; } = "";
    public string LugarEntrega { get; set; } = "";

    public string Observaciones { get; set; } = "";
    public string FirmaEmpleadoUrl { get; set; } = "";
    public string FirmaResponsableUrl { get; set; } = "";
    public List<HistorialElementoDto> Elementos { get; set; } = new();
}

public class HistorialElementoDto
{
    public int Id { get; set; } 
    public string Nombre { get; set; } = "";
    public string Talla { get; set; } = "";
    public int Cantidad { get; set; }
    public string Estado { get; set; } = "";
    public string? Observaciones { get; set; }
    public List<string> Evidencias { get; set; } = new();
    public DateTime FechaEntrega { get; set; }
}
