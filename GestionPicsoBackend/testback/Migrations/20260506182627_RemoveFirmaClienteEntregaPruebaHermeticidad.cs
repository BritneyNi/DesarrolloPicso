using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFirmaClienteEntregaPruebaHermeticidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirmaCliente",
                table: "PruebasHermeticidad");

            migrationBuilder.DropColumn(
                name: "FirmaEntrega",
                table: "PruebasHermeticidad");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirmaCliente",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmaEntrega",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
