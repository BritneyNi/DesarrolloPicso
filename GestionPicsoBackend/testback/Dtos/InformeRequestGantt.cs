public class InformeRequestGantt
{
    public int ObraId { get; set; }
    public int? ProyectoId { get; set; }
    public string? CurvaSImage { get; set; }
    // 🔥 evidencias elegidas para el PDF (máx 3)
    public List<int> EvidenciaIds { get; set; } = new();
}