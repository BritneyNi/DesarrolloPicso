using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AddObraIdToActividadesGantt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ObraId",
                table: "ActividadesGantt",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ActividadesGantt_ObraId",
                table: "ActividadesGantt",
                column: "ObraId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActividadesGantt_Obra_ObraId",
                table: "ActividadesGantt",
                column: "ObraId",
                principalTable: "Obra",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActividadesGantt_Obra_ObraId",
                table: "ActividadesGantt");

            migrationBuilder.DropIndex(
                name: "IX_ActividadesGantt_ObraId",
                table: "ActividadesGantt");

            migrationBuilder.DropColumn(
                name: "ObraId",
                table: "ActividadesGantt");
        }
    }
}
