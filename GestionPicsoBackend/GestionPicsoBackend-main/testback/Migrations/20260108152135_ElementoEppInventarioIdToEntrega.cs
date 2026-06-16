using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class ElementoEppInventarioIdToEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntregasEpp_ElementosEpp_ElementoEppId",
                table: "EntregasEpp");

            migrationBuilder.RenameColumn(
                name: "ElementoEppId",
                table: "EntregasEpp",
                newName: "ElementoEppInventarioId");

            migrationBuilder.RenameIndex(
                name: "IX_EntregasEpp_ElementoEppId",
                table: "EntregasEpp",
                newName: "IX_EntregasEpp_ElementoEppInventarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntregasEpp_ElementosEppInventario_ElementoEppInventarioId",
                table: "EntregasEpp",
                column: "ElementoEppInventarioId",
                principalTable: "ElementosEppInventario",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntregasEpp_ElementosEppInventario_ElementoEppInventarioId",
                table: "EntregasEpp");

            migrationBuilder.RenameColumn(
                name: "ElementoEppInventarioId",
                table: "EntregasEpp",
                newName: "ElementoEppId");

            migrationBuilder.RenameIndex(
                name: "IX_EntregasEpp_ElementoEppInventarioId",
                table: "EntregasEpp",
                newName: "IX_EntregasEpp_ElementoEppId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntregasEpp_ElementosEpp_ElementoEppId",
                table: "EntregasEpp",
                column: "ElementoEppId",
                principalTable: "ElementosEpp",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
