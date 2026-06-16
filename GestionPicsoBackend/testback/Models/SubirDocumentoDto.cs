using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace testback.Models.Dtos
{
    public class SubirDocumentoDto
    {
        [Required]
        public string NombreEmpleado { get; set; }
        public string? Comentarios { get; set; }
        // NUEVO: tipo de ausentismo
        public string? Tipo { get; set; }
        [Required]
        public DateTime FechaInicio { get; set; }
        [Required]
        public DateTime FechaFin { get; set; }
        public IFormFile? Archivo { get; set; }
    }
}
