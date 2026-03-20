using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos;

public class RoleRDto : RoleDtoBase, IEntity
{
    [Required]
    public int Id { get; set; }
}
