using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class CambioModuloNivelInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Garantia",
                table: "Inventario");

            migrationBuilder.RenameColumn(
                name: "Proveedor",
                table: "Inventario",
                newName: "Nivel");

            migrationBuilder.AddColumn<string>(
                name: "Modulo",
                table: "Inventario",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Modulo",
                table: "Inventario");

            migrationBuilder.RenameColumn(
                name: "Nivel",
                table: "Inventario",
                newName: "Proveedor");

            migrationBuilder.AddColumn<int>(
                name: "Garantia",
                table: "Inventario",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
