using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class PruebaHermeticidadInit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PruebasHermeticidad",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Proyecto = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Cliente = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoPrueba = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InicioPrueba = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinPrueba = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Cumple = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirmaCliente = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FirmaEntrega = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImagenInicioUrl = table.Column<string>(nullable: true),
                    ImagenFinalUrl = table.Column<string>(nullable: true),
                    Nota = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PresionInicial = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PresionFinal = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "Iniciada")
                },
                
                constraints: table =>
                {
                    table.PrimaryKey("PK_PruebasHermetricidad", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PruebasHermetricidad");
        }
    }
}
