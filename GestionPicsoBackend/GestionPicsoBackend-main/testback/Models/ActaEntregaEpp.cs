using System.ComponentModel.DataAnnotations;

namespace testback.Models
{
public class ActaEntregaEpp
{
    public int Id { get; set; }
    //Empleado que recibe
    public int EmpleadoId { get; set; }
    public Empleado Empleado { get; set; } = null!;

     // 👷 Responsable que entrega
    public int? ResponsableId { get; set; }
    public Empleado? Responsable { get; set; } = null!;

    public DateTime Fecha { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(150)]
    public string QuienRecibe { get; set; } = null!;

    [Required]
    [MaxLength(150)]
    public string LugarEntrega { get; set; } = null!;

    [Required]
    public string FirmaEmpleadoUrl { get; set; }
     [Required]
    public string FirmaResponsableUrl { get; set; }

    public string? Observaciones { get; set; }

    public ICollection<EvidenciaEntregaEpp> Evidencias { get; set; } = new List<EvidenciaEntregaEpp>();

    public ICollection<EntregaEpp> Entregas { get; set; } = new List<EntregaEpp>();
}
}