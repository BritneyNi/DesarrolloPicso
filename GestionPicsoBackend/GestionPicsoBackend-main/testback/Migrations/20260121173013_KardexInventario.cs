using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class KardexInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UsuarioId",
                table: "InventarioMovimientos",
                newName: "UsuarioEntregaId");

            migrationBuilder.AlterColumn<string>(
                name: "TipoMovimiento",
                table: "InventarioMovimientos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "InventarioMovimientos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Talla",
                table: "InventarioMovimientos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Observacion",
                table: "InventarioMovimientos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EvidenciaUrl",
                table: "InventarioMovimientos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ElementoEppId",
                table: "InventarioMovimientos",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "EmpleadoRecibeId",
                table: "InventarioMovimientos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EntregaEppId",
                table: "InventarioMovimientos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventarioMovimientos_EmpleadoRecibeId",
                table: "InventarioMovimientos",
                column: "EmpleadoRecibeId");

            migrationBuilder.CreateIndex(
                name: "IX_InventarioMovimientos_EntregaEppId",
                table: "InventarioMovimientos",
                column: "EntregaEppId");

            migrationBuilder.CreateIndex(
                name: "IX_InventarioMovimientos_UsuarioEntregaId",
                table: "InventarioMovimientos",
                column: "UsuarioEntregaId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventarioMovimientos_Empleado_EmpleadoRecibeId",
                table: "InventarioMovimientos",
                column: "EmpleadoRecibeId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_InventarioMovimientos_Empleado_UsuarioEntregaId",
                table: "InventarioMovimientos",
                column: "UsuarioEntregaId",
                principalTable: "Empleado",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_InventarioMovimientos_EntregasEpp_EntregaEppId",
                table: "InventarioMovimientos",
                column: "EntregaEppId",
                principalTable: "EntregasEpp",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventarioMovimientos_Empleado_EmpleadoRecibeId",
                table: "InventarioMovimientos");

            migrationBuilder.DropForeignKey(
                name: "FK_InventarioMovimientos_Empleado_UsuarioEntregaId",
                table: "InventarioMovimientos");

            migrationBuilder.DropForeignKey(
                name: "FK_InventarioMovimientos_EntregasEpp_EntregaEppId",
                table: "InventarioMovimientos");

            migrationBuilder.DropIndex(
                name: "IX_InventarioMovimientos_EmpleadoRecibeId",
                table: "InventarioMovimientos");

            migrationBuilder.DropIndex(
                name: "IX_InventarioMovimientos_EntregaEppId",
                table: "InventarioMovimientos");

            migrationBuilder.DropIndex(
                name: "IX_InventarioMovimientos_UsuarioEntregaId",
                table: "InventarioMovimientos");

            migrationBuilder.DropColumn(
                name: "EmpleadoRecibeId",
                table: "InventarioMovimientos");

            migrationBuilder.DropColumn(
                name: "EntregaEppId",
                table: "InventarioMovimientos");

            migrationBuilder.RenameColumn(
                name: "UsuarioEntregaId",
                table: "InventarioMovimientos",
                newName: "UsuarioId");

            migrationBuilder.AlterColumn<string>(
                name: "TipoMovimiento",
                table: "InventarioMovimientos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "InventarioMovimientos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Talla",
                table: "InventarioMovimientos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Observacion",
                table: "InventarioMovimientos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EvidenciaUrl",
                table: "InventarioMovimientos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ElementoEppId",
                table: "InventarioMovimientos",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
