using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using testback.Data;
using testback.Services;
using QuestPDF.Infrastructure;
using testback.Services.Pdf;
using OfficeOpenXml;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


ExcelPackage.License.SetNonCommercialPersonal("Picso");

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers()
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Services.AddScoped<CalculadoraJornada>();
builder.Services.AddHttpClient<FestivoApiService>();
builder.Services.AddScoped<PlantillasPermisosService>();
builder.Services.AddScoped<ContratoEmpleadoPdfService>();
builder.Services.AddScoped<IAzureBlobService, AzureBlobService>();
builder.Services.AddScoped<InventarioGeneralPdfService>();
builder.Services.AddScoped<InventarioElementoPdfService>();
builder.Services.AddTransient<EntregaEppEmpleadoPdfService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<ActaEntregaEppPdfService>();
builder.Services.AddHostedService<NotificacionesScheduler>();
builder.Services.AddScoped<NotificacionesProcessor>();
builder.Services.AddScoped<PdfPruebaHermeticidadService>();
builder.Services.AddScoped<InformePdfService>();
builder.Services.AddScoped<EvaluacionAlturasPdfService>();
builder.Services.AddScoped<PermisoCalientePdfService>();
builder.Services.AddScoped<AtsPdfService>();
builder.Services.AddScoped<ExcelJornadaService>();
builder.Services.AddSingleton<NominaLockService>();
builder.Services.AddSingleton<BlobService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new BlobService(config);
});


string conn = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseSqlServer(conn)
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API Picso",
        Version = "v1",
        Description = "Documentación de la API Picso"
    });
});

var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendClients", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://lively-meadow-0b592d31e.6.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 524288000;
});
QuestPDF.Settings.License = LicenseType.Community;


var app = builder.Build();

// Aplicar migraciones automáticamente al iniciar
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

app.UseStaticFiles();
app.UseRouting();

app.UseCors("AllowFrontendClients");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Picso v1");
    c.RoutePrefix = string.Empty;
});

var docFolder = Path.Combine(builder.Environment.ContentRootPath, "Docspermisos");
if (Directory.Exists(docFolder))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(docFolder),
        RequestPath = "/Docspermisos"
    });
}

var evidenciaFolder = Path.Combine(builder.Environment.ContentRootPath, "Evidencias");
if (!Directory.Exists(evidenciaFolder))
{
    Directory.CreateDirectory(evidenciaFolder);
}

app.MapControllers();
app.Run();
