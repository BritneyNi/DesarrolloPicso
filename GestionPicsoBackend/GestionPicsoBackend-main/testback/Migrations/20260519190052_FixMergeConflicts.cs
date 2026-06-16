using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class FixMergeConflicts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropColumn(
            //    name: "Nota",
            //    table: "PruebasHermeticidad");

            migrationBuilder.AlterColumn<string>(
                name: "TipoPrueba",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<int>(
                name: "ObraId",
                table: "PruebasHermeticidad",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");
            migrationBuilder.AlterColumn<string>(
                name: "Cliente",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TipoPrueba",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
            migrationBuilder.AlterColumn<int>(
                name: "ObraId",
                table: "PruebasHermeticidad",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
            migrationBuilder.AlterColumn<string>(
                name: "Cliente",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
            migrationBuilder.AddColumn<string>(
                name: "Nota",
                table: "PruebasHermeticidad",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}