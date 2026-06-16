using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class ProgramacionSemanal
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Empleado")]
        public int EmpleadoId { get; set; }
        public Empleado? Empleado { get; set; }

        [Required]
        [ForeignKey("Obra")]
        public int ObraId { get; set; }
        public Obra? Obra { get; set; }

        [Required]
        [ForeignKey("Residente")]
        public int ResidenteId { get; set; }
        public Usuario? Residente { get; set; }

        [Required]
        public DateTime FechaInicioSemana { get; set; }

        [Required]
        public DateTime FechaFinSemana { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}