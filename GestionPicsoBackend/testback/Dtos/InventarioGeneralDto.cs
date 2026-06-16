namespace testback.Dtos
{
    public class InventarioGeneralDetalleDto
    {
        public string Talla { get; set; }
        public string Tipo { get; set; }
        public int CantidadTotal { get; set; }
        public int CantidadDisponible { get; set; }
    }

    public class InventarioGeneralDto
    {
        public int ElementoId { get; set; }
        public string ElementoNombre { get; set; }
        public string ElementoTipo { get; set; }

        public int TotalCantidad { get; set; }
        public int TotalDisponible { get; set; }

        public List<InventarioGeneralDetalleDto> Detalle { get; set; } = new();
    }
}
