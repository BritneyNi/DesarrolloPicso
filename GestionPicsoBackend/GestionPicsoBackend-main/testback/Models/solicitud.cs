using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace testback.Models
{
    public class Solicitud
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("solicitante")]
        public string Solicitante { get; set; } = string.Empty;

        [Required]
        [Column("obra")]
        public string Obra { get; set; } = string.Empty;

        [Required]
        [Column("estado")]
        public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Pendiente;

        [Required]
        [Column("fechaSolicitud")]
        public DateTime FechaSolicitud { get; set; }

        [Column("observaciones")]
        public string? Observaciones { get; set; }

        [InverseProperty("Solicitud")]
        public List<SolicitudItem> Items { get; set; } = new();
    }
}
