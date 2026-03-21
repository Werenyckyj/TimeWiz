using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin, Manager, Emploeyee, Externist")]
public class TimesheetController(ILogger<TimesheetController> logger, ITRepository<TsWeek> repository, IMapper mapper, UnitOfWork unitOfWork) : GenericController<TsWeek, TsWeekWDto, TsWeekRDto>(logger, repository, mapper)
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;

    [HttpPost]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public override IActionResult Create([FromBody] TsWeekWDto dto)
    {
        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        var existingTsWeek = _unitOfWork.TsWeekRepository
            .Where(t => t.UserId == dto.UserId && t.Year == dto.Year && t.WeekNumber == dto.WeekNumber)
            .FirstOrDefault();

        if (existingTsWeek != null)
        {
            return BadRequest($"Timesheet for User ID {dto.UserId}, Year {dto.Year}, Week {dto.WeekNumber} already exists.");
        }

        var tsWeek = _mapper.Map<TsWeek>(dto);
        var week = _unitOfWork.TsWeekRepository.Add(tsWeek);
        _unitOfWork.SaveChanges();

        for (int i = 0; i < dto.DaysInWeek; i++)
        {
            var entry = new TsEntry
            {
                TsWeekId = week.Entity.Id,
                WorkDate = dto.StartDate.AddDays(i),
                Hours = 0,
                TsWeek = week.Entity
            };
            _unitOfWork.TsEntryRepository.Add(entry);
        }
        _unitOfWork.SaveChanges();

        var responseDto = _mapper.Map<TsWeekRDto>(tsWeek);
        return CreatedAtAction(nameof(GetById), new { id = tsWeek.Id }, responseDto);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public override IActionResult Update(int id, [FromBody] TsWeekWDto dto)
    {
        var existingTsWeek = _unitOfWork.TsWeekRepository.GetById(id);
        if (existingTsWeek == null) return NotFound($"Timesheet with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        _mapper.Map(dto, existingTsWeek);
        var updatedTsWeek = _unitOfWork.TsWeekRepository.Update(existingTsWeek);
        _unitOfWork.SaveChanges();

        var responseDto = _mapper.Map<TsWeekRDto>(updatedTsWeek.Entity);
        return Ok(responseDto);
    }
}
