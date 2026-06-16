using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class InventarioInterno
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int InventarioId { get; set; }
        [ForeignKey("InventarioId")]
        public Inventario? Inventario { get; set; }
        [Required]
        public string Obra { get; set; } = string.Empty;
        [Required]
        public string ResponsableObra { get; set; } = string.Empty;
        public string Usando { get; set; } = string.Empty;
        [Required]
        public int CantidadAsignada { get; set; } = 0;
        public string Observaciones { get; set; } = string.Empty;
    }
}
