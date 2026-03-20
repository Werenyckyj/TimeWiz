using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Timesheet.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordSalt",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldMaxLength: 128);

            migrationBuilder.CreateTable(
                name: "TokenInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefreshToken = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Expiration = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenInfos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenInfos_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TokenInfos_UserId",
                table: "TokenInfos",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TokenInfos");

            migrationBuilder.AlterColumn<byte[]>(
                name: "PasswordHash",
                table: "Users",
                type: "bytea",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128);

            migrationBuilder.AddColumn<byte[]>(
                name: "PasswordSalt",
                table: "Users",
                type: "bytea",
                maxLength: 128,
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
