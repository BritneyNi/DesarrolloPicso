namespace testback.Dtos
{
    public class ConfirmarEntregaEppDto
    {
        public int EmpleadoId { get; set; }
        public int ResponsableId { get; set; }
        public string? ResponsableEnvio { get; set; } = null!;
        public string LugarEntrega { get; set; } = null!;
        public string? Observaciones { get; set; }

        public List<ItemEntregaEppDto> Items { get; set; } = new();
    }

    public class ItemEntregaEppDto
    {
        public int ElementoEppInventarioId { get; set; }
        public int Cantidad { get; set; }
        public DateTime? FechaVencimiento { get; set; }
    }
}
