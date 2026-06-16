using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public class Movimiento
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int InventarioId { get; set; }

    [Required]
    public string CodigoHerramienta { get; set; } = string.Empty;

    [Required]
    public string NombreHerramienta { get; set; } = string.Empty;

    [Required]
    public string Responsable { get; set; } = string.Empty;

    public string? Obra { get; set; } = string.Empty;

    [Required]
    public DateTime FechaMovimiento { get; set; } = DateTime.UtcNow;

    [Required]
    public string TipoMovimiento { get; set; } = string.Empty;

    [Required]
    public string Estado { get; set; } = string.Empty;
    
    [Column("Cantidad")]
    [JsonPropertyName("cantidad")]
    public int Cantidad { get; set; }

    public string Comentario { get; set; } = string.Empty;
}
