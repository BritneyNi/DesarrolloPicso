public class EntregaEmpleadoActaPdfDto
{
    public int ActaId { get; set; }
    public DateTime FechaEntrega { get; set; }

    // 🔹 Datos del responsable
    public string ResponsableNombre { get; set; } = "";
    public string ResponsableCargo { get; set; } = "";
    public string ResponsableCedula { get; set; } = "";

    public string QuienRecibe { get; set; } = "";
    public string LugarEntrega { get; set; } = "";
    public List<EntregaEmpleadoElementoPdfDto> Elementos { get; set; } = new();

    // 🔹 Datos del empleado
    public string EmpleadoNombre { get; set; } = "";
    public string EmpleadoCargo { get; set; } = "";
    public string EmpleadoCedula { get; set; } = "";

    // 🔹 Firmas
    public string? FirmaEmpleadoUrl { get; set; }
    public string? FirmaResponsableUrl { get; set; }
}

public class EntregaEmpleadoElementoPdfDto
{
    public string Elemento { get; set; } = "";
    public string Tipo { get; set; } = "";
    public string Talla { get; set; } = "";
    public int Cantidad { get; set; }
    public string Estado { get; set; } = "";
    public DateTime FechaEntrega { get; set; }
}