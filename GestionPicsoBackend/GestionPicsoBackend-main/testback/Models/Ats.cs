using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class Ats
    {
        [Key]
        public int Id { get; set; }
        public DateOnly? FechaRegistro {get;set;}

        [MaxLength(500)]
        public string? Descripcion { get; set; }

        public string ResponsableAts {get;set;}

        public string Responsable {get;set;}

        [MaxLength(500)]
        public string? Peligros { get; set; }

        public string? Riesgo {get;set;}

        [MaxLength(500)]
        public string? QueSucede { get; set; }

        [MaxLength(500)]
        public string? QueHacer { get; set; }

        public string? FirmaSst { get; set; }

        public List<Actividad> Actividades { get; set; } = new List<Actividad>();

    }
}
