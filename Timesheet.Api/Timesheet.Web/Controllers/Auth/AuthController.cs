using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Core.Services.Auth;

namespace Timesheet.Web.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IAuthService authService, IMapper mapper, UnitOfWork unitOfWork) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly IMapper _mapper = mapper;
    private readonly UnitOfWork _unitOfWork = unitOfWork;

}
