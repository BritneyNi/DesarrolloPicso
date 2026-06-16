namespace testback.Dtos
{
    public class ElementoEppDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public string? Descripcion { get; set; }
        public int? VidaUtilMeses { get; set; }
        public bool RequiereEvidencia { get; set; }
        public string Estado { get; set; } = null!;
        public string? EvidenciaPath { get; set; }

        // 🔥 STRING ISO UTC (la clave del problema)
        public string FechaCreacion { get; set; } = null!;


    }
}
