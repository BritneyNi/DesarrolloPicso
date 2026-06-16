using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AddPrecedenteToActividadGantt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PrecedenteId",
                table: "ActividadesGantt",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActividadesGantt_PrecedenteId",
                table: "ActividadesGantt",
                column: "PrecedenteId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActividadesGantt_ActividadesGantt_PrecedenteId",
                table: "ActividadesGantt",
                column: "PrecedenteId",
                principalTable: "ActividadesGantt",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActividadesGantt_ActividadesGantt_PrecedenteId",
                table: "ActividadesGantt");

            migrationBuilder.DropIndex(
                name: "IX_ActividadesGantt_PrecedenteId",
                table: "ActividadesGantt");

            migrationBuilder.DropColumn(
                name: "PrecedenteId",
                table: "ActividadesGantt");
        }
    }
}
