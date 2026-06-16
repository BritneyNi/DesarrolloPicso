using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class nullPersonalAutoriza_PermisoCaliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisoEnCalienteAutorizante_Empleado_EmpleadoId",
                table: "PermisoEnCalienteAutorizante");

            migrationBuilder.DropForeignKey(
                name: "FK_PermisoEnCalienteAutorizante_PermisosEnCaliente_PermisoEnCalienteId",
                table: "PermisoEnCalienteAutorizante");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PermisoEnCalienteAutorizante",
                table: "PermisoEnCalienteAutorizante");

            migrationBuilder.RenameTable(
                name: "PermisoEnCalienteAutorizante",
                newName: "PermisosEnCalienteAutorizantes");

            migrationBuilder.RenameIndex(
                name: "IX_PermisoEnCalienteAutorizante_PermisoEnCalienteId",
                table: "PermisosEnCalienteAutorizantes",
                newName: "IX_PermisosEnCalienteAutorizantes_PermisoEnCalienteId");

            migrationBuilder.RenameIndex(
                name: "IX_PermisoEnCalienteAutorizante_EmpleadoId",
                table: "PermisosEnCalienteAutorizantes",
                newName: "IX_PermisosEnCalienteAutorizantes_EmpleadoId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PermisosEnCalienteAutorizantes",
                table: "PermisosEnCalienteAutorizantes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosEnCalienteAutorizantes_Empleado_EmpleadoId",
                table: "PermisosEnCalienteAutorizantes",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosEnCalienteAutorizantes_PermisosEnCaliente_PermisoEnCalienteId",
                table: "PermisosEnCalienteAutorizantes",
                column: "PermisoEnCalienteId",
                principalTable: "PermisosEnCaliente",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosEnCalienteAutorizantes_Empleado_EmpleadoId",
                table: "PermisosEnCalienteAutorizantes");

            migrationBuilder.DropForeignKey(
                name: "FK_PermisosEnCalienteAutorizantes_PermisosEnCaliente_PermisoEnCalienteId",
                table: "PermisosEnCalienteAutorizantes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PermisosEnCalienteAutorizantes",
                table: "PermisosEnCalienteAutorizantes");

            migrationBuilder.RenameTable(
                name: "PermisosEnCalienteAutorizantes",
                newName: "PermisoEnCalienteAutorizante");

            migrationBuilder.RenameIndex(
                name: "IX_PermisosEnCalienteAutorizantes_PermisoEnCalienteId",
                table: "PermisoEnCalienteAutorizante",
                newName: "IX_PermisoEnCalienteAutorizante_PermisoEnCalienteId");

            migrationBuilder.RenameIndex(
                name: "IX_PermisosEnCalienteAutorizantes_EmpleadoId",
                table: "PermisoEnCalienteAutorizante",
                newName: "IX_PermisoEnCalienteAutorizante_EmpleadoId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PermisoEnCalienteAutorizante",
                table: "PermisoEnCalienteAutorizante",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisoEnCalienteAutorizante_Empleado_EmpleadoId",
                table: "PermisoEnCalienteAutorizante",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PermisoEnCalienteAutorizante_PermisosEnCaliente_PermisoEnCalienteId",
                table: "PermisoEnCalienteAutorizante",
                column: "PermisoEnCalienteId",
                principalTable: "PermisosEnCaliente",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
