using Timesheet.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Timesheet.Core.Repositories;

public class TRepository<T> : ITRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public TRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    public IQueryable<T> GetAll()
    {
        return _dbSet;
    }

    public T? GetById(int id)
    {
        return _dbSet.Find(id);
    }

    public EntityEntry<T> Add(T entity)
    {
        return _dbSet.Add(entity);
    }

    public EntityEntry<T> Update(T entity)
    {
        return _dbSet.Update(entity);
    }

    public bool DeleteById(int id)
    {
        var entity = GetById(id);
        if (entity == null) return false;

        _dbSet.Remove(entity);
        return true;
    }

    public bool Delete(T entity)
    {
        if (entity == null) return false;

        _dbSet.Remove(entity);
        return true;
    }

    public IEnumerable<T> Where(Func<T, bool> function)
    {
        return _dbSet.Where(i => function(i)).AsEnumerable();
    }

    public void SaveChanges()
    {
        _context.SaveChanges();
    }
}
