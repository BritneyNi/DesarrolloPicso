using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using testback.Data;
using testback.Models;
using Microsoft.IdentityModel.Tokens;

namespace testback.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public UsuariosController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req is null || string.IsNullOrEmpty(req.Cedula) || string.IsNullOrEmpty(req.Contrasena))
                return BadRequest("Datos incompletos.");

            var usr = await _context.Usuario
                .FirstOrDefaultAsync(u => u.Cedula == req.Cedula);

            if (usr == null || !BCrypt.Net.BCrypt.Verify(req.Contrasena, usr.ContrasenaHash))
                return Unauthorized("Credenciales inválidas.");

            // 🔐 Determinar si tiene acceso completo
            var puedeVerColumnasSensibles = usr.Cedula == "1037613064"  // Admin Gerencia
                  || usr.Cedula == "12345"       // Admin pruebas
                  || usr.Cedula == "1095923947" // SST_COOR
                  || usr.Cedula == "1000758567"; //RH
///
            // Generar JWT
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usr.Cedula),
                new Claim(ClaimTypes.Name, usr.NombreCompleto),
                new Claim("id", usr.Id.ToString()),
                new Claim(ClaimTypes.Role, usr.Rol),
                new Claim("obraId", usr.ObraId?.ToString() ?? ""),
                new Claim("verColumnasSensibles", puedeVerColumnasSensibles.ToString())
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var tok = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(tok) });
        }

        [HttpGet]
        public async Task<IActionResult> GetUsuarios()
        {
            var list = await _context.Usuario
                .OrderByDescending(u => u.Id)
                .AsNoTracking()
                .ToListAsync();

            // Proyección DTO
            var dto = list.Select(u => new
            {
                u.Id,
                u.Cedula,
                u.NombreCompleto,
                u.Cargo,
                u.Rol,
                u.Estado,
                u.ObraId
            });

            return Ok(dto);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUsuario(int id)
        {
            var u = await _context.Usuario
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (u == null) return NotFound();

            return Ok(new
            {
                u.Id,
                u.Cedula,
                u.NombreCompleto,
                u.Cargo,
                u.Rol,
                u.Estado,
                u.ObraId
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateUsuario([FromBody] Usuario u)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            u.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(u.ContrasenaHash);
            _context.Usuario.Add(u);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = u.Id }, new { u.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditUsuario(int id, [FromBody] Usuario u)
        {
            if (id != u.Id) return BadRequest("ID no coincide.");

            var orig = await _context.Usuario.FindAsync(id);
            if (orig == null) return NotFound();

            orig.Cedula = u.Cedula;
            orig.NombreCompleto = u.NombreCompleto;
            orig.Cargo = u.Cargo;
            orig.Rol = u.Rol;
            orig.Estado = u.Estado;

            if (!string.IsNullOrWhiteSpace(u.ContrasenaHash))
            {
                if (!BCrypt.Net.BCrypt.Verify(u.ContrasenaHash, orig.ContrasenaHash))
                {
                    orig.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(u.ContrasenaHash);
                }
            }

            var obraAnteriorId = orig.ObraId;
            orig.ObraId = u.ObraId;

            await _context.SaveChangesAsync();

            if (obraAnteriorId.HasValue && obraAnteriorId != u.ObraId)
            {
                var vieja = await _context.Obra.FindAsync(obraAnteriorId.Value);
                if (vieja != null)
                {
                    vieja.ResponsableId = null;
                    await _context.SaveChangesAsync();
                }
            }

            if (u.ObraId.HasValue)
            {
                var obraNueva = await _context.Obra.FindAsync(u.ObraId.Value);
                if (obraNueva != null)
                {
                    if (u.TipoResponsabilidad?.ToLower() == "secundario")
                    {
                        obraNueva.ResponsableSecundario = u.NombreCompleto;
                    }
                    else
                    {
                        obraNueva.ResponsableId = u.Id;
                    }

                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { orig.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var usr = await _context.Usuario.FindAsync(id);
            if (usr == null) return NotFound();

            usr.Estado = "Inactivo";
            await _context.SaveChangesAsync();
            return Ok(new { usr.Id });
        }

        public class LoginRequest
        {
            public string Cedula { get; set; }
            public string Contrasena { get; set; }
        }
    }
}
