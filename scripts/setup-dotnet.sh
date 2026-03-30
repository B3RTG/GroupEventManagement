#!/bin/bash
# Sets up the .NET solution and projects inside the dev container.
# Safe to run multiple times — skips if the solution already exists.
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

if [ -f "$BACKEND_DIR/GroupEventManagement.sln" ]; then
  echo "✅ .NET solution already exists — skipping setup."
  exit 0
fi

echo "🔧 Creating .NET solution..."
mkdir -p "$BACKEND_DIR"
cd "$BACKEND_DIR"

# ── Solution ──────────────────────────────────────────────
dotnet new sln -n GroupEventManagement

# ── Projects ──────────────────────────────────────────────
dotnet new webapi  -n GroupEvents.Api           -o src/GroupEvents.Api           --no-openapi
dotnet new classlib -n GroupEvents.Application  -o src/GroupEvents.Application
dotnet new classlib -n GroupEvents.Domain       -o src/GroupEvents.Domain
dotnet new classlib -n GroupEvents.Infrastructure -o src/GroupEvents.Infrastructure
dotnet new classlib -n GroupEvents.Contracts    -o src/GroupEvents.Contracts
dotnet new xunit   -n GroupEvents.Tests.Unit    -o tests/GroupEvents.Tests.Unit
dotnet new xunit   -n GroupEvents.Tests.Integration -o tests/GroupEvents.Tests.Integration

# ── Add to solution ───────────────────────────────────────
dotnet sln add src/GroupEvents.Api/GroupEvents.Api.csproj
dotnet sln add src/GroupEvents.Application/GroupEvents.Application.csproj
dotnet sln add src/GroupEvents.Domain/GroupEvents.Domain.csproj
dotnet sln add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj
dotnet sln add src/GroupEvents.Contracts/GroupEvents.Contracts.csproj
dotnet sln add tests/GroupEvents.Tests.Unit/GroupEvents.Tests.Unit.csproj
dotnet sln add tests/GroupEvents.Tests.Integration/GroupEvents.Tests.Integration.csproj

# ── Project references ────────────────────────────────────
dotnet add src/GroupEvents.Api/GroupEvents.Api.csproj reference \
  src/GroupEvents.Application/GroupEvents.Application.csproj \
  src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj \
  src/GroupEvents.Contracts/GroupEvents.Contracts.csproj

dotnet add src/GroupEvents.Application/GroupEvents.Application.csproj reference \
  src/GroupEvents.Domain/GroupEvents.Domain.csproj \
  src/GroupEvents.Contracts/GroupEvents.Contracts.csproj

dotnet add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj reference \
  src/GroupEvents.Application/GroupEvents.Application.csproj \
  src/GroupEvents.Domain/GroupEvents.Domain.csproj

dotnet add tests/GroupEvents.Tests.Unit/GroupEvents.Tests.Unit.csproj reference \
  src/GroupEvents.Application/GroupEvents.Application.csproj \
  src/GroupEvents.Domain/GroupEvents.Domain.csproj

dotnet add tests/GroupEvents.Tests.Integration/GroupEvents.Tests.Integration.csproj reference \
  src/GroupEvents.Api/GroupEvents.Api.csproj \
  src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj

# ── NuGet packages — Api ──────────────────────────────────
dotnet add src/GroupEvents.Api/GroupEvents.Api.csproj package MediatR
dotnet add src/GroupEvents.Api/GroupEvents.Api.csproj package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add src/GroupEvents.Api/GroupEvents.Api.csproj package Swashbuckle.AspNetCore

# ── NuGet packages — Application ─────────────────────────
dotnet add src/GroupEvents.Application/GroupEvents.Application.csproj package MediatR
dotnet add src/GroupEvents.Application/GroupEvents.Application.csproj package FluentValidation
dotnet add src/GroupEvents.Application/GroupEvents.Application.csproj package FluentValidation.DependencyInjectionExtensions

# ── NuGet packages — Infrastructure ──────────────────────
dotnet add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Design
dotnet add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj package Hangfire.AspNetCore
dotnet add src/GroupEvents.Infrastructure/GroupEvents.Infrastructure.csproj package Hangfire.PostgreSql

# ── NuGet packages — Tests ────────────────────────────────
dotnet add tests/GroupEvents.Tests.Unit/GroupEvents.Tests.Unit.csproj package FluentAssertions
dotnet add tests/GroupEvents.Tests.Integration/GroupEvents.Tests.Integration.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/GroupEvents.Tests.Integration/GroupEvents.Tests.Integration.csproj package Testcontainers.PostgreSql

# ── Directory structure for layers ────────────────────────
mkdir -p src/GroupEvents.Domain/Entities
mkdir -p src/GroupEvents.Domain/Exceptions
mkdir -p src/GroupEvents.Domain/ValueObjects
mkdir -p src/GroupEvents.Application/Commands
mkdir -p src/GroupEvents.Application/Queries
mkdir -p src/GroupEvents.Application/Services
mkdir -p src/GroupEvents.Infrastructure/Persistence/Migrations
mkdir -p src/GroupEvents.Infrastructure/Notifications
mkdir -p src/GroupEvents.Infrastructure/BackgroundJobs
mkdir -p src/GroupEvents.Api/Controllers
mkdir -p src/GroupEvents.Api/Middleware

# ── Initial build check ───────────────────────────────────
dotnet build GroupEventManagement.sln --configuration Debug

echo ""
echo "✅ .NET solution ready!"
echo "   Layers: Api → Application → Domain"
echo "           Infrastructure → Application + Domain"
echo "   Tests:  Tests.Unit | Tests.Integration"
