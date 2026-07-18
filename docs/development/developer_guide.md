# Developer Guide - AIR-MCP

Welcome to the AIR-MCP developer documentation. This guide details how to work with the codebase, write code, run verification checks, and submit changes.

---

## 1. System Components

The project consists of three main code repositories within a single monorepo:
1.  **FastAPI Backend Gateway (`/backend`)**: Core business logic, digital twin simulator, multi-agent engine, and database client layers.
2.  **Next.js Frontend Dashboard (`/frontend`)**: Presentation dashboard showing the digital twin visualizer and workflow steps.
3.  **TypeScript MCP Server (`/mcp-server`)**: Nitrostack-based server exposing tools, resources, and templates.

---

## 2. Setting Up Your Development Environment

### Prerequisites
Make sure your development machine has the following tools installed:
*   **Python 3.11** or higher
*   **Node.js 20.x** or higher (with npm)
*   **Docker & Docker Compose** (for containerized runs)
*   **Git**

### Step A: Clone the Repository
```bash
git clone https://github.com/flykrth/air-mcp.git
cd air-mcp
```

### Step B: Configure Local Environment Files
Copy the template configuration files:
```bash
cp .env.example .env
cp mcp-server/.env.example mcp-server/.env
```
For local offline development, you can leave the `SUPABASE_URL` and `SUPABASE_KEY` variables empty in `.env`. The backend will automatically fall back to an in-memory mock database.

### Step C: Initialize Backend Gateway
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Step D: Initialize TypeScript MCP Server
1. Navigate to the mcp-server directory:
   ```bash
   cd ../mcp-server
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Compile and watch code changes:
   ```bash
   npm run dev
   ```

### Step E: Initialize Next.js Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Next.js dev server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 3. Code Standards & Style Guidelines

To keep the platform stable and maintainable, we enforce coding standards in our CI/CD pipelines.

### Python Code Standards (Backend)
*   **Formatter**: We use `black` for unified styling (88 character line limit).
*   **Linter**: We use `flake8` to catch syntax errors, unused imports, or undefined variables.
*   **Type Annotations**: All function signatures must include type hints.
*   **Documentation**: Every module, class, and public function must include a docstring.

To verify Python code locally:
```bash
# From the backend/ folder
black --check app/
flake8 app/
```

### TypeScript Code Standards (Frontend & MCP Server)
*   **Formatter**: Prettier is standard.
*   **Type Safety**: Avoid using `any`. Write explicit interfaces and types.
*   **Validation**: The MCP server uses `zod` for strict runtime parameter schemas in tools.

To verify TypeScript types locally:
```bash
# From the frontend/ folder
npx tsc --noEmit

# From the mcp-server/ folder
npx tsc --noEmit
```

---

## 4. Contributing Code

1.  **Branch Naming**: Keep branch names structured:
    *   `feature/<name>` for new features or agents.
    *   `bugfix/<name>` for correcting bugs.
    *   `docs/<name>` for documentation updates.
2.  **Pull Requests**:
    *   Ensure all tests pass.
    *   Rebase on `main` before pushing to resolve conflicts.
    *   Provide a clear PR description detailing what changed and how it was verified.
