using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class addeliminoHoraInicioyFinaldePermisoAltura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoraFinalizacion",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "HoraInicio",
                table: "PermisosTrabajoAlturas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HoraFinalizacion",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoraInicio",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
