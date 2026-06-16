namespace testback.Dtos
{
    public class InventarioElementoDetallePdfDto
{
    public string Talla { get; set; }
    public string Tipo { get; set; }
    public int CantidadTotal { get; set; }
    public int CantidadDisponible { get; set; }

    public int CantidadEntregada =>
        CantidadTotal - CantidadDisponible;
}
    
}