using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class CrearTablaGantt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActividadesGantt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoUnidad = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CantidadTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadesGantt", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AvancesSemanales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActividadGanttId = table.Column<int>(type: "int", nullable: false),
                    NumeroSemana = table.Column<int>(type: "int", nullable: false),
                    FechaInicioSemana = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFinSemana = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CantidadEjecutada = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Comentario = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvancesSemanales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvancesSemanales_ActividadesGantt_ActividadGanttId",
                        column: x => x.ActividadGanttId,
                        principalTable: "ActividadesGantt",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvancesSemanales_ActividadGanttId_NumeroSemana",
                table: "AvancesSemanales",
                columns: new[] { "ActividadGanttId", "NumeroSemana" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvancesSemanales");

            migrationBuilder.DropTable(
                name: "ActividadesGantt");
        }
    }
}
