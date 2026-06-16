using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class ActaEntregaEpp_NullableFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActaEntregaEppId",
                table: "EntregasEpp",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ActasEntregaEpp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpleadoId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FirmaEmpleadoUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirmaResponsableUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActasEntregaEpp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActasEntregaEpp_Empleado_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleado",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EntregasEpp_ActaEntregaEppId",
                table: "EntregasEpp",
                column: "ActaEntregaEppId");

            migrationBuilder.CreateIndex(
                name: "IX_ActasEntregaEpp_EmpleadoId",
                table: "ActasEntregaEpp",
                column: "EmpleadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntregasEpp_ActasEntregaEpp_ActaEntregaEppId",
                table: "EntregasEpp",
                column: "ActaEntregaEppId",
                principalTable: "ActasEntregaEpp",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntregasEpp_ActasEntregaEpp_ActaEntregaEppId",
                table: "EntregasEpp");

            migrationBuilder.DropTable(
                name: "ActasEntregaEpp");

            migrationBuilder.DropIndex(
                name: "IX_EntregasEpp_ActaEntregaEppId",
                table: "EntregasEpp");

            migrationBuilder.DropColumn(
                name: "ActaEntregaEppId",
                table: "EntregasEpp");
        }
    }
}
