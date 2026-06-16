using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testback.Data;
using testback.Models;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContratistasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ContratistasController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var contratistas = await _context.Contratistas
                .AsNoTracking()
                .ToListAsync();

            return Ok(contratistas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var contratista = await _context.Contratistas.FindAsync(id);
            return contratista == null ? NotFound() : Ok(contratista);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Contratista contratista)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Contratistas.Add(contratista);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = contratista.Id }, contratista);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Contratista c)
        {
            if (id != c.Id) return BadRequest("ID no coincide.");

            var existing = await _context.Contratistas.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Nombre = c.Nombre;
            existing.Cedula = c.Cedula;
            existing.Telefono = c.Telefono;
            existing.ObraId = c.ObraId;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var c = await _context.Contratistas.FindAsync(id);
            if (c == null) return NotFound();

            _context.Contratistas.Remove(c);
            await _context.SaveChangesAsync();

            return Ok(new { c.Id });
        }
    }
}
