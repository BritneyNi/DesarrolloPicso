using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class SalidasPersonal
    {
        [Key]
        public int Id { get; set; }
        [ForeignKey("Empleado")]
        public int EmpleadoId { get; set; }
        public  DateTime FechaHoraSalida { get; set; }
        public string? Comentarios { get; set; }
    }
}
