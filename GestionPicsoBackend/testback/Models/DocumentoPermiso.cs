using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    [Table("documentopermiso")]
    public class DocumentoPermiso
    {
        public int Id { get; set; }
        [Required]
        public required string NombreEmpleado { get; set; }
        public string? Comentarios { get; set; }
        // NUEVO: tipo de ausentismo (incapacidad, enfermedad_general, calamidad_familiar, sin_justificacion)
        public string? Tipo { get; set; }
        [Required]
        public required DateTime FechaInicio { get; set; }
        [Required]
        public required DateTime FechaFin { get; set; }
        public byte[]? Archivo { get; set; }
        public required string NombreArchivo { get; set; }
    }
}
