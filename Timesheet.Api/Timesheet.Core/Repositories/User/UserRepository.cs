using System;
using Timesheet.Data;
using Timesheet.Data.Models;

namespace Timesheet.Core.Repositories;

public class UserRepository(AppDbContext context) : TRepository<User>(context)
{
    public User? GetByUsername(string username)
    {
        return _dbSet.FirstOrDefault(u => u.Username == username);
    }
}
