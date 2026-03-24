using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Timesheet.Core;

public interface ITRepository<TEntity> where TEntity : class
{
    // <summary>
    /// Gets all entities of type TEntity.
    /// </summary>
    /// <typeparam name="TEntity">The type of entities to retrieve.</typeparam>
    /// <returns>An IQueryable of entities of type TEntity.</returns>
    public IQueryable<TEntity> GetAll();

    /// <summary>
    /// Gets an entity of type TEntity by its unique identifier.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity to retrieve.</typeparam>
    /// <param name="id">The unique identifier of the entity.</param>
    /// <returns>The entity of type TEntity with the specified id, or null if not found.</returns>
    public TEntity? GetById(int id);

    /// <summary>
    /// Adds a new entity of type TEntity to the repository.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity to add.</typeparam>
    /// <param name="entity">The entity of type TEntity to add.</param>
    public EntityEntry<TEntity> Add(TEntity entity);

    /// <summary>
    /// Updates an existing entity of type TEntity in the repository.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity to update.</typeparam>
    /// <param name="entity">The entity of type TEntity to update.</param>
    public EntityEntry<TEntity> Update(TEntity entity);

    /// <summary>
    /// Deletes an entity of type TEntity from the repository by its unique identifier.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity to delete.</typeparam>
    /// <param name="id">The unique identifier of the entity to delete.</param>
    public bool DeleteById(int id);

    /// <summary>
    /// Deletes an entity of type TEntity from the repository.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity to delete.</typeparam>
    /// <param name="entity">The entity of type TEntity to delete.</param>
    public void Delete(TEntity entity);

    /// <summary>
    /// Finds entities of type TEntity that match a specified condition.
    /// </summary>
    /// <typeparam name="TEntity">The type of entities to find.</typeparam>
    /// <param name="function">A function that defines the condition to match.</param>
    /// <returns>An IEnumerable of entities of type TEntity that match the specified condition.</returns>
    public IEnumerable<TEntity> Where(Expression<Func<TEntity, bool>> function);

    /// <summary>
    /// Counts the number of entities of type TEntity in the repository.
    /// </summary>
    /// <returns></returns>
    public int Count();

    /// <summary>
    /// Saves changes made to the repository.
    /// </summary>
    public void SaveChanges();

    /// <summary>
    /// Provides an IQueryable of entities of type TEntity for advanced querying scenarios.
    /// </summary>
    /// <returns></returns>
    public IQueryable<TEntity> Query();
}
