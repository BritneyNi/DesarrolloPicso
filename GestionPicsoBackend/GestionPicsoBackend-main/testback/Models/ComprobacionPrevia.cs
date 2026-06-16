using System.Text.Json.Serialization;


namespace testback.Models
{
    public class ComprobacionPrevia
    {
        public int Id { get; set; }

       public int PersonalAutorizadoId { get; set; }

        [JsonIgnore]
        public PermisoTrabajoAlturas? PermisoTrabajoAlturas { get; set; }

        public string FirmaEmpleadoBase64 { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;

        public string EvaluacionJson { get; set; }
    }
}
