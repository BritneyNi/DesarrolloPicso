using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace testback.Models
{
    [Table("solicitud_item")]
    public class SolicitudItem
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("solicitudId")]
        public int SolicitudId { get; set; }

        [ForeignKey("SolicitudId")]
        [JsonIgnore] 
        public Solicitud? Solicitud { get; set; }

        [Required]
        [Column("inventarioId")]
        public int InventarioId { get; set; }

        [ForeignKey("InventarioId")]
        [JsonIgnore]
        public Inventario? Inventario { get; set; }

        [Required]
        [Column("Cantidad")]
        public int Cantidad { get; set; }

        [Required]
        [Column("estado")]
        public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Pendiente;
    }
}
