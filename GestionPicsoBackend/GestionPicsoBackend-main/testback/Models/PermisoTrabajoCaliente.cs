using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace testback.Models
{
    public class PermisoEnCaliente
    {
        public int Id { get; set; }

        public string? NombreEmpresa { get; set; }

        public string? Nit { get; set; }

        public string? Proyecto { get; set; }

        public DateOnly? FechaInicio { get; set; }

        public DateOnly? FechaCierre { get; set; }

        public string? NumeroPermiso { get; set; }

        public string? Herramientas { get; set; }

        public string? TipoTrabajo { get; set; }

        public string? DescripcionTarea { get; set; }

        public DateOnly FechaCreacion { get; set; } 

           // ===============================
        // RELACIÓN CON EMPLEADO
        // ===============================
        public int? EmpleadoId { get; set; }

        [ForeignKey(nameof(EmpleadoId))]
        public Empleado? Empleado { get; set; }

           // ===============================
        // ELEMENTOS DE PROTECCIÓN (JSON)
        // ===============================
        public string? ElementosProteccionJson { get; set; }

        [NotMapped]
        public List<string> ElementosProteccion
        {
            get => string.IsNullOrEmpty(ElementosProteccionJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(ElementosProteccionJson)!;

            set => ElementosProteccionJson =
                JsonSerializer.Serialize(value);
        }

        // ===============================
        // PELIGROS (JSON)
        // ===============================
        public string? PeligrosJson { get; set; }

        [NotMapped]
        public List<string> Peligros
        {
            get => string.IsNullOrEmpty(PeligrosJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(PeligrosJson)!;

            set => PeligrosJson = JsonSerializer.Serialize(value);
        }

        public ICollection<PermisoEnCalienteAutorizante> Autorizantes { get; set; }
        = new List<PermisoEnCalienteAutorizante>();

        public ICollection<PermisoEnCalientePersonal> Personal { get; set; }
        = new List<PermisoEnCalientePersonal>();

    }

    
}
namespace testback.Models
{
    public class PermisoEnCalienteAutorizante
    {
        public int Id { get; set; }

        public int PermisoEnCalienteId { get; set; }
        public PermisoEnCaliente? PermisoEnCaliente { get; set; } = null!;

        public int EmpleadoId { get; set; }
        public Empleado? Empleado { get; set; } = null!;

        public string? FirmaBase64 { get; set; }
    }
}
