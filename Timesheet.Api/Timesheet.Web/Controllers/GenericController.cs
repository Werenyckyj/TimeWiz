using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Timesheet.Core;
using Microsoft.AspNetCore.Authorization;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, Manager, Employee, Externist")]
[Produces("application/json")]
public class GenericController<T, TRequest, TResponse>(ILogger logger, ITRepository<T> tRepository, IMapper mapper) : ControllerBase where T : class where TRequest : class where TResponse : class
{
    protected readonly ILogger _logger = logger;
    protected readonly ITRepository<T> _tRepository = tRepository;
    protected readonly IMapper _mapper = mapper;

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult GetById(int id)
    {
        var entity = _tRepository.GetById(id);
        if (entity == null)
        {
            _logger.LogWarning($"Entity of type {typeof(T).Name} with ID {id} not found.");
            return NotFound();
        }
        var response = _mapper.Map<TResponse>(entity);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult Create([FromBody] TRequest request)
    {
        var createdEntity = _tRepository.Add(_mapper.Map<T>(request));
        _tRepository.SaveChanges();
        return Ok(_mapper.Map<TResponse>(createdEntity.Entity));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult Update(int id, [FromBody] TRequest request)
    {
        var entity = _tRepository.GetById(id);
        if (entity == null)
        {
            _logger.LogWarning($"Entity of type {typeof(T).Name} with ID {id} not found.");
            return NotFound();
        }
        _mapper.Map(request, entity);

        var updatedEntity = _tRepository.Update(entity);
        _tRepository.SaveChanges();
        return Ok(_mapper.Map<TResponse>(updatedEntity.Entity));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult Delete(int id)
    {
        var success = _tRepository.DeleteById(id);
        if (!success)
        {
            _logger.LogWarning($"Entity of type {typeof(T).Name} with ID {id} not found.");
            return NotFound();
        }
        _tRepository.SaveChanges();
        return Ok();
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult GetAll()
    {
        var entities = _tRepository.GetAll().AsEnumerable();
        var responses = _mapper.Map<IEnumerable<TResponse>>(entities).ToList();
        return Ok(new { responses.Count, data = responses });
    }
}
