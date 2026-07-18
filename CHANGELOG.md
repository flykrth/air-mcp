# Changelog

All notable changes to the AIR-MCP platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-18

This is the initial production-ready release of the Adaptive Infrastructure Resilience MCP platform for the Hackathon evaluation.

### Added
* **Multi-Agent Orchestration Engine**: Built-in 6 autonomous agents (`InfrastructureHealthAgent`, `InfrastructureRiskAgent`, `CloudWorkloadAgent`, `MaintenancePlanningAgent`, `SupplierIntelligenceAgent`, `ProcurementAgent`) executing on a state machine backend.
* **Digital Twin Simulator**: High-fidelity background simulation loop modeling cooling failures, thermal dissipation, workload electricity demands, and server degradation.
* **TypeScript MCP Server**: Modular server built with Nitrostack, exposing 16 infrastructure-focused tools, 12 resource URIs, and 10 prompt templates.
* **Relational Data Layer**: Integrated Supabase schema with 18 tables, indexes, cascading foreign keys, Row-Level Security, and a thread-safe local in-memory fallback database.
* **Next.js Frontend Dashboard**: Interactive dashboard for visualizing rack temperatures, workflow state logs, incident tickets, and supplier catalogs.
* **Pre-flight & CLI Scripts**: Automators `./scripts/up.sh`, `./scripts/down.sh`, and `verify_demo.py` for testing scenarios.
* **CI/CD Pipeline**: GitHub Actions workflow checking flake8, black, eslint, TypeScript, pytest, and multi-container Docker builds.
