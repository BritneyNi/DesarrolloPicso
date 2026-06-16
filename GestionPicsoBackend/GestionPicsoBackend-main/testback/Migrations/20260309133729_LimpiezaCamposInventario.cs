using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class LimpiezaCamposInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmpresaMantenimiento",
                table: "Inventario");

            migrationBuilder.DropColumn(
                name: "FechaCompra",
                table: "Inventario");

            migrationBuilder.DropColumn(
                name: "FechaProximoMantenimiento",
                table: "Inventario");

            migrationBuilder.DropColumn(
                name: "FechaUltimoMantenimiento",
                table: "Inventario");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmpresaMantenimiento",
                table: "Inventario",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCompra",
                table: "Inventario",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaProximoMantenimiento",
                table: "Inventario",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimoMantenimiento",
                table: "Inventario",
                type: "datetime2",
                nullable: true);
        }
    }
}
