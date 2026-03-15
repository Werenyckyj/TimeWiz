using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Timesheet.Core;

public interface ITRepository<T> where T : class
{
    // <summary>
    /// Gets all entities of type T.
    /// </summary>
    /// <typeparam name="T">The type of entities to retrieve.</typeparam>
    /// <returns>An IQueryable of entities of type T.</returns>
    public IQueryable<T> GetAll();

    /// <summary>
    /// Gets an entity of type T by its unique identifier.
    /// </summary>
    /// <typeparam name="T">The type of entity to retrieve.</typeparam>
    /// <param name="id">The unique identifier of the entity.</param>
    /// <returns>The entity of type T with the specified id, or null if not found.</returns>
    public T? GetById(int id);

    /// <summary>
    /// Adds a new entity of type T to the repository.
    /// </summary>
    /// <typeparam name="T">The type of entity to add.</typeparam>
    /// <param name="entity">The entity of type T to add.</param>
    public EntityEntry<T> Add(T entity);

    /// <summary>
    /// Updates an existing entity of type T in the repository.
    /// </summary>
    /// <typeparam name="T">The type of entity to update.</typeparam>
    /// <param name="entity">The entity of type T to update.</param>
    public EntityEntry<T> Update(T entity);

    /// <summary>
    /// Deletes an entity of type T from the repository by its unique identifier.
    /// </summary>
    /// <typeparam name="T">The type of entity to delete.</typeparam>
    /// <param name="id">The unique identifier of the entity to delete.</param>
    public bool DeleteById(int id);

    /// <summary>
    /// Deletes an entity of type T from the repository.
    /// </summary>
    /// <typeparam name="T">The type of entity to delete.</typeparam>
    /// <param name="entity">The entity of type T to delete.</param>
    public bool Delete(T entity);

    /// <summary>
    /// Finds entities of type T that match a specified condition.
    /// </summary>
    /// <typeparam name="T">The type of entities to find.</typeparam>
    /// <param name="function">A function that defines the condition to match.</param>
    /// <returns>An IEnumerable of entities of type T that match the specified condition.</returns>
    public IEnumerable<T> Where(Func<T, bool> function);

    /// <summary>
    /// Saves changes made to the repository.
    /// </summary>
    public void SaveChanges();
}
