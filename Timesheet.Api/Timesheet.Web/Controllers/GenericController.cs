using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Timesheet.Core;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
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
            return NotFound();
        }
        var response = _mapper.Map<TResponse>(entity);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public virtual IActionResult Create([FromBody] TRequest request)
    {
        var createdEntity = _tRepository.Add(_mapper.Map<T>(request));
        _tRepository.SaveChanges();
        return Ok(_mapper.Map<TResponse>(createdEntity.Entity));
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult Update([FromBody] TRequest request)
    {
        var updatedEntity = _tRepository.Update(_mapper.Map<T>(request));
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
            return NotFound();
        }
        _tRepository.SaveChanges();
        return Ok();
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public virtual IActionResult FindAll([FromQuery] Func<T, bool> filter)
    {
        var entities = _tRepository.Where(filter).AsEnumerable();
        var responses = _mapper.Map<IEnumerable<TResponse>>(entities).ToList();
        return Ok(new { responses.Count, data = responses });
    }
}
