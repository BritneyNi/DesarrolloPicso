using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class NavegationObrasToPruebaHermeticidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ObraId",
                table: "PruebasHermeticidad",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ObraNombre",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ObraId",
                table: "PruebasHermeticidad");

            migrationBuilder.DropColumn(
                name: "ObraNombre",
                table: "PruebasHermeticidad");
        }
    }
}
