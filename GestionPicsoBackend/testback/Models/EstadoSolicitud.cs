using System.Text.Json.Serialization;


[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EstadoSolicitud
{
    Pendiente,
    Aprobada,
    Rechazada,
    Comprado
}
