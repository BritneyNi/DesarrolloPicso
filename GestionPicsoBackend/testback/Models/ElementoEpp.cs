using System.ComponentModel.DataAnnotations;

namespace testback.Models
{
    public class ElementoEpp
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string Tipo { get; set; } = null!;

        [MaxLength(300)]
        public string? Descripcion { get; set; }

        // En meses (ej: 12, 24, 36)
        public int? VidaUtilMeses { get; set; }

        public bool RequiereEvidencia { get; set; } = false;
        
        [MaxLength(300)]
        public string? EvidenciaPath { get; set; }

        [Required]
        public string Estado { get; set; } = "Activo"; // Activo / Inactivo
        
        public DateTime FechaCreacion { get; set; }

    }
}
