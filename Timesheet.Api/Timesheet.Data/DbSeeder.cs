using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Timesheet.Data.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;

namespace Timesheet.Data;

public class DbSeeder
{
    public static async Task SeedData(WebApplication app)
    {


        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DbSeeder>>();

        try
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

            if (userManager.Users.Any() == false)
            {
                var user = new User
                {
                    Username = "admin",
                    Name = "Admin",
                    Surname = "Admin",
                    Email = "admin@gmail.com",
                    RoleId = 1,
                    CompanyId = 1,
                    PasswordHash = [],
                    PasswordSalt = [],
                    Role = null!,
                    Company = null!,
                    TsWeeks = new List<TsWeek>(),
                    UserProjects = new List<UserProject>(),
                    PasswordResetTokens = new List<PasswordResetToken>(),
                    TokenInfos = new List<TokenInfo>()
                };

                var result = await userManager.CreateAsync(user, "Admin123!");
                if (result.Succeeded == false)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    logger.LogError(
                        $"Failed to create admin user. Errors: {string.Join(", ", errors)}"
                    );
                    return;
                }

                var addToRoleResult = await userManager.AddToRoleAsync(user, "Admin");
                if (addToRoleResult.Succeeded == false)
                {
                    var errors = addToRoleResult.Errors.Select(e => e.Description);
                    logger.LogError(
                        $"Failed to add admin user to Admin role. Errors: {string.Join(", ", errors)}"
                    );
                    return;
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }

}
