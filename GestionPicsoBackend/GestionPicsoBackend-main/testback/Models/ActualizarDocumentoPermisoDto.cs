using System.ComponentModel.DataAnnotations;

namespace testback.Models.Dtos
{
    public class ActualizarDocumentoPermisoDto
    {
        public int Id { get; set; }
        [Required]
        public string NombreEmpleado { get; set; } = null!;
        public string? Comentarios { get; set; }
        [Required]
        public DateTime FechaInicio { get; set; }
        [Required]
        public DateTime FechaFin { get; set; }
        public string NombreArchivo { get; set; } = "SinArchivo";
    }
}