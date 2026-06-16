namespace testback.Dtos
{
    public class ElementoEppCreateDto
{
    
    public string Nombre { get; set; } = null!;

    
    public string Tipo { get; set; } = null!;

    public string? Descripcion { get; set; }

    public int? VidaUtilMeses { get; set; }

    public bool RequiereEvidencia { get; set; }
}

}