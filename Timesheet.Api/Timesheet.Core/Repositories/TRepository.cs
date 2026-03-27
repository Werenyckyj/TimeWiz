using Timesheet.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Linq.Expressions;

namespace Timesheet.Core.Repositories;

public class TRepository<TEntity> : ITRepository<TEntity> where TEntity : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<TEntity> _dbSet;

    public TRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<TEntity>();
    }

    public IQueryable<TEntity> GetAll()
    {
        return _dbSet;
    }

    public TEntity? GetById(int id)
    {
        return _dbSet.Find(id);
    }

    public EntityEntry<TEntity> Add(TEntity entity)
    {
        return _dbSet.Add(entity);
    }

    public EntityEntry<TEntity> Update(TEntity entity)
    {
        return _dbSet.Update(entity);
    }

    public bool DeleteById(int id)
    {
        var entity = _dbSet.Find(id);
        if (entity == null) return false;

        _dbSet.Remove(entity);
        return true;
    }

    public void Delete(TEntity entity)
    {
        if (_context.Entry(entity).State == EntityState.Detached)
        {
            _dbSet.Attach(entity);
        }
        _dbSet.Remove(entity);
    }

    public IEnumerable<TEntity> Where(Expression<Func<TEntity, bool>> function)
    {
        return _dbSet.Where(function).AsEnumerable();
    }

    public int Count()
    {
        return _dbSet.Count();
    }

    public void SaveChanges()
    {
        _context.SaveChanges();
    }

    public IQueryable<TEntity> Query()
    {
        return _dbSet;
    }
}
