using System;
using AutoMapper;
using Timesheet.Core;
using Timesheet.Data.Dtos.User;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

public class UserController(ILogger<UserController> logger, ITRepository<User> tRepository, IMapper mapper) : GenericController<User, UserWDto, UserRDto>(logger, tRepository, mapper)
{
}
