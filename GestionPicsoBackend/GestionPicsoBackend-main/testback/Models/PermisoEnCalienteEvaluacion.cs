using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    [Table("PermisoEnCalienteEvaluaciones")]
    public class PermisoEnCalienteEvaluacion
    {
        public int Id { get; set; }

        public int PermisoEnCalientePersonalId { get; set; }
        public PermisoEnCalientePersonal? Personal { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;

        public string EvaluacionJson { get; set; } = null!;
    }
}
