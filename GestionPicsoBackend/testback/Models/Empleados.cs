using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Empleado
{
    public int Id { get; set; }
    
    [Required(ErrorMessage = "La cédula es obligatoria")]   
    [RegularExpression(@"^[a-zA-Z0-9]+$", ErrorMessage = "La cédula solo puede contener letras y números")]
    public string Cedula { get; set; }
    public string NombreCompleto { get; set; }
    [Required]
    public string Cargo { get; set; }
    [Required]
    public string Obra { get; set; }
    public string? Responsable { get; set; }
    public string? ResponsableSecundario { get; set; }
    public bool PuedeSerResponsableEnvio { get; set; } = false;
    public bool PuedeSerResponsableEntrega { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? Salario { get; set; }
    public string? Bono { get; set; }
    [Required]
    public string Estado { get; set; } = "Activo";
    public string? Telefono { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public long? TelefonoEmergencia { get; set; }
    public DateTime? AptitudEnAltura { get; set; }
    public string? AptitudArchivo { get; set; }
    public DateTime? VencimientoAptitudAlturas { get; set; }
    public string? NumeroCuenta { get; set; }
    public string? Eps { get; set; }
    public string? ARL { get; set; }
    public string? FondoPension { get; set; }
    public string? CCF { get; set; }
    public DateTime? examenIngreso { get; set; }
    public DateTime? FechaInicioContrato { get; set; }
    public DateTime? FechaRetiro { get; set; }
    public string? TipoContrato { get; set; } = "Por definir";
    public string? FirmoContrato { get; set; } = "Pendiente";
    public string? Ubicacion { get; set; }
    public string? Direccion { get; set; }
    public string? Correo { get; set; }
    public string? PagoLiquidacion { get; set; }
    public DateTime? FechaReentrenamiento { get; set; }
    public string? Observacion { get; set; }
    public string? Turno { get; set; } = "Diurno";
}