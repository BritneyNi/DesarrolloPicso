using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class PermisoEnCalientePersonal
    {
        public int Id { get; set; }

        public int PermisoEnCalienteId { get; set; }
        public PermisoEnCaliente? PermisoEnCaliente { get; set; }

        public int EmpleadoId { get; set; }
        public Empleado? Empleado { get; set; }

        public string? FirmaBase64 { get; set; }  

        public string? EvaluacionJson { get; set; }

        [NotMapped]
        public bool Firmado => !string.IsNullOrEmpty(FirmaBase64);

        [NotMapped]
        public bool TieneEvaluacion => !string.IsNullOrEmpty(EvaluacionJson);

        public ICollection<PermisoEnCalienteEvaluacion> Evaluaciones { get; set; }
    = new List<PermisoEnCalienteEvaluacion>();

    }
}
