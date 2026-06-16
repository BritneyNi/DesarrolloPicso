public class PruebaHermeticidadCreateDto
{
    public string? Proyecto { get; set; }
    public int? ObraId { get; set; }
    public string? ObraNombre { get; set; }
    public string? Cliente { get; set; }
    public string? TipoPrueba { get; set; }
    public string? Descripcion { get; set; }
    public string? DescripcionPrueba { get; set; }
    public DateTime InicioPrueba { get; set; }
    public IFormFile? ImagenInicio { get; set; }
    public decimal? PresionInicial { get; set; }
}
