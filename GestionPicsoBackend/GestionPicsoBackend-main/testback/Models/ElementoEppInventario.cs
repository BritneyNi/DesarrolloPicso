using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace testback.Models
{
    
    public class ElementoEppInventario
    {
        public int Id { get; set; }

        [Required]
        public int ElementoEppId { get; set; }

        [ForeignKey(nameof(ElementoEppId))]
        [JsonIgnore] // 👈🔥 ESTA ES LA CLAVE
        public ElementoEpp? ElementoEpp { get; set; }

        [Required]
        [MaxLength(20)]
        public string Talla { get; set; } = null!;

        
        [MaxLength(50)]
        public string? Tipo { get; set; } = null!;

        [Required]
        public DateTime FechaRecepcion { get; set; }

        [Required]
        public int CantidadTotal { get; set; }

        [Required]
        public int CantidadDisponible { get; set; }
        public int StockMinimo { get; set; } = 2;

        [MaxLength(500)]
        public string? EvidenciaUrl { get; set; }

    }
}
