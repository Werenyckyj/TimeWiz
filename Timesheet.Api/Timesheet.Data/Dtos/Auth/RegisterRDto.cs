using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos.Auth;

public class RegisterRDto : RegisterDtoBase, IEntity
{
    [Required]
    public required int Id { get; set; }
}
