# ── Build stage ───────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore — copy solution + csproj files first for layer caching
COPY GroupEventManagement.sln .
COPY src/GroupEvents.Domain/GroupEvents.Domain.csproj             src/GroupEvents.Domain/
COPY src/GroupEvents.Contracts/GroupEvents.Contracts.csproj       src/GroupEvents.Contracts/
COPY src/GroupEvents.Application/GroupEvents.Application.csproj   src/GroupEvents.Application/
COPY src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj src/GroupEvents.Infrastructure/
COPY src/GroupEvents.Api/GroupEvents.Api.csproj                   src/GroupEvents.Api/
COPY tests/GroupEvents.Tests.Unit/GroupEvents.Tests.Unit.csproj   tests/GroupEvents.Tests.Unit/
COPY tests/GroupEvents.Tests.Integration/GroupEvents.Tests.Integration.csproj tests/GroupEvents.Tests.Integration/

RUN dotnet restore

# Copy source and publish
COPY . .
RUN dotnet publish src/GroupEvents.Api/GroupEvents.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

# ── Runtime stage ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

# Render injects PORT env var; ASP.NET Core reads ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

ENTRYPOINT ["dotnet", "GroupEvents.Api.dll"]
