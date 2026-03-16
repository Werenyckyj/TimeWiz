using Timesheet.Core.Repositories;
using Timesheet.Data;
using Timesheet.Data.Models;

namespace Timesheet.Core;

public class UnitOfWork(AppDbContext _context) : IUnitOfWork
{
    public TRepository<Company> CompanyRepository { get; init; } = new TRepository<Company>(_context);
    public TRepository<PasswordResetToken> PasswordResetTokenRepository { get; init; } = new TRepository<PasswordResetToken>(_context);
    public TRepository<Project> ProjectRepository { get; init; } = new TRepository<Project>(_context);
    public TRepository<Role> RoleRepository { get; init; } = new TRepository<Role>(_context);
    public TRepository<TsApproval> TsApprovalRepository { get; init; } = new TRepository<TsApproval>(_context);
    public TRepository<TsEntry> TsEntryRepository { get; init; } = new TRepository<TsEntry>(_context);
    public TRepository<TsWeek> TsWeekRepository { get; init; } = new TRepository<TsWeek>(_context);
    public TRepository<User> UserRepository { get; init; } = new TRepository<User>(_context);
    public TRepository<UserProject> UserProjectepository { get; init; } = new TRepository<UserProject>(_context);

    public void SaveChanges()
    {
        _context.SaveChanges();
    }

    private bool _disposed = false;
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _context.Dispose();
            }
            _disposed = true;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
}
