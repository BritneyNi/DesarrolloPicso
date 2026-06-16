using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class PermisoEnCalienteEvaluaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PermisoEnCalienteEvaluacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PermisoEnCalientePersonalId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EvaluacionJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermisoEnCalienteEvaluacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PermisoEnCalienteEvaluacion_PermisosEnCalientePersonal_PermisoEnCalientePersonalId",
                        column: x => x.PermisoEnCalientePersonalId,
                        principalTable: "PermisosEnCalientePersonal",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PermisoEnCalienteEvaluacion_PermisoEnCalientePersonalId",
                table: "PermisoEnCalienteEvaluacion",
                column: "PermisoEnCalientePersonalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PermisoEnCalienteEvaluacion");
        }
    }
}
