using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class addeliminoAptitudArchivosSasCodigoVersionDePermisoAlturas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AptitudArchivoSas",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "Codigo",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "PermisosTrabajoAlturas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AptitudArchivoSas",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Version",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
