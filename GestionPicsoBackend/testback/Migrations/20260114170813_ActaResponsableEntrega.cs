using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class ActaResponsableEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_EmpleadoId",
                table: "ActasEntregaEpp");

            migrationBuilder.AddColumn<int>(
                name: "ResponsableId",
                table: "ActasEntregaEpp",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActasEntregaEpp_ResponsableId",
                table: "ActasEntregaEpp",
                column: "ResponsableId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_EmpleadoId",
                table: "ActasEntregaEpp",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_ResponsableId",
                table: "ActasEntregaEpp",
                column: "ResponsableId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_EmpleadoId",
                table: "ActasEntregaEpp");

            migrationBuilder.DropForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_ResponsableId",
                table: "ActasEntregaEpp");

            migrationBuilder.DropIndex(
                name: "IX_ActasEntregaEpp_ResponsableId",
                table: "ActasEntregaEpp");

            migrationBuilder.DropColumn(
                name: "ResponsableId",
                table: "ActasEntregaEpp");

            migrationBuilder.AddForeignKey(
                name: "FK_ActasEntregaEpp_Empleado_EmpleadoId",
                table: "ActasEntregaEpp",
                column: "EmpleadoId",
                principalTable: "Empleado",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
