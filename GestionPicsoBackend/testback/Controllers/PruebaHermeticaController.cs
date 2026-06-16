using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Models;
using testback.Data;
using testback.Services.Pdf;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class PruebaHermetricidadController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly BlobService _blobService;
        private readonly IConfiguration _config;
        private readonly IAzureBlobService _azureBlobService;
        private readonly PdfPruebaHermeticidadService _pdfService;
        

        public PruebaHermetricidadController(ApplicationDbContext context,BlobService blobService,
        IConfiguration config,IAzureBlobService azureBlobService,PdfPruebaHermeticidadService pdfService)
        {
            _context=context;
            _blobService=blobService;
            _config = config;
            _azureBlobService = azureBlobService;
            _pdfService = pdfService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] PruebaHermeticidadCreateDto dto)
        {
            string? imgInicioUrl = null;

            var container = _config["AzureBlobStorage:PruebasContainer"] 
            ?? throw new Exception("Container de pruebas no configurado");

            if (dto.ImagenInicio != null)
            {
                imgInicioUrl = await _blobService.UploadFileAsync(dto.ImagenInicio, container);
            }

           
            var entity = new PruebaHermeticidad
            {
                ObraId = dto.ObraId ?? 0, // 🔥
                ObraNombre = dto.ObraNombre,
                Proyecto = dto.Proyecto,
                Cliente = dto.Cliente,
                TipoPrueba = dto.TipoPrueba,
                Descripcion = dto.Descripcion,
                InicioPrueba = dto.InicioPrueba,
                PresionInicial = dto.PresionInicial,
                Estado = "Iniciada",
                ImagenInicioUrl = imgInicioUrl,
                DescripcionPrueba = dto.DescripcionPrueba,
            };

            _context.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(entity);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _context.PruebasHermeticidad.ToListAsync();
            return Ok(data);
        }

        [HttpPut("{id}/finalizar")]
        public async Task<IActionResult> Finalizar(int id, [FromForm] PruebaHermeticidadFinalizarDto dto)
        {
            var prueba = await _context.PruebasHermeticidad.FindAsync(id);

            if (prueba == null)
                return NotFound();

            string? imgFinalUrl = null;

            var container = _config["AzureBlobStorage:PruebasContainer"];

            if (dto.ImagenFinal != null)
            {
                imgFinalUrl = await _blobService.UploadFileAsync(dto.ImagenFinal, container);
            }

            prueba.FinPrueba = dto.FinPrueba;
            prueba.Cumple = dto.Cumple;
            prueba.ImagenFinalUrl = imgFinalUrl;
            prueba.Estado = "Finalizada";

            string? firmaContratistaUrl = null;
            string? firmaConstructorUrl = null;

            if (!string.IsNullOrEmpty(dto.FirmaContratista))
            {
                firmaContratistaUrl = await _azureBlobService.UploadBase64Async(
                    dto.FirmaContratista,
                    "firmas",
                    $"firma_contratista_{Guid.NewGuid()}.png"
                );
            }

            if (!string.IsNullOrEmpty(dto.FirmaConstructor))
            {
                firmaConstructorUrl = await _azureBlobService.UploadBase64Async(
                    dto.FirmaConstructor,
                    "firmas",
                    $"firma_constructor_{Guid.NewGuid()}.png"
                );
            }

            prueba.FirmaContratista = firmaContratistaUrl;
            prueba.FirmaConstructor = firmaConstructorUrl;
            prueba.PresionFinal = dto.PresionFinal;

            await _context.SaveChangesAsync();

            return Ok(prueba);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var prueba = await _context.PruebasHermeticidad.FindAsync(id);

            if (prueba == null)
                return NotFound("Prueba no encontrada");

            _context.PruebasHermeticidad.Remove(prueba);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Eliminada correctamente" });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var prueba = await _context.PruebasHermeticidad.FindAsync(id);

            if (prueba == null)
                return NotFound("Prueba no encontrada");

            return Ok(prueba);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PruebaHermeticidad dto)
        {
            var prueba = await _context.PruebasHermeticidad.FindAsync(id);

            if (prueba == null)
                return NotFound();

            prueba.Proyecto = dto.Proyecto;
            prueba.Cliente = dto.Cliente;
            prueba.Descripcion = dto.Descripcion;
            prueba.PresionInicial = dto.PresionInicial;

            // solo si ya está finalizada
            if (prueba.Estado == "Finalizada")
            {
                prueba.PresionFinal = dto.PresionFinal;
            prueba.Descripcion = dto.Descripcion;
                prueba.Cumple = dto.Cumple;
            }

            await _context.SaveChangesAsync();

            return Ok(prueba);
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GenerarPdf(int id)
        {
            var prueba = await _context.PruebasHermeticidad
                .FirstOrDefaultAsync(p => p.Id == id);

            if (prueba == null)
                return NotFound();

            var pdfBytes = _pdfService.GenerarPdf(prueba);

            return File(pdfBytes, "application/pdf", $"Prueba_{id}.pdf");
        }

        [HttpGet("por-obra/{obraId}")]
        public async Task<IActionResult> ObtenerPorObra(int obraId)
        {
            var data = await _context.PruebasHermeticidad
                .Where(p => p.ObraId == obraId)
                .ToListAsync();

            return Ok(data);
        }

    }
}

