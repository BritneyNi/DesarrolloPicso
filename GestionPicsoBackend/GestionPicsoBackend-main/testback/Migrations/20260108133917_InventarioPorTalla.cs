using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class InventarioPorTalla : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ElementosEppInventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ElementoEppId = table.Column<int>(type: "int", nullable: false),
                    Talla = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CantidadTotal = table.Column<int>(type: "int", nullable: false),
                    CantidadDisponible = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElementosEppInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ElementosEppInventario_ElementosEpp_ElementoEppId",
                        column: x => x.ElementoEppId,
                        principalTable: "ElementosEpp",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ElementosEppInventario_ElementoEppId",
                table: "ElementosEppInventario",
                column: "ElementoEppId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ElementosEppInventario");
        }
    }
}
