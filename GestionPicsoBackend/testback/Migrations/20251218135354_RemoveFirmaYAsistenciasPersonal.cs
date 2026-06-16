using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFirmaYAsistenciasPersonal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PersonalAutorizado_AsistenciasSemana_AsistenciasSemanaId",
                table: "PersonalAutorizado");

            migrationBuilder.DropTable(
                name: "AsistenciasSemana");

            migrationBuilder.DropIndex(
                name: "IX_PersonalAutorizado_AsistenciasSemanaId",
                table: "PersonalAutorizado");

            migrationBuilder.DropColumn(
                name: "AsistenciasSemanaId",
                table: "PersonalAutorizado");

            migrationBuilder.DropColumn(
                name: "Firma",
                table: "PersonalAutorizado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AsistenciasSemanaId",
                table: "PersonalAutorizado",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Firma",
                table: "PersonalAutorizado",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AsistenciasSemana",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Domingo = table.Column<bool>(type: "bit", nullable: false),
                    Jueves = table.Column<bool>(type: "bit", nullable: false),
                    Lunes = table.Column<bool>(type: "bit", nullable: false),
                    Martes = table.Column<bool>(type: "bit", nullable: false),
                    Miercoles = table.Column<bool>(type: "bit", nullable: false),
                    Sabado = table.Column<bool>(type: "bit", nullable: false),
                    Viernes = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsistenciasSemana", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PersonalAutorizado_AsistenciasSemanaId",
                table: "PersonalAutorizado",
                column: "AsistenciasSemanaId");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalAutorizado_AsistenciasSemana_AsistenciasSemanaId",
                table: "PersonalAutorizado",
                column: "AsistenciasSemanaId",
                principalTable: "AsistenciasSemana",
                principalColumn: "Id");
        }
    }
}
