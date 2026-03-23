using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Timesheet.Data.Migrations
{
    /// <inheritdoc />
    public partial class AnotherApprovalfix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TsApprovalId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TsApprovalId",
                table: "Users",
                column: "TsApprovalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TsApprovals_TsApprovalId",
                table: "Users",
                column: "TsApprovalId",
                principalTable: "TsApprovals",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_TsApprovals_TsApprovalId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TsApprovalId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TsApprovalId",
                table: "Users");
        }
    }
}
