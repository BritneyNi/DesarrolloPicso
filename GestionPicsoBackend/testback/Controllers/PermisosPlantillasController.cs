using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/plantillas-permisos")]
public class PermisosPlantillasController : ControllerBase
{
    private readonly PlantillasPermisosService _service;

    public PermisosPlantillasController(PlantillasPermisosService service)
    {
        _service = service;
    }

   
[HttpGet("{tipo}")]
public async Task<IActionResult> ObtenerPlantilla(string tipo)
{
    try
    {
        string archivo = tipo.ToLower() switch
        {
            "alturas" => "plantilla_alturas.xlsx",
            "caliente" => "plantilla_caliente.xlsx",
            _ => null
        };

        if (archivo == null)
            return BadRequest("Tipo de permiso inválido");

        var stream = await _service.ObtenerPlantillaStreamAsync(archivo);

        stream.Position = 0;

        return File(
            stream,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            archivo
        );
    }
    catch (Exception ex)
    {
        Console.WriteLine("ERROR EN PLANTILLA: " + ex);
        return StatusCode(500, ex.ToString());
    }
}





}
