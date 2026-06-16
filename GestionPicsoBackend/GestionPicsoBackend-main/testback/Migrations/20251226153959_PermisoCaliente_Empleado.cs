using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class PermisoCaliente_Empleado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpleadoId",
                table: "PermisosEnCaliente",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PermisosEnCaliente_EmpleadoId",
                table: "PermisosEnCaliente",
                column: "EmpleadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente");

            migrationBuilder.DropIndex(
                name: "IX_PermisosEnCaliente_EmpleadoId",
                table: "PermisosEnCaliente");

            migrationBuilder.DropColumn(
                name: "EmpleadoId",
                table: "PermisosEnCaliente");
        }
    }
}
