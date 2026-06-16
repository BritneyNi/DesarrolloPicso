using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class ProyectoGantt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActividadesGantt_Obra_ObraId",
                table: "ActividadesGantt");

            migrationBuilder.RenameColumn(
                name: "ObraId",
                table: "ActividadesGantt",
                newName: "ProyectoGanttId");

            migrationBuilder.RenameIndex(
                name: "IX_ActividadesGantt_ObraId",
                table: "ActividadesGantt",
                newName: "IX_ActividadesGantt_ProyectoGanttId");

            migrationBuilder.AddColumn<decimal>(
                name: "PesoProyecto",
                table: "ActividadesGantt",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "ProyectosGantt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ObraId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProyectosGantt", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProyectosGantt_Obra_ObraId",
                        column: x => x.ObraId,
                        principalTable: "Obra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProyectosGantt_ObraId",
                table: "ProyectosGantt",
                column: "ObraId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActividadesGantt_ProyectosGantt_ProyectoGanttId",
                table: "ActividadesGantt",
                column: "ProyectoGanttId",
                principalTable: "ProyectosGantt",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActividadesGantt_ProyectosGantt_ProyectoGanttId",
                table: "ActividadesGantt");

            migrationBuilder.DropTable(
                name: "ProyectosGantt");

            migrationBuilder.DropColumn(
                name: "PesoProyecto",
                table: "ActividadesGantt");

            migrationBuilder.RenameColumn(
                name: "ProyectoGanttId",
                table: "ActividadesGantt",
                newName: "ObraId");

            migrationBuilder.RenameIndex(
                name: "IX_ActividadesGantt_ProyectoGanttId",
                table: "ActividadesGantt",
                newName: "IX_ActividadesGantt_ObraId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActividadesGantt_Obra_ObraId",
                table: "ActividadesGantt",
                column: "ObraId",
                principalTable: "Obra",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
