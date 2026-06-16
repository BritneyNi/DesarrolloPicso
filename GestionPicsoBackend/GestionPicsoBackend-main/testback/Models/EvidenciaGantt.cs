public class EvidenciaGantt
{
    public int Id { get; set; }

    public int ActividadGanttId { get; set; }   // ✅ actividadId
    public ActividadGantt Actividad { get; set; }

    public int? NumeroSemana { get; set; }      // ✅ numeroSemana (opcional)

    public string Url { get; set; } = string.Empty;  // ✅ url

    public string NombreArchivo { get; set; } = string.Empty; // ✅ nombreArchivo

    public DateTime FechaSubida { get; set; } = DateTime.UtcNow; // 🔥 bonus
}