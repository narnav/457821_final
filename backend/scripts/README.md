# Lumo Backend Scripts

This directory contains scripts for database management, seeding, and data generation.

## Canonical Workflow

### Database Initialization & Seeding
The canonical script for setting up the database is `seed_db.py`. It handles both schema initialization and seeding with dev/test data.

```bash
# From the project root
python -m backend.scripts.seed_db
```

This script performs the following:
1.  **Initializes Database**: Creates all tables defined in `backend/app/db/models.py`.
2.  **Seeds Deterministic User**: Creates a test user with predictable credentials.
    -   **Email**: `test@lumo.dev`
    -   **Password**: Value of `LUMO_SEED_USER_PASSWORD` environment variable (default: `lumo-dev-123`).
3.  **Seeds Factory Users**: Generates several users with full relationship graphs (profiles, states, exercises, and attempts) using `polyfactory`.

## Script Reference

### `seed_db.py`
**Type**: Canonical
**Purpose**: Full database setup and seeding.
**Usage**: `python -m backend.scripts.seed_db`
**Config**: 
-   `LUMO_SEED_USER_PASSWORD`: Customizes the seed user password. Can be set in `backend/.env`.

### `bootstrap_db.py`
**Type**: Legacy Wrapper
**Purpose**: Maintained for backward compatibility. It simply delegates to `seed_db.py`.
**Usage**: `python -m backend.scripts.bootstrap_db` (Prefer `seed_db.py` directly).

### `factories.py`
**Type**: Library / Helper
**Purpose**: Defines `polyfactory` models used by `seed_db.py` and tests to generate realistic mock data.
**Usage**: Not intended to be run directly.

## Development Notes

-   **Authentication**: All seeded users are "auth-ready" with hashed passwords, allowing immediate login via the API.
-   **Environment Variables**: The scripts load configuration from `backend/.env`. Ensure this file exists for custom settings.
-   **Security**: Real secrets are never committed. The default dev password is for local development only.
