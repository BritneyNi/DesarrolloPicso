using Microsoft.EntityFrameworkCore;
using testback.Models;

namespace testback.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Empleado> Empleado { get; set; }
        public DbSet<Obra> Obra { get; set; }
        public DbSet<Usuario> Usuario { get; set; }
        public DbSet<IngresosPersonal> IngresosPersonal { get; set; }
        public DbSet<SalidasPersonal> SalidasPersonal { get; set; }
        public DbSet<DocumentoPermiso> DocumentoPermisos { get; set; }
        public DbSet<Solicitud> Solicitud { get; set; }
        public DbSet<SolicitudItem> SolicitudItem { get; set; }
        public DbSet<Movimiento> Movimiento { get; set; }
        public DbSet<Inventario> Inventario { get; set; }
        public DbSet<InventarioInterno> InventarioInterno { get; set; }
        public DbSet<RevisionInventario> RevisionInventario { get; set; }
        public DbSet<Rendimiento> Rendimiento { get; set; }
        public DbSet<Contratista> Contratistas { get; set; }
        public DbSet<RegistroJornada> RegistroJornada { get; set; }
        public DbSet<Ats> Ats { get; set; }
        public DbSet<Actividad> Actividades { get; set; }
        public DbSet<ComprobacionPrevia> ComprobacionesPrevias { get; set; }
        public DbSet<PermisoTrabajoAlturas> PermisosTrabajoAlturas { get; set; }
        public DbSet<PersonalAutorizado> PersonalAutorizado { get; set; }
        public DbSet<ResponsablePlanEmergencia> ResponsablePlanEmergencia { get; set; }
        public DbSet<PermisoEnCaliente> PermisosEnCaliente { get; set; }
        public DbSet<PermisoEnCalienteAutorizante> PermisosEnCalienteAutorizantes { get; set; }
        public DbSet<PermisoEnCalientePersonal> PermisosEnCalientePersonal { get; set; }
        public DbSet<PermisoEnCalienteEvaluacion> PermisoEnCalienteEvaluaciones { get; set; }
        public DbSet<ElementoEpp> ElementosEpp { get; set; }
        public DbSet<EntregaEpp> EntregasEpp { get; set; }
        public DbSet<ElementoEppInventario> ElementosEppInventario { get; set; }
        public DbSet<ActaEntregaEpp> ActasEntregaEpp { get; set; }
        public DbSet<EvidenciaEntregaEpp> EvidenciasEntregaEpp { get; set; }
        public DbSet<InventarioMovimiento> InventarioMovimientos { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }
        public DbSet<UsuarioNotificacion> UsuarioNotificaciones { get; set; }
        public DbSet<AsignacionEmpleadoObra> AsignacionesEmpleadoObra { get; set; }
        public DbSet<ActividadGantt> ActividadesGantt { get; set; }
        public DbSet<AvanceSemanal> AvancesSemanales { get; set; }
        public DbSet<ProyectoGantt> ProyectosGantt { get; set; }
        public DbSet<PruebaHermeticidad> PruebasHermeticidad { get; set; }
        public DbSet<EvidenciaGantt> EvidenciasGantt { get; set; }
        public DbSet<ProgramacionSemanal> ProgramacionSemanal { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Solicitud>()
                .Property(s => s.Estado)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsUnicode(false);

            builder.Entity<Obra>()
              .HasOne<Usuario>()
              .WithMany()
              .HasForeignKey(o => o.ResponsableId)
              .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Empleado>()
                .Property(e => e.FirmoContrato)
                .HasMaxLength(20)
                .HasDefaultValue("Pendiente");

            builder.Entity<EntregaEpp>()
                .HasOne(e => e.ActaEntregaEpp)
                .WithMany(a => a.Entregas)
                .HasForeignKey(e => e.ActaEntregaEppId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ActaEntregaEpp>()
                .HasOne(a => a.Empleado)
                .WithMany()
                .HasForeignKey(a => a.EmpleadoId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ActaEntregaEpp>()
                .HasOne(a => a.Responsable)
                .WithMany()
                .HasForeignKey(a => a.ResponsableId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SolicitudItem>()
                .Property(s => s.Estado)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsUnicode(false);

            builder.Entity<AvanceSemanal>()
                .HasOne(a => a.ActividadGantt)
                .WithMany(a => a.Avances)
                .HasForeignKey(a => a.ActividadGanttId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AvanceSemanal>()
                .HasIndex(a => new { a.ActividadGanttId, a.NumeroSemana })
                .IsUnique();

            builder.Entity<ProyectoGantt>()
                .HasMany(p => p.Actividades)
                .WithOne(a => a.Proyecto)
                .HasForeignKey(a => a.ProyectoGanttId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProgramacionSemanal>()
                .HasOne(p => p.Empleado)
                .WithMany()
                .HasForeignKey(p => p.EmpleadoId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ProgramacionSemanal>()
                .HasOne(p => p.Obra)
                .WithMany()
                .HasForeignKey(p => p.ObraId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ProgramacionSemanal>()
                .HasOne(p => p.Residente)
                .WithMany()
                .HasForeignKey(p => p.ResidenteId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}