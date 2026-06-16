using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class eliminocolumnasdeProteccionPersonalycreolanuevacolumnaProteccionPersonal_para_almacenaresainfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArnesCuerpoEntero",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "CascoBarboquejo",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "EslingaPosicionamiento",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "Gafas",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "GuantesProteccion",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "LineaVidaHorizontal",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "LineaVidaVertical",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "SenalizacionArea",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "SistemasAnclaje",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.AddColumn<string>(
                name: "ProteccionPersonal",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProteccionPersonal",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.AddColumn<bool>(
                name: "ArnesCuerpoEntero",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CascoBarboquejo",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EslingaPosicionamiento",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Gafas",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "GuantesProteccion",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LineaVidaHorizontal",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LineaVidaVertical",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SenalizacionArea",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SistemasAnclaje",
                table: "PermisosTrabajoAlturas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
