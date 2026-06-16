using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class refactorPermisoAlturas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpleadoId",
                table: "ResponsablePlanEmergencia",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmpleadoId",
                table: "PersonalAutorizado",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResponsablePlanEmergencia_EmpleadoId",
                table: "ResponsablePlanEmergencia",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalAutorizado_EmpleadoId",
                table: "PersonalAutorizado",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PermisosTrabajoAlturas_AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "AyudanteSeguridadEmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PermisosTrabajoAlturas_CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "CoordinadorTrabajoAlturasEmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PermisosTrabajoAlturas_PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "PersonaAutorizaEmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_PermisosTrabajoAlturas_ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "ResponsablePermisoEmpleadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "AyudanteSeguridadEmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "CoordinadorTrabajoAlturasEmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "PersonaAutorizaEmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas",
                column: "ResponsablePermisoEmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalAutorizado_Empleado_EmpleadoId",
                table: "PersonalAutorizado",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ResponsablePlanEmergencia_Empleado_EmpleadoId",
                table: "ResponsablePlanEmergencia",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropForeignKey(
                name: "FK_PermisosTrabajoAlturas_Empleado_ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonalAutorizado_Empleado_EmpleadoId",
                table: "PersonalAutorizado");

            migrationBuilder.DropForeignKey(
                name: "FK_ResponsablePlanEmergencia_Empleado_EmpleadoId",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropIndex(
                name: "IX_ResponsablePlanEmergencia_EmpleadoId",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropIndex(
                name: "IX_PersonalAutorizado_EmpleadoId",
                table: "PersonalAutorizado");

            migrationBuilder.DropIndex(
                name: "IX_PermisosTrabajoAlturas_AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropIndex(
                name: "IX_PermisosTrabajoAlturas_CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropIndex(
                name: "IX_PermisosTrabajoAlturas_PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropIndex(
                name: "IX_PermisosTrabajoAlturas_ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "EmpleadoId",
                table: "ResponsablePlanEmergencia");

            migrationBuilder.DropColumn(
                name: "EmpleadoId",
                table: "PersonalAutorizado");

            migrationBuilder.DropColumn(
                name: "AyudanteSeguridadEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "CoordinadorTrabajoAlturasEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "PersonaAutorizaEmpleadoId",
                table: "PermisosTrabajoAlturas");

            migrationBuilder.DropColumn(
                name: "ResponsablePermisoEmpleadoId",
                table: "PermisosTrabajoAlturas");
        }
    }
}
