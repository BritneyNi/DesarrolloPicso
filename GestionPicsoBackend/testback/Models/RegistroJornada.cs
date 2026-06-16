using System;

namespace testback.Models
{
    public class RegistroJornada
    {
        public int Id { get; set; }               
        public string NombreCompleto { get; set; } = string.Empty;
        public string Ubicacion { get; set; } = string.Empty;
        public string? Obra { get; set; }
        public DateTime Fecha { get; set; }
        public DateTime HoraEntrada { get; set; }
        public DateTime HoraSalida { get; set; }
        public double HorasTrabajadas { get; set; }
        public double HorasDiurnas { get; set; }
        public double HorasNocturnas { get; set; }
        public double HorasExtrasDiurnas { get; set; }
        public double HorasExtrasNocturnas { get; set; }
        public bool TrabajoDomingo { get; set; }
        public bool TrabajoFestivo { get; set; }
        public double HorasDominicales { get; set; }
        public double HorasRecargoNocturnoDominical { get; set; }
        public double HorasExtrasDominicales { get; set; }
    }
}