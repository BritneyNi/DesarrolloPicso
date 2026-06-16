using System.ComponentModel.DataAnnotations;


namespace testback.Dtos
{
    public class FirmarActaDto
    {
        public int ActaId { get; set; }
        public string? FirmaEmpleadoBase64 { get; set; }
        public string? FirmaResponsableBase64 { get; set; }
        public string Tipo { get; set; } = null!; 
        // "empleado" | "responsable"
    }
}
