using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AgregarProgramacionSemanal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProgramacionSemanal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpleadoId = table.Column<int>(type: "int", nullable: false),
                    ObraId = table.Column<int>(type: "int", nullable: false),
                    ResidenteId = table.Column<int>(type: "int", nullable: false),
                    FechaInicioSemana = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFinSemana = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgramacionSemanal", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgramacionSemanal_Empleado_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleado",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProgramacionSemanal_Obra_ObraId",
                        column: x => x.ObraId,
                        principalTable: "Obra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProgramacionSemanal_Usuario_ResidenteId",
                        column: x => x.ResidenteId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProgramacionSemanal_EmpleadoId",
                table: "ProgramacionSemanal",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramacionSemanal_ObraId",
                table: "ProgramacionSemanal",
                column: "ObraId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramacionSemanal_ResidenteId",
                table: "ProgramacionSemanal",
                column: "ResidenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProgramacionSemanal");
        }
    }
}
