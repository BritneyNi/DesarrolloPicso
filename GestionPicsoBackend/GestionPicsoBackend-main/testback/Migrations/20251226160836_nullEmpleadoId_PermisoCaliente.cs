using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class nullEmpleadoId_PermisoCaliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente");

            migrationBuilder.AlterColumn<int>(
                name: "EmpleadoId",
                table: "PermisosEnCaliente",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente");

            migrationBuilder.AlterColumn<int>(
                name: "EmpleadoId",
                table: "PermisosEnCaliente",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosEnCaliente_Empleado_EmpleadoId",
                table: "PermisosEnCaliente",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
