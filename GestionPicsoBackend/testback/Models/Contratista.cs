using System.ComponentModel.DataAnnotations;

namespace testback.Models
{
    public class Contratista
    {
        public int Id { get; set; }
        [Required]
        public required string Nombre { get; set; }
        [Required]
        public required string Cedula { get; set; }
        [Required]
        public required string Telefono { get; set; }
        [Required]
        public int ObraId { get; set; }
    }
}
