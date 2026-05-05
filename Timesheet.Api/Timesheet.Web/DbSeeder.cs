using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Timesheet.Data.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using Timesheet.Core;

namespace Timesheet.Web;

public class DbSeeder
{
    public static void SeedData(WebApplication app)
    {


        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DbSeeder>>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<UnitOfWork>();

        try
        {

            if (unitOfWork.UserRepository.Count() == 0)
            {
                var role = unitOfWork.RoleRepository.GetById(1)!;
                var company = unitOfWork.CompanyRepository.GetById(1)!;

                var user = new User
                {
                    Username = "admin",
                    Name = "Admin",
                    Surname = "Admin",
                    Email = "admin@gmail.com",
                    RoleId = 1,
                    CompanyId = 1,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = role,
                    Company = company,
                    TsWeeks = new List<TsWeek>(),
                    UserProjects = new List<UserProject>(),
                    PasswordResetTokens = new List<PasswordResetToken>(),
                    TokenInfos = new List<TokenInfo>(),
                    IsActive = true
                };

                var result = unitOfWork.UserRepository.Add(user);
                if (result == null)
                {
                    logger.LogError(
                        $"Failed to create admin user."
                    );
                    return;
                }

                var addToRoleResult = unitOfWork.UserRepository.Add(user);
                if (addToRoleResult == null)
                {
                    logger.LogError(
                        $"Failed to add admin user to Admin role."
                    );
                    return;
                }
                unitOfWork.SaveChanges();
                logger.LogInformation("Admin user created successfully.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }

}
