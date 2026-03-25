using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Data;

namespace Timesheet.Testing;

public abstract class TestBase : IDisposable
{
    protected readonly AppDbContext _context;
    protected readonly UnitOfWork _unitOfWork;

    protected TestBase()
    {
        var dbName = Guid.NewGuid().ToString();
        _context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options);
        _context.Database.EnsureCreated();

        _unitOfWork = new UnitOfWork(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
