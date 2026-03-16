using System;

namespace Timesheet.Core;

public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// Saves changes made to the repository.
    /// </summary>
    void SaveChanges();
}
