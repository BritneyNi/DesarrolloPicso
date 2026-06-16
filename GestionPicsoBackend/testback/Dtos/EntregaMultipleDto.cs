public class EntregaMultipleDto
{
    public int EmpleadoId { get; set; }
    public List<EntregaItemDto> Items { get; set; } = new();
    public string? Observaciones { get; set; }
}
public class EntregaItemDto
{
    public int InventarioId { get; set; }
    public int Cantidad { get; set; }
}