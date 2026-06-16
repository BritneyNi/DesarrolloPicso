namespace testback.Dtos
{
    public class InventarioGeneralPdfDto
{
    public int ElementoEppId { get; set; }

    public string ElementoNombre { get; set; } = "";
    public string ElementoTipo { get; set; } = "";
    public int TotalCantidad { get; set; }
    public int TotalDisponible { get; set; }
    public string Estado { get; set; } = "";
}


}