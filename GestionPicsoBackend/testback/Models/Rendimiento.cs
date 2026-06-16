using System.ComponentModel.DataAnnotations;

namespace testback.Models
{
    public class Rendimiento
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int IdEmpleado { get; set; }
        [Required]
        [MaxLength(200)]
        public string Actividad { get; set; } = string.Empty;
        [Required]
        public decimal Dias { get; set; }
        [Required]
        [MaxLength(50)]
        public string Unidad { get; set; } = string.Empty;
        [Required]
        public decimal Cantidad { get; set; }
        [Required]
        public DateTime Fecha { get; set; } = DateTime.UtcNow.Date;
        [MaxLength(1000)]
        public string Observaciones { get; set; } = string.Empty;
        public int? IdContratista { get; set; }
        [Required]
        public int ObraId { get; set; }
    }
}