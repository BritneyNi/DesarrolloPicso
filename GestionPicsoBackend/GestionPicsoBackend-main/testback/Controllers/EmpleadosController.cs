using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using testback.Data;
using testback.Models;
using testback.Services.Pdf;


[ApiController]
[Route("api/[controller]")]
public class EmpleadosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ContratoEmpleadoPdfService _contratoPdfService;
    private readonly NotificacionesProcessor _processor;
    public EmpleadosController(ApplicationDbContext context, IConfiguration configuration, ContratoEmpleadoPdfService contratoPdfService, NotificacionesProcessor processor)
    {
        _context = context;
        _configuration = configuration;
        _contratoPdfService = contratoPdfService;
        _processor = processor;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmpleados(int page = 1, int pageSize = 10)
    {
        if (pageSize > 500) pageSize = 500;

        var empleadosLite = await _context.Empleado
            .OrderByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EmpleadoLite
            {
                Id = e.Id,
                Cedula = e.Cedula,
                NombreCompleto = e.NombreCompleto,
                Cargo = e.Cargo,
                Obra = e.Obra,
                Salario = e.Salario,
                Bono = e.Bono,
                Estado = e.Estado,
                Telefono = e.Telefono,
                FechaNacimiento = e.FechaNacimiento,
                AptitudEnAltura = e.AptitudEnAltura,
                VencimientoAptitudAlturas = e.VencimientoAptitudAlturas,
                NumeroCuenta = e.NumeroCuenta,
                FondoPension = e.FondoPension,
                CCF = e.CCF,
                Eps = e.Eps,
                ARL = e.ARL,
                examenIngreso = e.examenIngreso,
                FechaInicioContrato = e.FechaInicioContrato,
                FechaRetiro = e.FechaRetiro,
                TipoContrato = e.TipoContrato ?? "Por definir",
                FirmoContrato = e.FirmoContrato,
                Ubicacion = e.Ubicacion,
                Direccion = e.Direccion,
                PagoLiquidacion = e.PagoLiquidacion,
                Correo = e.Correo,
                TelefonoEmergencia = e.TelefonoEmergencia,
                FechaReentrenamiento = e.FechaReentrenamiento,
                Observacion = e.Observacion,
                AptitudArchivo = e.AptitudArchivo
            })
            .ToListAsync();

        return Ok(empleadosLite);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmpleado(int id)
    {
        var empleado = await _context.Empleado
            .Where(m => m.Id == id && m.Estado == "Activo")
            .Select(e => new EmpleadoLite
            {
                Id = e.Id,
                Cedula = e.Cedula,
                NombreCompleto = e.NombreCompleto,
                Cargo = e.Cargo,
                Obra = e.Obra,
                Salario = e.Salario,
                Bono = e.Bono,
                Estado = e.Estado,
                Telefono = e.Telefono,
                FechaNacimiento = e.FechaNacimiento,
                AptitudEnAltura = e.AptitudEnAltura,
                VencimientoAptitudAlturas = e.VencimientoAptitudAlturas,
                NumeroCuenta = e.NumeroCuenta,
                FondoPension = e.FondoPension,
                CCF = e.CCF,
                Eps = e.Eps,
                ARL = e.ARL,
                examenIngreso = e.examenIngreso,
                FechaInicioContrato = e.FechaInicioContrato,
                FechaRetiro = e.FechaRetiro,
                TipoContrato = e.TipoContrato ?? "Por definir",
                FirmoContrato = e.FirmoContrato,
                Ubicacion = e.Ubicacion,
                Direccion = e.Direccion,
                PagoLiquidacion = e.PagoLiquidacion,
                Correo = e.Correo,
                TelefonoEmergencia = e.TelefonoEmergencia,
                FechaReentrenamiento = e.FechaReentrenamiento,
                Observacion = e.Observacion,
                AptitudArchivo = e.AptitudArchivo
            })
            .FirstOrDefaultAsync();

        if (empleado == null)
            return NotFound();

        return Ok(empleado);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEmpleado([FromBody] Empleado empleado)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(empleado.NombreCompleto))
            return BadRequest("Nombre Completo es obligatorio");

        if (string.IsNullOrWhiteSpace(empleado.Cedula))
            return BadRequest("Cédula es obligatoria");

        if (!Regex.IsMatch(empleado.Cedula, @"^[a-zA-Z0-9]+$"))
            return BadRequest("Cédula solo puede contener letras y números, sin espacios ni símbolos.");

        if (string.IsNullOrWhiteSpace(empleado.Cargo))
            return BadRequest("Cargo es obligatorio");

        if (string.IsNullOrWhiteSpace(empleado.Obra))
            return BadRequest("Obra es obligatoria");

        if (empleado.Salario.HasValue && empleado.Salario <= 0)
            return BadRequest("Si se especifica el salario, debe ser mayor a 0");

        if (string.IsNullOrWhiteSpace(empleado.Estado))
            empleado.Estado = "Activo";

        if (!string.IsNullOrWhiteSpace(empleado.Telefono) &&
            !Regex.IsMatch(empleado.Telefono, @"^\d{7,15}$"))
            return BadRequest("Teléfono solo puede contener números (7 a 15 dígitos).");

        if (empleado.TelefonoEmergencia.HasValue &&
            !Regex.IsMatch(empleado.TelefonoEmergencia.Value.ToString(), @"^\d{7,15}$"))
            return BadRequest("Teléfono de emergencia solo puede contener números (7 a 15 dígitos).");

        var obra = await _context.Obra
            .FirstOrDefaultAsync(o => o.NombreObra == empleado.Obra && o.Estado == "Activo");

        if (obra == null)
            return BadRequest("La obra especificada no existe o está inactiva.");

        string responsableNombre = await _context.Usuario
            .Where(u => u.Id == obra.ResponsableId)
            .Select(u => u.NombreCompleto)
            .FirstOrDefaultAsync() ?? string.Empty;

        empleado.Responsable = !string.IsNullOrWhiteSpace(responsableNombre)
            ? responsableNombre
            : "No asignado";

        empleado.Responsable ??= "No asignado";
        empleado.ResponsableSecundario ??= "No asignado";
        empleado.FirmoContrato ??= "Pendiente";
        empleado.ARL ??= "SURA";
        empleado.CCF ??= "Comfama";

        try
        {
            _context.Empleado.Add(empleado);
            await _context.SaveChangesAsync();

            var asignacion = new AsignacionEmpleadoObra
            {
                EmpleadoId = empleado.Id,
                ObraId = obra.Id,
                FechaInicio = empleado.FechaInicioContrato ?? DateTime.Now,
                Activo = true
            };

            _context.AsignacionesEmpleadoObra.Add(asignacion);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }

        return CreatedAtAction(nameof(GetEmpleado), new { id = empleado.Id }, empleado);
    }

    [HttpPost("{id}/aptitudArchivo")]
    public async Task<IActionResult> SubirAptitudArchivo(int id, IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest("No se envió ningún archivo.");

        var empleado = await _context.Empleado.FindAsync(id);
        if (empleado == null)
            return NotFound("Empleado no encontrado.");

        var containerName = _configuration["AzureBlobStorage:ContainerName"];
        var connectionString = _configuration["AzureBlobStorage:ConnectionString"];
        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        var extension = Path.GetExtension(archivo.FileName);
        var nombreUnico = $"{Guid.NewGuid()}{extension}";
        var blobClient = containerClient.GetBlobClient(nombreUnico);

        await using var stream = archivo.OpenReadStream();
        await blobClient.UploadAsync(stream, new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = archivo.ContentType });

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = nombreUnico,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddHours(1)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri = blobClient.GenerateSasUri(sasBuilder);

        empleado.AptitudArchivo = nombreUnico;
        _context.Empleado.Update(empleado);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Archivo subido correctamente",
            blobName = nombreUnico,
            urlSas = sasUri.ToString()
        });
    }

    [HttpGet("{id}/aptitudArchivo")]
    public async Task<IActionResult> ObtenerAptitudArchivo(int id)
    {
        var empleado = await _context.Empleado.FindAsync(id);
        if (empleado == null || string.IsNullOrWhiteSpace(empleado.AptitudArchivo))
            return NotFound("El empleado no tiene archivo guardado.");

        var containerName = _configuration["AzureBlobStorage:ContainerName"];
        var connectionString = _configuration["AzureBlobStorage:ConnectionString"];
        var blobServiceClient = new BlobServiceClient(connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(empleado.AptitudArchivo);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = empleado.AptitudArchivo,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddHours(1)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUrl = blobClient.GenerateSasUri(sasBuilder).ToString();

        return Ok(new { urlSas = sasUrl });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditEmpleado(int id, [FromBody] Empleado empleado)
    {
        if (id != empleado.Id) return BadRequest();
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(empleado.NombreCompleto))
            return BadRequest("NombreCompleto es obligatorio");

        if (string.IsNullOrWhiteSpace(empleado.Cedula))
            return BadRequest("Cédula es obligatoria");

        if (!Regex.IsMatch(empleado.Cedula, @"^[a-zA-Z0-9]+$"))
            return BadRequest("Cédula solo puede contener letras y números, sin espacios ni símbolos.");

        if (string.IsNullOrWhiteSpace(empleado.Cargo))
            return BadRequest("Cargo es obligatorio");

        if (string.IsNullOrWhiteSpace(empleado.Obra))
            return BadRequest("Obra es obligatoria");

        if (empleado.Salario.HasValue && empleado.Salario <= 0)
            return BadRequest("Si se especifica el salario, debe ser mayor a 0");

        if (!string.IsNullOrWhiteSpace(empleado.Telefono) &&
            !Regex.IsMatch(empleado.Telefono, @"^\d{7,15}$"))
            return BadRequest("Teléfono solo puede contener números (7 a 15 dígitos).");

        if (empleado.TelefonoEmergencia.HasValue &&
            !Regex.IsMatch(empleado.TelefonoEmergencia.Value.ToString(), @"^\d{7,15}$"))
            return BadRequest("Teléfono de emergencia solo puede contener números (7 a 15 dígitos).");

        try
        {
            var empleadoDb = await _context.Empleado.FindAsync(id);
            if (empleadoDb == null) return NotFound();

            var obraAnteriorNombre = empleadoDb.Obra;

            empleadoDb.NombreCompleto = empleado.NombreCompleto;
            empleadoDb.Cedula = empleado.Cedula;
            empleadoDb.Cargo = empleado.Cargo;
            empleadoDb.Obra = empleado.Obra;
            empleadoDb.Salario = empleado.Salario;
            empleadoDb.Telefono = empleado.Telefono;
            empleadoDb.FechaNacimiento = empleado.FechaNacimiento;
            empleadoDb.TelefonoEmergencia = empleado.TelefonoEmergencia;
            empleadoDb.Estado = string.IsNullOrWhiteSpace(empleado.Estado) ? "Activo" : empleado.Estado;
            empleadoDb.Ubicacion = empleado.Ubicacion;
            empleadoDb.VencimientoAptitudAlturas = empleado.VencimientoAptitudAlturas;
            empleadoDb.NumeroCuenta = empleado.NumeroCuenta;
            empleadoDb.FechaRetiro = empleado.FechaRetiro;
            empleadoDb.FechaInicioContrato = empleado.FechaInicioContrato;
            empleadoDb.Direccion = empleado.Direccion;
            empleadoDb.examenIngreso = empleado.examenIngreso;
            empleadoDb.FirmoContrato = empleado.FirmoContrato;
            empleadoDb.TipoContrato = empleado.TipoContrato;
            empleadoDb.Correo = empleado.Correo;
            empleadoDb.Eps = empleado.Eps;
            empleadoDb.FondoPension = empleado.FondoPension;
            empleadoDb.Observacion = empleado.Observacion;
            empleadoDb.Bono = empleado.Bono;
            empleadoDb.CCF = empleado.CCF;
            empleadoDb.PagoLiquidacion = empleado.PagoLiquidacion;

            if (!string.IsNullOrWhiteSpace(empleado.AptitudArchivo))
                empleadoDb.AptitudArchivo = empleado.AptitudArchivo;

            empleadoDb.AptitudEnAltura = empleado.AptitudEnAltura;
            empleadoDb.FechaReentrenamiento = empleado.FechaReentrenamiento;

            if (!string.IsNullOrWhiteSpace(empleado.Obra))
            {
                var obraSeleccionada = await _context.Obra
                    .FirstOrDefaultAsync(o => o.NombreObra == empleado.Obra && o.Estado == "Activo");

                empleadoDb.Responsable = obraSeleccionada != null
                    ? await _context.Usuario
                        .Where(u => u.Id == obraSeleccionada.ResponsableId)
                        .Select(u => u.NombreCompleto)
                        .FirstOrDefaultAsync() ?? "No asignado"
                    : "No asignado";
            }

            empleadoDb.Responsable ??= "No asignado";
            empleadoDb.ResponsableSecundario ??= "No asignado";
            empleadoDb.FirmoContrato ??= "Pendiente";
            empleadoDb.ARL ??= "SURA";
            empleadoDb.CCF ??= "Comfama";

            await _processor.VerificarEmpleado(empleadoDb.Id);

            if (obraAnteriorNombre != empleado.Obra)
            {
                var nuevaObra = await _context.Obra
                    .FirstOrDefaultAsync(o => o.NombreObra == empleado.Obra && o.Estado == "Activo");

                if (nuevaObra != null)
                {
                    var asignacionActiva = await _context.AsignacionesEmpleadoObra
                        .FirstOrDefaultAsync(a => a.EmpleadoId == empleadoDb.Id && a.Activo);

                    if (asignacionActiva != null)
                    {
                        asignacionActiva.FechaFin = DateTime.Now;
                        asignacionActiva.Activo = false;
                    }

                    var nuevaAsignacion = new AsignacionEmpleadoObra
                    {
                        EmpleadoId = empleadoDb.Id,
                        ObraId = nuevaObra.Id,
                        FechaInicio = DateTime.Now,
                        Activo = true
                    };

                    _context.AsignacionesEmpleadoObra.Add(nuevaAsignacion);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(empleadoDb);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EmpleadoExists(empleado.Id))
                return NotFound();
            else
                throw;
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpGet("inactivos")]
    public async Task<IActionResult> GetEmpleadosInactivos(int page = 1, int pageSize = 10)
    {
        if (pageSize > 500) pageSize = 500;

        var empleadosInactivos = await _context.Empleado
            .Where(e => e.Estado == "Inactivo")
            .OrderByDescending(e => e.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(empleadosInactivos);
    }

    [HttpGet("ubicaciones")]
    public async Task<ActionResult<IEnumerable<string>>> GetUbicaciones()
    {
        var ubicaciones = await _context.Empleado
            .Where(e => !string.IsNullOrEmpty(e.Ubicacion))
            .Select(e => (e.Ubicacion ?? "").Trim().ToLower())
            .Distinct()
            .ToListAsync();

        var ubicacionesNormalizadas = ubicaciones
            .Select(u => u.Length > 0 ? char.ToUpper(u[0]) + u.Substring(1) : u)
            .OrderBy(u => u)
            .ToList();

        return Ok(ubicacionesNormalizadas);
    }

    [HttpGet("obras")]
    public async Task<ActionResult<IEnumerable<string>>> GetObras()
    {
        var obras = await _context.Empleado
            .Where(e => !string.IsNullOrEmpty(e.Obra))
            .Select(e => e.Obra.Trim())
            .Distinct()
            .OrderBy(o => o)
            .ToListAsync();

        return Ok(obras);
    }

    [HttpGet("responsables-envio")]
    public async Task<IActionResult> GetResponsablesEnvio()
    {
        var responsables = await _context.Empleado
            .Where(e => e.Estado == "Activo" && e.PuedeSerResponsableEnvio)
            .OrderBy(e => e.NombreCompleto)
            .Select(e => new { e.Id, e.NombreCompleto })
            .ToListAsync();

        return Ok(responsables);
    }

    [HttpGet("responsables-entrega")]
    public async Task<IActionResult> GetResponsablesEntrega()
    {
        var data = await _context.Empleado
            .Where(e => e.Estado == "Activo" && e.PuedeSerResponsableEntrega)
            .Select(e => new { e.Id, e.NombreCompleto })
            .ToListAsync();

        return Ok(data);
    }

    private bool EmpleadoExists(int id)
    {
        return (_context.Empleado?.Any(e => e.Id == id)).GetValueOrDefault();
    }

    [HttpGet("{id}/contrato-pdf")]
    public async Task<IActionResult> GenerarContratoPdf(int id)
    {
        var empleado = await _context.Empleado.FindAsync(id);
        if (empleado == null)
            return NotFound("Empleado no encontrado");

        var pdfBytes = _contratoPdfService.GenerarContrato(empleado);

        return File(
            pdfBytes,
            "application/pdf",
            $"Contrato_{empleado.NombreCompleto.Replace(" ", "_")}.pdf"
        );
    }
    [HttpGet("exportar-excel")]
public async Task<IActionResult> ExportarExcel(
    [FromQuery] string? estado,
    [FromQuery] string? ubicacion,
    [FromQuery] string? tipoContrato,
    [FromQuery] string? firmoContrato,
    [FromQuery] string? columnas)
{
    var query = _context.Empleado.AsQueryable();

    if (!string.IsNullOrEmpty(estado) && estado != "Todos")
        query = query.Where(e => e.Estado == estado);
    if (!string.IsNullOrEmpty(ubicacion))
        query = query.Where(e => e.Ubicacion == ubicacion);
    if (!string.IsNullOrEmpty(tipoContrato))
        query = query.Where(e => e.TipoContrato == tipoContrato);
    if (!string.IsNullOrEmpty(firmoContrato))
        query = query.Where(e => e.FirmoContrato == firmoContrato);

    var empleados = await query.ToListAsync();
    var columnasSeleccionadas = columnas?.Split(',').ToHashSet() ?? new HashSet<string>();

    using var wb = new ClosedXML.Excel.XLWorkbook();
    var ws = wb.Worksheets.Add("Empleados");

    var headers = new List<string>();
    if (columnasSeleccionadas.Contains("Nombre")) headers.Add("Nombre");
    if (columnasSeleccionadas.Contains("Cédula")) headers.Add("Cédula");
    if (columnasSeleccionadas.Contains("Teléfono")) headers.Add("Teléfono");
    if (columnasSeleccionadas.Contains("Cargo")) headers.Add("Cargo");
    if (columnasSeleccionadas.Contains("Obra")) headers.Add("Obra");
    if (columnasSeleccionadas.Contains("Ubicación")) headers.Add("Ubicación");
    if (columnasSeleccionadas.Contains("Tipo Contrato")) headers.Add("Tipo Contrato");
    if (columnasSeleccionadas.Contains("Firmó Contrato")) headers.Add("Firmó Contrato");
    if (columnasSeleccionadas.Contains("Salario")) headers.Add("Salario");
    if (columnasSeleccionadas.Contains("Estado")) headers.Add("Estado");
    if (columnasSeleccionadas.Contains("EPS")) headers.Add("EPS");
    if (columnasSeleccionadas.Contains("AFP")) headers.Add("AFP");
    if (columnasSeleccionadas.Contains("Correo")) headers.Add("Correo");
    if (columnasSeleccionadas.Contains("Fecha Nacimiento")) headers.Add("Fecha Nacimiento");

    for (int i = 0; i < headers.Count; i++)
    {
        var cell = ws.Cell(1, i + 1);
        cell.Value = headers[i];
        cell.Style.Font.Bold = true;
        cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1565C0");
        cell.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
    }

    for (int r = 0; r < empleados.Count; r++)
    {
        var e = empleados[r];
        int col = 1;
        if (columnasSeleccionadas.Contains("Nombre")) ws.Cell(r + 2, col++).Value = e.NombreCompleto ?? "";
        if (columnasSeleccionadas.Contains("Cédula")) ws.Cell(r + 2, col++).Value = e.Cedula ?? "";
        if (columnasSeleccionadas.Contains("Teléfono")) ws.Cell(r + 2, col++).Value = e.Telefono ?? "";
        if (columnasSeleccionadas.Contains("Cargo")) ws.Cell(r + 2, col++).Value = e.Cargo ?? "";
        if (columnasSeleccionadas.Contains("Obra")) ws.Cell(r + 2, col++).Value = e.Obra ?? "";
        if (columnasSeleccionadas.Contains("Ubicación")) ws.Cell(r + 2, col++).Value = e.Ubicacion ?? "";
        if (columnasSeleccionadas.Contains("Tipo Contrato")) ws.Cell(r + 2, col++).Value = e.TipoContrato ?? "";
        if (columnasSeleccionadas.Contains("Firmó Contrato")) ws.Cell(r + 2, col++).Value = e.FirmoContrato ?? "";
        if (columnasSeleccionadas.Contains("Salario")) ws.Cell(r + 2, col++).Value = e.Salario;
        if (columnasSeleccionadas.Contains("Estado")) ws.Cell(r + 2, col++).Value = e.Estado ?? "";
        if (columnasSeleccionadas.Contains("EPS")) ws.Cell(r + 2, col++).Value = e.Eps ?? "";
        if (columnasSeleccionadas.Contains("AFP")) ws.Cell(r + 2, col++).Value = e.FondoPension ?? "";
        if (columnasSeleccionadas.Contains("Correo")) ws.Cell(r + 2, col++).Value = e.Correo ?? "";
        if (columnasSeleccionadas.Contains("Fecha Nacimiento")) ws.Cell(r + 2, col++).Value = e.FechaNacimiento?.ToString("dd/MM/yyyy") ?? "";
    }

    ws.Columns().AdjustToContents();

    using var stream = new MemoryStream();
    wb.SaveAs(stream);
    stream.Position = 0;

    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        $"Empleados_{DateTime.Now:yyyy-MM-dd}.xlsx");
}
}