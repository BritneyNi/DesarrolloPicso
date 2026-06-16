using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class corrijocolumna : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ComprobacionesPrevias_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias");

            migrationBuilder.AlterColumn<int>(
                name: "PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "PersonalAutorizadoId",
                table: "ComprobacionesPrevias",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_ComprobacionesPrevias_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias",
                column: "PermisoTrabajoAlturasId",
                principalTable: "PermisosTrabajoAlturas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ComprobacionesPrevias_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias");

            migrationBuilder.DropColumn(
                name: "PersonalAutorizadoId",
                table: "ComprobacionesPrevias");

            migrationBuilder.AlterColumn<int>(
                name: "PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ComprobacionesPrevias_PermisosTrabajoAlturas_PermisoTrabajoAlturasId",
                table: "ComprobacionesPrevias",
                column: "PermisoTrabajoAlturasId",
                principalTable: "PermisosTrabajoAlturas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
