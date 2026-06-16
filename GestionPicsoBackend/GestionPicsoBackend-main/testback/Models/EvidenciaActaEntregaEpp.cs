namespace testback.Models
{
    public class EvidenciaEntregaEpp
    {
        public int Id { get; set; }

        // 🔑 relación correcta
        public int EntregaEppId { get; set; }
        public EntregaEpp EntregaEpp { get; set; } = null!;

        public string Url { get; set; } = null!;
        public string NombreArchivo { get; set; } = null!;
        public DateTime FechaSubida { get; set; } = DateTime.Now;
    }
}
