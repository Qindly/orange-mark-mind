SHELL := /bin/bash

COMPOSE ?= docker compose
SERVICES := postgres redis backend frontend
MIGRATE_SERVICE := migrate

.PHONY: \
	help \
	Qindy \
	up \
	up-db \
	wait-db \
	down \
	restart \
	ps \
	logs \
	logs-backend \
	clean \
	dev-backend \
	dev-frontend \
	dev \
	migrate-up \
	migrate-down \
	migrate-down-all \
	migrate-version \
	migrate-up-local \
	migrate-down-local \
	migrate-down-all-local \
	migrate-version-local \
	migrate-create \
	docker-up \
	docker-up-db \
	docker-down \
	docker-logs \
	docker-logs-backend \
	docker-ps \
	docker-clean

# Optional env loading for local development and local migration commands.
-include .env
-include backend/.env
export

MIGRATE_DB_URL ?= $(if $(DATABASE_URL_LOCAL),$(DATABASE_URL_LOCAL),$(DATABASE_URL))
MIGRATE_CMD = migrate -path backend/migrations -database "$(MIGRATE_DB_URL)"
PG_USER ?= $(if $(POSTGRES_USER),$(POSTGRES_USER),omm_user)
PG_DB ?= $(if $(POSTGRES_DB),$(POSTGRES_DB),orange_mark_mind)

help:
	@echo "Orange Mark Mind - common commands"
	@echo ""
	@echo "Container:"
	@echo "  make Qindy         Start 4 containers; run migrate only if not initialized"
	@echo "  make up            Start 4 containers and run DB migrations first"
	@echo "  make up-db         Start only postgres + redis"
	@echo "  make down          Stop and remove containers"
	@echo "  make restart       Restart all 4 containers"
	@echo "  make ps            Show container status"
	@echo "  make logs          Follow all logs"
	@echo "  make logs-backend  Follow backend logs only"
	@echo "  make clean         Stop and remove containers + volumes"
	@echo ""
	@echo "Local dev:"
	@echo "  make dev-backend   Run backend locally (uses backend/.env)"
	@echo "  make dev-frontend  Run frontend locally on VITE_PORT"
	@echo "  make dev           Print recommended local dev workflow"
	@echo ""
	@echo "Migrations (dockerized, recommended):"
	@echo "  make migrate-up"
	@echo "  make migrate-down"
	@echo "  make migrate-down-all"
	@echo "  make migrate-version"
	@echo ""
	@echo "Migrations (local CLI):"
	@echo "  make migrate-up-local"
	@echo "  make migrate-down-local"
	@echo "  make migrate-down-all-local"
	@echo "  make migrate-version-local"
	@echo "  make migrate-create NAME=add_table_name"

up:
	$(COMPOSE) up -d postgres redis
	@echo "Running database migrations..."
	@$(MAKE) migrate-up
	$(COMPOSE) up -d backend frontend
	@echo "Waiting for containers..."
	@sleep 3
	@$(COMPOSE) ps

Qindy:
	$(COMPOSE) up -d postgres redis
	@$(MAKE) wait-db
	@echo "Checking migration state..."
	@if $(COMPOSE) exec -T postgres psql -U $(PG_USER) -d $(PG_DB) -tAc "SELECT to_regclass('public.schema_migrations') IS NOT NULL;" | tr -d '[:space:]' | grep -q '^t$$'; then \
		echo "schema_migrations exists, skip migrate-up."; \
	else \
		echo "schema_migrations not found, running migrate-up..."; \
		$(MAKE) migrate-up; \
	fi
	$(COMPOSE) up -d backend frontend
	@echo "Waiting for containers..."
	@sleep 3
	@$(COMPOSE) ps

up-db:
	$(COMPOSE) up -d postgres redis
	@echo "Waiting for postgres/redis..."
	@sleep 2
	@$(COMPOSE) ps

wait-db:
	@echo "Waiting for postgres to be ready..."
	@until $(COMPOSE) exec -T postgres pg_isready -U $(PG_USER) -d $(PG_DB) >/dev/null 2>&1; do \
		sleep 1; \
	done

down:
	$(COMPOSE) down

restart: down up

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

clean:
	$(COMPOSE) down -v

dev-backend:
	cd backend && go run cmd/server/main.go

dev-frontend:
	cd frontend && pnpm dev --host 0.0.0.0 --port $${VITE_PORT:-60103}

dev:
	@echo "Recommended local dev steps:"
	@echo "  1) make up-db"
	@echo "  2) make migrate-up"
	@echo "  3) make dev-backend"
	@echo "  4) make dev-frontend"

# Use dockerized migrate by default so local machine does not need migrate CLI.
migrate-up:
	@set +e; \
	output="$$( $(COMPOSE) run --rm -T $(MIGRATE_SERVICE) 2>&1 )"; \
	status=$$?; \
	set -e; \
	echo "$$output"; \
	if [ $$status -ne 0 ] && ! echo "$$output" | grep -qi "no change"; then \
		exit $$status; \
	fi

migrate-down:
	$(COMPOSE) run --rm -T $(MIGRATE_SERVICE) down 1

migrate-down-all:
	$(COMPOSE) run --rm -T $(MIGRATE_SERVICE) down -all

migrate-version:
	$(COMPOSE) run --rm -T $(MIGRATE_SERVICE) version

check-migrate-env:
	@if [ -z "$(MIGRATE_DB_URL)" ]; then \
		echo "DATABASE_URL_LOCAL or DATABASE_URL is required in .env/backend/.env"; \
		exit 1; \
	fi

migrate-up-local: check-migrate-env
	$(MIGRATE_CMD) up

migrate-down-local: check-migrate-env
	$(MIGRATE_CMD) down 1

migrate-down-all-local: check-migrate-env
	$(MIGRATE_CMD) down -all

migrate-version-local: check-migrate-env
	$(MIGRATE_CMD) version

migrate-create:
ifndef NAME
	$(error Please provide NAME, e.g. make migrate-create NAME=add_users_table)
endif
	migrate create -ext sql -dir backend/migrations -seq $(NAME)

# Backward-compatible aliases.
docker-up: up
docker-up-db: up-db
docker-down: down
docker-logs: logs
docker-logs-backend: logs-backend
docker-ps: ps
docker-clean: clean
