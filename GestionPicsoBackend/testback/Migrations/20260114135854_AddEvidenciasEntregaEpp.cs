using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AddEvidenciasEntregaEpp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvidenciasActaEntregaEpp");

            migrationBuilder.CreateTable(
                name: "EvidenciasEntregaEpp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntregaEppId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActaEntregaEppId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenciasEntregaEpp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvidenciasEntregaEpp_ActasEntregaEpp_ActaEntregaEppId",
                        column: x => x.ActaEntregaEppId,
                        principalTable: "ActasEntregaEpp",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EvidenciasEntregaEpp_EntregasEpp_EntregaEppId",
                        column: x => x.EntregaEppId,
                        principalTable: "EntregasEpp",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciasEntregaEpp_ActaEntregaEppId",
                table: "EvidenciasEntregaEpp",
                column: "ActaEntregaEppId");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciasEntregaEpp_EntregaEppId",
                table: "EvidenciasEntregaEpp",
                column: "EntregaEppId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvidenciasEntregaEpp");

            migrationBuilder.CreateTable(
                name: "EvidenciasActaEntregaEpp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActaEntregaEppId = table.Column<int>(type: "int", nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenciasActaEntregaEpp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvidenciasActaEntregaEpp_ActasEntregaEpp_ActaEntregaEppId",
                        column: x => x.ActaEntregaEppId,
                        principalTable: "ActasEntregaEpp",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciasActaEntregaEpp_ActaEntregaEppId",
                table: "EvidenciasActaEntregaEpp",
                column: "ActaEntregaEppId");
        }
    }
}
