using System.ComponentModel.DataAnnotations;
namespace testback.Models
{
    public class PruebaHermeticidad
    {
        public int Id { get; set; }
        public int? ObraId { get; set; }
        public string? ObraNombre { get; set; }
        public string? Proyecto { get; set; }
        public string? Cliente { get; set; }
        public string? TipoPrueba { get; set; }
        public string? Descripcion { get; set; }
        public string? DescripcionPrueba { get; set; }
        public DateTime InicioPrueba { get; set; }
        public DateTime? FinPrueba { get; set; }
        public string? Cumple { get; set; }
        public string? FirmaContratista { get; set; }
        public string? FirmaConstructor { get; set; }
        public string? ImagenInicioUrl { get; set; }
        public string? ImagenFinalUrl { get; set; }
        public string Estado { get; set; } = "Iniciada";
        public decimal? PresionInicial { get; set; }
        public decimal? PresionFinal { get; set; }
    }
}
