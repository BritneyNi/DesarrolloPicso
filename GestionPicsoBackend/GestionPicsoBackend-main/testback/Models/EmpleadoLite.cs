using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class EmpleadoLite
    {
        public int Id { get; set; }
        [Required]
        public string Cedula { get; set; }
        [Required]
        public string NombreCompleto { get; set; }
        [Required]
        public string Cargo { get; set; }
        [Required]
        public string Obra { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Salario { get; set; }

        public string? Bono { get; set; }

        [Required]
        public string Estado { get; set; } = "Activo";

        public DateTime? AptitudEnAltura { get; set; }
        public string? AptitudArchivo { get; set; }

        public DateTime? VencimientoAptitudAlturas { get; set; }

        public string? Telefono { get; set; }

        public DateTime? FechaNacimiento { get; set; }

        public long? TelefonoEmergencia { get; set; }
        public string? NumeroCuenta { get; set; }

        public string? FondoPension { get; set; }

        public string? CCF { get; set; }

        public string? Eps { get; set; }

        public string? ARL{ get; set; }
        public DateTime? examenIngreso{ get; set; }
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
    }
}