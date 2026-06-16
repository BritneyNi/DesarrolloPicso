using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class añadoOtraColumnaComprobacionPrevia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComprobacionPrevia");

            migrationBuilder.CreateTable(
                name: "ComprobacionesPrevias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PermisoTrabajoAlturasId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EvaluacionJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComprobacionesPrevias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComprobacionesPrevias_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                        column: x => x.PermisoTrabajoAlturasId,
                        principalTable: "PermisosTrabajoAlturas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComprobacionesPrevias_PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias",
                column: "PermisoTrabajoAlturasId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComprobacionesPrevias");

            migrationBuilder.CreateTable(
                name: "ComprobacionPrevia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EvaluacionJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PermisoTrabajoAlturasId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComprobacionPrevia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComprobacionPrevia_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                        column: x => x.PermisoTrabajoAlturasId,
                        principalTable: "PermisosTrabajoAlturas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComprobacionPrevia_PermisoTrabajoAlturasId",
                table: "ComprobacionPrevia",
                column: "PermisoTrabajoAlturasId");
        }
    }
}
