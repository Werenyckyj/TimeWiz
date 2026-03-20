using System;
using Timesheet.Data;
using Timesheet.Data.Models;

namespace Timesheet.Core.Repositories;

public class TokenRepository(AppDbContext context) : TRepository<TokenInfo>(context)
{
    public TokenInfo? GetByUserId(int userId)
    {
        return _dbSet.FirstOrDefault(t => t.UserId == userId);
    }
}
