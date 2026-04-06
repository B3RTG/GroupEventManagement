##
## GEM — Development helpers
## Usage: make <target>
##

BACKEND_DIR := backend/src/GroupEvents.Api
BACKEND_LOG := /tmp/gem-backend.log
FRONTEND_LOG := /tmp/gem-frontend.log

.PHONY: dev stop logs-backend logs-frontend db db-stop status help

## ── Start everything ────────────────────────────────────────
dev: ## Start backend + frontend (Postgres must be running via docker-compose)
	@echo "▶  Starting backend  → http://localhost:5189"
	@echo "▶  Starting frontend → http://localhost:5173"
	@nohup dotnet run --project $(BACKEND_DIR) > $(BACKEND_LOG) 2>&1 & echo $$! > /tmp/gem-backend.pid
	@nohup pnpm --dir apps/web dev > $(FRONTEND_LOG) 2>&1 & echo $$! > /tmp/gem-frontend.pid
	@echo ""
	@echo "  Logs:  make logs-backend  |  make logs-frontend"
	@echo "  Stop:  make stop"
	@echo ""
	@sleep 5 && grep -E "Now listening|ready in|error" $(BACKEND_LOG) $(FRONTEND_LOG) 2>/dev/null | head -10 || true

## ── Stop everything ─────────────────────────────────────────
stop: ## Stop backend and frontend processes
	@if [ -f /tmp/gem-backend.pid ]; then \
		kill $$(cat /tmp/gem-backend.pid) 2>/dev/null && rm /tmp/gem-backend.pid; \
		pkill -f "GroupEvents.Api" 2>/dev/null || true; \
		echo "■  Backend stopped"; \
	fi
	@if [ -f /tmp/gem-frontend.pid ]; then \
		kill $$(cat /tmp/gem-frontend.pid) 2>/dev/null && rm /tmp/gem-frontend.pid; \
		pkill -f "vite" 2>/dev/null || true; \
		echo "■  Frontend stopped"; \
	fi

## ── Logs ────────────────────────────────────────────────────
logs-backend: ## Tail backend logs
	@tail -f $(BACKEND_LOG)

logs-frontend: ## Tail frontend logs
	@tail -f $(FRONTEND_LOG)

## ── Database ─────────────────────────────────────────────────
db: ## Start Postgres + pgAdmin via docker-compose
	docker compose up -d
	@echo "  Postgres  → localhost:5432"
	@echo "  pgAdmin   → http://localhost:8080  (admin@local.dev / admin)"

db-stop: ## Stop database containers
	docker compose down

## ── Status ───────────────────────────────────────────────────
status: ## Show which ports are in use
	@echo "Port status:"
	@ss -tlnp 2>/dev/null | grep -E "5173|5189|5432" || echo "  (no GEM services running)"

## ── Help ─────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
