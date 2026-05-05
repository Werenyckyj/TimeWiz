using Timesheet.Data.Models;
using Timesheet.Core;
using Timesheet.Data.Enums;

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
                var role = unitOfWork.RoleRepository.GetById(1);
                if (role == null)
                {
                    role = new Role { Name = "Admin", Privilege = RoleTypes.Admin, Users = [] };
                    unitOfWork.RoleRepository.Add(role);
                    unitOfWork.SaveChanges();
                }

                var company = unitOfWork.CompanyRepository.GetById(1);
                if (company == null)
                {
                    company = new Company { Name = "Main Company", CIN = "12345678", Employees = [] };
                    unitOfWork.CompanyRepository.Add(company);
                    unitOfWork.SaveChanges();
                }

                var user = new User
                {
                    Username = "admin",
                    Name = "Admin",
                    Surname = "Admin",
                    Email = "admin@gmail.com",
                    RoleId = role.Id,
                    CompanyId = company.Id,
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
                    logger.LogError("Failed to create admin user.");
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
