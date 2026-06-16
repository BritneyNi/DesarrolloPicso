using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AñadoColumnasSeguridadAlturas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AyudanteSeguridad",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoordinadorTrabajoAlturas",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaAutoriza",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AyudanteSeguridad",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "CoordinadorTrabajoAlturas",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "PersonaAutoriza",
                table: "PermisosTrabajoAlturas");
        }
    }
}
