using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Timesheet.Data.Migrations
{
    /// <inheritdoc />
    public partial class ApprovalManagersManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TsApprovals_Users_UserId",
                table: "TsApprovals");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_TsApprovals_TsApprovalId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TsApprovalId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_TsApprovals_UserId",
                table: "TsApprovals");

            migrationBuilder.DropColumn(
                name: "TsApprovalId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "TsApprovals");

            migrationBuilder.CreateTable(
                name: "TsApprovalManagers",
                columns: table => new
                {
                    ManagersId = table.Column<int>(type: "integer", nullable: false),
                    TsApprovalsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TsApprovalManagers", x => new { x.ManagersId, x.TsApprovalsId });
                    table.ForeignKey(
                        name: "FK_TsApprovalManagers_TsApprovals_TsApprovalsId",
                        column: x => x.TsApprovalsId,
                        principalTable: "TsApprovals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TsApprovalManagers_Users_ManagersId",
                        column: x => x.ManagersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TsApprovalManagers_TsApprovalsId",
                table: "TsApprovalManagers",
                column: "TsApprovalsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TsApprovalManagers");

            migrationBuilder.AddColumn<int>(
                name: "TsApprovalId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "TsApprovals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TsApprovalId",
                table: "Users",
                column: "TsApprovalId");

            migrationBuilder.CreateIndex(
                name: "IX_TsApprovals_UserId",
                table: "TsApprovals",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TsApprovals_Users_UserId",
                table: "TsApprovals",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TsApprovals_TsApprovalId",
                table: "Users",
                column: "TsApprovalId",
                principalTable: "TsApprovals",
                principalColumn: "Id");
        }
    }
}
