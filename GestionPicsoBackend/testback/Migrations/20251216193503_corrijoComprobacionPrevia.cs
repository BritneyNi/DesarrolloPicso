using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class corrijoComprobacionPrevia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ComprobacionPrevia",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.CreateTable(
                name: "ComprobacionPrevia",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComprobacionPrevia");

            migrationBuilder.AddColumn<string>(
                name: "ComprobacionPrevia",
                table: "PermisosTrabajoAlturas",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
