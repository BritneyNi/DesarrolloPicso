using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class PermisoTrabajoAlturas
    {
        public int Id { get; set; }

        // ====================
        // Campos existentes (texto)
        // ====================
        public string? AyudanteSeguridad { get; set; }
        public string? PersonaAutoriza { get; set; }
        public string? CoordinadorTrabajoAlturas { get; set; }
        public bool? TrabajoElectrico { get; set; } = false;
        public string? Observaciones { get; set; }

        public string? Fecha { get; set; }
        public string? HerramientaUtilizar { get; set; }
        public string? TipoTrabajoRealizar { get; set; }

        // ====================
        // Datos Generales
        // ====================
        public DateOnly? FechaInicio { get; set; }
        public DateOnly? FechaFinalizacion { get; set; }
        public string? LugarEjecucion { get; set; }
        public decimal? AlturaAproximada { get; set; }
        public string? ResponsablePermiso { get; set; }
        public string? DescripcionTarea { get; set; }
        public string? FirmaResponsableBase64 { get; set; }

        // ====================
        // 🔗 RELACIONES CON EMPLEADO
        // ====================

        public int? ResponsablePermisoEmpleadoId { get; set; }
        [ForeignKey(nameof(ResponsablePermisoEmpleadoId))]
        public Empleado? ResponsablePermisoEmpleado { get; set; }

        public int? AyudanteSeguridadEmpleadoId { get; set; }
        [ForeignKey(nameof(AyudanteSeguridadEmpleadoId))]
        public Empleado? AyudanteSeguridadEmpleado { get; set; }

        public int? PersonaAutorizaEmpleadoId { get; set; }
        [ForeignKey(nameof(PersonaAutorizaEmpleadoId))]
        public Empleado? PersonaAutorizaEmpleado { get; set; }

        public int? CoordinadorTrabajoAlturasEmpleadoId { get; set; }
        [ForeignKey(nameof(CoordinadorTrabajoAlturasEmpleadoId))]
        public Empleado? CoordinadorTrabajoAlturasEmpleado { get; set; }

        // ====================
        // Medidas Prevención
        // ====================
        public string? MedidaPrevencionProteccion { get; set; }
        public string? OtroAcceso { get; set; }

        // ====================
        // Elementos de Protección
        // ====================
        public string? ProteccionPersonal { get; set; }
        public string? OtrosElementos { get; set; }

        // ====================
        // Tablas repetitivas
        // ====================
        public List<ComprobacionPrevia>? ComprobacionesPrevias { get; set; }
        public List<PersonalAutorizado>? PersonalAutorizado { get; set; }
        public List<ResponsablePlanEmergencia>? ResponsablesPlanEmergencia { get; set; }
    }


   public class PersonalAutorizado
{
    public int Id { get; set; }
    public int PermisoTrabajoAlturasId { get; set; }

    // visible
    public string? Nombres { get; set; }

    // 🔗 FUTURO: relación con empleado
    public int? EmpleadoId { get; set; }
    [ForeignKey(nameof(EmpleadoId))]
    public Empleado? Empleado { get; set; }

    public string? Certificacion { get; set; }
    public bool ActivoSeguridadSocial { get; set; }
}



  public class ResponsablePlanEmergencia
{
    public int Id { get; set; }
    public int PermisoTrabajoAlturasId { get; set; }

    // visible
    public string? Nombres { get; set; }

    // 🔗 relación real
    public int? EmpleadoId { get; set; }
    [ForeignKey(nameof(EmpleadoId))]
    public Empleado? Empleado { get; set; }
}


}
