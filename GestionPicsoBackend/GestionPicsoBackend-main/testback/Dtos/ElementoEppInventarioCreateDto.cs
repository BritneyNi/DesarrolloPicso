using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace testback.Dtos
{
    public class ElementoEppInventarioCreateDto
    {
        [Required]
        public int ElementoEppId { get; set; }

        [Required]
        public string Talla { get; set; } = null!;

        
        public string? Tipo { get; set; } = null!;

        [Required]
        public DateTime FechaRecepcion { get; set; }

        [Required]
        public int CantidadTotal { get; set; }

        // 👇 NUEVO
        public IFormFile? Evidencia { get; set; }
    }
}
