using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
   public class Actividad
{
    [Key]
    public int Id { get; set; }

    // Relación correcta: Actividad pertenece a un ATS
    [ForeignKey("Ats")]
    public int? AtsId { get; set; }
    public Ats? Ats { get; set; }

    // Campos propios de Actividad
    [Required]
    [MaxLength(200)]
    public string EmpresaContratista { get; set; }

    [Required]
    [MaxLength(300)]
    public string TrabajoARealizar { get; set; }

    [MaxLength(800)]
    public string EquiposAUtilizar { get; set; }

    [MaxLength(800)]
    public string? EquiposEmergencia { get; set; }

    public DateTime? Fecha { get; set; }
    public DateTime? FechaFin { get; set; }

    public string? TipoPermiso { get; set; }

    public string? Observacion {get;set;}

    public string? FirmaEmpleado { get; set; }

    // Relación con empleado
    [ForeignKey("Empleado")]
    public int EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }
}

}
