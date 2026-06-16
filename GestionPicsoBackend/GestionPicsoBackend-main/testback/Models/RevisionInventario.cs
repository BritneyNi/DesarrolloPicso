using testback.Models;

public class RevisionInventario
{
    public int Id { get; set; }
    public int InventarioId { get; set; }
    public Inventario? Inventario { get; set; }

    public DateTime FechaRevision { get; set; }
    public string Responsable { get; set; }

    public bool Encontrado { get; set; }
    public string EstadoFisico { get; set; }
    public string Observaciones { get; set; }
}
