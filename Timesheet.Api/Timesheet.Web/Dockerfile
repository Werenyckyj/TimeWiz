FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Timesheet.Web/Timesheet.Web.csproj", "Timesheet.Web/"]
COPY ["Timesheet.Core/Timesheet.Core.csproj", "Timesheet.Core/"]
COPY ["Timesheet.Data/Timesheet.Data.csproj", "Timesheet.Data/"]

RUN dotnet restore "Timesheet.Web/Timesheet.Web.csproj"

COPY . .

WORKDIR "/src/Timesheet.Web"
RUN dotnet publish "Timesheet.Web.csproj" -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Timesheet.Web.dll"]