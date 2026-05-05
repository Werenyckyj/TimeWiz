using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Company> Companies { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<UserProject> UserProjects { get; set; }
    public DbSet<TsWeek> TsWeeks { get; set; }
    public DbSet<TsEntry> TsEntries { get; set; }
    public DbSet<TsApproval> TsApprovals { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<TokenInfo> TokenInfos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserProject>()
            .HasKey(up => new { up.UserId, up.ProjectId });

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin", Privilege = RoleTypes.Admin, Users = [] },
            new Role { Id = 2, Name = "Manager", Privilege = RoleTypes.Manager, Users = [] },
            new Role { Id = 3, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            new Role { Id = 4, Name = "Externist", Privilege = RoleTypes.Externist, Users = [] }
        );

        modelBuilder.Entity<Company>().HasData(
            new Company { Id = 1, Name = "IBM Česká republika, spol. s r.o.", CIN = "14890992", Employees = [] }
        );

        modelBuilder.Entity<TsApproval>()
            .HasMany(a => a.Managers)
            .WithMany(u => u.TsApprovals)
            .UsingEntity(j => j.ToTable("TsApprovalManagers"));
    }
}
