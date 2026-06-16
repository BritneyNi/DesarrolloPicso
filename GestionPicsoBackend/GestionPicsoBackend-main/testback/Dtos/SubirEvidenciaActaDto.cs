public class SubirEvidenciaEntregaDto
{
    public int EntregaEppId { get; set; }   // ✅ CLAVE
    public string ArchivoBase64 { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
}