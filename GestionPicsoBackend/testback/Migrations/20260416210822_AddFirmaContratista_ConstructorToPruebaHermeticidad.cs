using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AddFirmaContratista_ConstructorToPruebaHermeticidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirmaConstructor",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmaContratista",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirmaConstructor",
                table: "PruebasHermeticidad");

            migrationBuilder.DropColumn(
                name: "FirmaContratista",
                table: "PruebasHermeticidad");
        }
    }
}
