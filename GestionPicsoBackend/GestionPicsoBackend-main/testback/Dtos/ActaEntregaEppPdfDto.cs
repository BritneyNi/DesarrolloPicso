namespace testback.Dtos
{
    public class ActaEntregaEppPdfDto
    {
        public int ActaId { get; set; }

        // 🔹 EMPLEADO
        public string Empleado { get; set; } = string.Empty;
        public string EmpleadoCedula { get; set; } = string.Empty;
        public string EmpleadoCargo { get; set; } = string.Empty;
        // 🔹 RESPONSABLE
        public string Responsable { get; set; } = string.Empty;
        public string ResponsableCedula { get; set; } = string.Empty;
        public string ResponsableCargo { get; set; } = string.Empty;

        public string QuienRecibe { get; set; } = string.Empty;
        public string LugarEntrega { get; set; } = string.Empty;

        public DateTime FechaEntrega { get; set; }
        public string Observaciones { get; set; } = string.Empty;

        public string? FirmaEmpleadoUrl { get; set; }
        public string? FirmaResponsableUrl { get; set; }

        public List<ActaEntregaElementoPdfDto> Elementos { get; set; } = new();
    }

    public class ActaEntregaElementoPdfDto
    {
        public string Elemento { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string Talla { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
}
