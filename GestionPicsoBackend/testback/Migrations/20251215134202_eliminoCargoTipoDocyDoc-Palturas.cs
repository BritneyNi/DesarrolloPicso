using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class eliminoCargoTipoDocyDocPalturas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cargo",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropColumn(
                name: "NumeroDocumento",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropColumn(
                name: "TipoDocumento",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropColumn(
                name: "Cargo",
                table: "PersonalAutorizado");

            migrationBuilder.DropColumn(
                name: "NumeroDocumento",
                table: "PersonalAutorizado");

            migrationBuilder.DropColumn(
                name: "TipoDocumento",
                table: "PersonalAutorizado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cargo",
                table: "ResponsablePlanEmergencia",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroDocumento",
                table: "ResponsablePlanEmergencia",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoDocumento",
                table: "ResponsablePlanEmergencia",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cargo",
                table: "PersonalAutorizado",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroDocumento",
                table: "PersonalAutorizado",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoDocumento",
                table: "PersonalAutorizado",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
