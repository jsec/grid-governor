set shell := ["bash", "-uc"]

# list recipes
default:
    @just --list

dev:
    #!/usr/bin/env bash
    trap 'kill 0' EXIT
    (cd api && uv run uvicorn gridgov.main:app --reload --port 8000) &
    (cd web && pnpm dev) &
    wait

# apply database migrations
migrate:
    cd api && uv run alembic upgrade head

gen:
    cd web && pnpm gen

test:
    cd api && (uv run pytest || [ $? -eq 5 ])
    cd web && pnpm exec vitest run

lint:
    cd api && uv run ruff check . && uv run pyrefly check
    cd web && pnpm lint && pnpm exec tsc -b
