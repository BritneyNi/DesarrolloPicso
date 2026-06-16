using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testback.Models
{
  public class InventarioMovimiento
{
    public long Id { get; set; }

    public int? ElementoEppId { get; set; }

    // 🔑 FK PRIMERO
    public int? EntregaEppId { get; set; }

    [ForeignKey(nameof(EntregaEppId))]
    public EntregaEpp? EntregaEpp { get; set; }

    public string Talla { get; set; } = null!;
    public string? Tipo { get; set; }

    public string TipoMovimiento { get; set; } = null!;
    // Entrada | Salida | Devolucion | Ajuste

    public int Cantidad { get; set; }
    public DateTime Fecha { get; set; }

    public string? Observacion { get; set; }
    public string? EvidenciaUrl { get; set; }

    // 🔑 QUIÉN ENTREGÓ
    public int? UsuarioEntregaId { get; set; }
    public Empleado? UsuarioEntrega { get; set; }

    // 🔑 QUIÉN RECIBIÓ
    public int? EmpleadoRecibeId { get; set; }
    public Empleado? EmpleadoRecibe { get; set; }
}

}
