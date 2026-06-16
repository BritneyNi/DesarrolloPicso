using testback.Models;
public class AsignacionEmpleadoObra
{
    public int Id { get; set; }

    public int EmpleadoId { get; set; }
    public Empleado Empleado { get; set; }

    public int ObraId { get; set; }
    public Obra Obra { get; set; }

    public DateTime FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; } // null = sigue activo

    public bool Activo { get; set; } = true;
}