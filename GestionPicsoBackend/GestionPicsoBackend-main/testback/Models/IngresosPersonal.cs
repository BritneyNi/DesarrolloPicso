using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class IngresosPersonal
    {
        [Key]
        public int Id { get; set; }
        [ForeignKey("Empleado")]
        public int EmpleadoId { get; set; }
        public DateTime FechaHoraEntrada { get; set; }
        public string? Comentarios { get; set; }
    }
}