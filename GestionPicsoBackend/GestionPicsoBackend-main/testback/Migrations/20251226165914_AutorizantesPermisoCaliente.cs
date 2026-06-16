using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AutorizantesPermisoCaliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PermisoEnCalienteAutorizante",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PermisoEnCalienteId = table.Column<int>(type: "int", nullable: false),
                    EmpleadoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermisoEnCalienteAutorizante", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PermisoEnCalienteAutorizante_Empleado_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleado",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PermisoEnCalienteAutorizante_PermisosEnCaliente_PermisoEnCalienteId",
                        column: x => x.PermisoEnCalienteId,
                        principalTable: "PermisosEnCaliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PermisoEnCalienteAutorizante_EmpleadoId",
                table: "PermisoEnCalienteAutorizante",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PermisoEnCalienteAutorizante_PermisoEnCalienteId",
                table: "PermisoEnCalienteAutorizante",
                column: "PermisoEnCalienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PermisoEnCalienteAutorizante");
        }
    }
}
