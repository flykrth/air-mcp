# AIR-MCP TypeScript Server

This directory contains the **TypeScript MCP Server** for the AIR-MCP platform, built using the Nitrostack modular framework. It exposes datacenter physics, inventory registers, and workload management APIs to autonomous agents via the Model Context Protocol.

---

## 📦 Features & Capabilities

The server organizes its features into two core modules:
1.  **`DatacenterModule` (Core)**: Exposes the primary cyber-physical tools:
    *   **16 Tools**: For telemetry scans, failure prediction, SLA calculations, VM migrations, technician scheduling, and repair confirmations.
    *   **12 Resources**: E.g., `datacenter://telemetry/feed`, `maintenance://technicians/registry`.
    *   **10 Prompts**: Pre-structured templates to guide agent reasoning during incidents.
2.  **`CalculatorModule` (Utility)**: Basic math operations and unit conversions.

---

## 🚀 Commands

### Installation
```bash
npm install
```

### Run in Development (StdIO with Watcher)
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start in Production (Supports STDIO + HTTP SSE Transports)
```bash
npm start
```

---

## 🛠️ Testing with NitroStudio

We recommend using **NitroStudio** to manually test, run, and debug tools and resources:
*   Download and open NitroStudio at: [https://nitrostack.ai/studio](https://nitrostack.ai/studio).
*   Add a local server connection pointing to your server project.

For detailed schema structures and parameters of the exposed tools, consult the [MCP Guide](../docs/mcp/mcp_guide.md).
