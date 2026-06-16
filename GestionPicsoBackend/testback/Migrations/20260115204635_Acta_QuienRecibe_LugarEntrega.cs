using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class Acta_QuienRecibe_LugarEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LugarEntrega",
                table: "ActasEntregaEpp",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "QuienRecibe",
                table: "ActasEntregaEpp",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LugarEntrega",
                table: "ActasEntregaEpp");

            migrationBuilder.DropColumn(
                name: "QuienRecibe",
                table: "ActasEntregaEpp");
        }
    }
}
