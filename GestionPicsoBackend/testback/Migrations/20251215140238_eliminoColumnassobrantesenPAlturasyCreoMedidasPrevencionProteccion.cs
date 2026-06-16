using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class eliminoColumnassobrantesenPAlturasyCreoMedidasPrevencionProteccion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Andamio",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "ElevadorPersonal",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "EnergiasPeligrosas",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "Escalera",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "EspacioConfinado",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "TrabajoAlturas",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.AddColumn<string>(
                name: "MedidaPrevencionProteccion",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MedidaPrevencionProteccion",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.AddColumn<bool>(
                name: "Andamio",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ElevadorPersonal",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnergiasPeligrosas",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Escalera",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EspacioConfinado",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TrabajoAlturas",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
