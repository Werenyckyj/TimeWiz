using System;
using Microsoft.EntityFrameworkCore;
using Timesheet.Data;
using Timesheet.Data.Models;

namespace Timesheet.Core.Repositories;

public class UserRepository(AppDbContext context) : TRepository<User>(context)
{
    public User? GetByUsername(string username)
    {
        return _dbSet.AsQueryable()
        .Include(u => u.Role)
        .Include(u => u.Company)
        .FirstOrDefault(u => u.Username == username);
    }
}
