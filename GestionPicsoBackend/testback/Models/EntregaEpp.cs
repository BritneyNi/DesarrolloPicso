using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
    public class EntregaEpp
    {
        public int Id { get; set; }
        // 🔹 Relaciones
        public int EmpleadoId { get; set; }
        public Empleado? Empleado { get; set; }
        public int ElementoEppInventarioId { get; set; }
        public ElementoEppInventario? ElementoEppInventario { get; set; }
         public int CantidadEntregada { get; set; }
        // 🔹 Fechas
        public DateTime FechaEntrega { get; set; } = DateTime.Now;
        public DateTime? FechaVencimiento { get; set; }
        // 🔹 Estado de la entrega
        // Activo | Vencido | Devuelto | Perdido
        public string Estado { get; set; } = "Activo";
        // 🔹 Evidencia
        public string? EvidenciaUrl { get; set; }
        // 🔹 Observaciones
        public string? Observaciones { get; set; }
        public int? ActaEntregaEppId { get; set; }
        public ActaEntregaEpp? ActaEntregaEpp { get; set; } = null!;

        public ICollection<EvidenciaEntregaEpp> EvidenciasEntregaEpp { get; set; } 
        = new List<EvidenciaEntregaEpp>();
    }
}
