using System;

namespace Timesheet.Data.Dtos;

public class UserDtoBase
{
    public required string Name { get; set; }
    public required string Surname { get; set; }
    public required string Email { get; set; }
    public required string Username { get; set; }
}
