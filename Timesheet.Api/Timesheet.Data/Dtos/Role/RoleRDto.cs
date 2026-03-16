using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos.Role;

public class RoleRDto : RoleDtoBase, IEntity
{
    [Required]
    public int Id { get; set; }
}
