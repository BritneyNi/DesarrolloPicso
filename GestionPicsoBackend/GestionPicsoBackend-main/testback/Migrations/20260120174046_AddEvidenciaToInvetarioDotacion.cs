using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace testback.Migrations
{
    /// <inheritdoc />
    public partial class AddEvidenciaToInvetarioDotacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenciaUrl",
                table: "ElementosEppInventario",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenciaUrl",
                table: "ElementosEppInventario");
        }
    }
}
