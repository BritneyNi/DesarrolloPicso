using testback.Models;
public class ProyectoGantt
{
    public int Id { get; set; }

    public int ObraId { get; set; }
    public Obra? Obra { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public ICollection<ActividadGantt> Actividades { get; set; }
        = new List<ActividadGantt>();
}