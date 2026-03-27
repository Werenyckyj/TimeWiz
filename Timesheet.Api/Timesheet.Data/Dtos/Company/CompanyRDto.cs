using System;
using Timesheet.Data.Interfaces;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos;

public class CompanyRDto : CompanyDtoBase, IEntity
{
    public required int Id { get; set; }
    public required ICollection<UserRDto> Employees { get; set; }
}
