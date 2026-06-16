using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class Obra
    {
        public int Id { get; set; }
        [Required]
        public required string NombreObra { get; set; }
        [Required]
        public required string ClienteObra { get; set; }
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El costo debe ser mayor a 0")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoObra { get; set; }
        [Required]
        public required string Estado { get; set; } = "Activo";
        [Required]
        public required string Ciudad { get; set; }
        [Required]
        public required string Ubicacion { get; set; }
        public int? ResponsableId { get; set; }
        public string? ResponsableSecundario { get; set; }
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El área debe ser mayor a 0")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal tamano { get; set; }
        public DateTime FechaCreacion = DateTime.Now;
        [Required]
        public DateTime FechaInicio { get; set; }
        [Required]
        public DateTime FechaFin { get; set; }
        public string? TurnoObra { get; set; } = "Diurno";
    }
}