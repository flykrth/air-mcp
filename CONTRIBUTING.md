# Contributing to AIR-MCP

First off, thank you for considering contributing to Adaptive Infrastructure Resilience MCP (AIR-MCP)! It is people like you who make this platform a production-grade, modular infrastructure tool.

---

## Code of Conduct

By participating in this project, you agree to abide by the terms of the [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## How Can I Contribute?

### Reporting Bugs or Requesting Features
* Open an issue in the repository.
* Describe the bug or feature request in detail. Provide clear, reproducible steps for bugs.
* Attach telemetry outputs, simulator logs, or screenshot captures if applicable.

### Submitting Pull Requests (PRs)
1. **Fork the repository** and clone your fork locally.
2. **Create a topic branch** from the `main` branch. Use a descriptive name:
   * `feature/cool-new-agent`
   * `bugfix/chiller-fan-math-overflow`
   * `docs/update-api-payloads`
3. **Write code** following our development and style standards.
4. **Run tests** and verify builds (see the [Testing Guide](./docs/testing/testing_guide.md)).
5. **Submit a Pull Request** to the `main` branch of the upstream repository.

---

## Development Standards

We enforce strict validation pipelines to ensure the codebase remains clean and stable:

### TypeScript (Frontend & MCP Server)
* We use TypeScript 5.x.
* Do not use the `any` type unless absolutely necessary. Write explicit interfaces or types.
* Verify compiler safety using:
  ```bash
  # Check frontend
  cd frontend && npx tsc --noEmit
  
  # Check MCP server
  cd mcp-server && npx tsc --noEmit
  ```
* Standard formatting is managed by Prettier and ESLint.

### Python (Backend Gateway & Multi-Agent System)
* We require Python 3.11+.
* Enforce code formatting using `black` and linting checks using `flake8`.
* Use explicit type annotations for function parameters and return values.
* Write unit tests under `/backend/tests` and verify them using `pytest`.

### Database Schema Updates
* Database modifications must be written as incremental SQL migrations under `/supabase/migrations/`.
* Follow our [Database Guide](./docs/database/database_guide.md) guidelines: use snake_case for tables and columns, enforce foreign key relationships with cascading deletes, and enable Row Level Security (RLS) policies by default.

---

## Git Commit Guidelines

Write clear, concise commit messages using the imperative mood:
* `feat: add anomaly score metric to InfrastructureRiskAgent`
* `fix: correct thermal dissipation delta in chiller simulator`
* `docs: detail recommend_workload_migration tool parameters`
