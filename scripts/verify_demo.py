#!/usr/bin/env python3
import sys
import os
import json
import urllib.request
import urllib.error
import time
import argparse

# ANSI color codes
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
CYAN = '\033[0;36m'
BOLD = '\033[1m'
CLEAR = '\033[0m'

def print_header(title):
    print(f"\n{BLUE}==================================================================={CLEAR}")
    print(f"{BLUE}        {BOLD}{title}{CLEAR}")
    print(f"{BLUE}==================================================================={CLEAR}")

def print_check(name, status, details=None, warning=False):
    if status == "OK":
        marker = f"{GREEN}[✓]{CLEAR}"
    elif status == "WARNING" or warning:
        marker = f"{YELLOW}[!]{CLEAR}"
    else:
        marker = f"{RED}[✗]{CLEAR}"
    
    msg = f"{marker} {name}"
    if details:
        msg += f" - {details}"
    print(msg)

def make_request(url, method="GET", data=None, timeout=10):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps(data).encode('utf-8')
    else:
        jsondata = None
        
    try:
        with urllib.request.urlopen(req, data=jsondata, timeout=timeout) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode('utf-8')
            return e.code, err_body
        except Exception:
            return e.code, str(e.reason)
    except urllib.error.URLError as e:
        return 0, str(e.reason)
    except Exception as e:
        return 0, str(e)

def main():
    parser = argparse.ArgumentParser(description="AIR-MCP Pre-flight Presentation Verification Utility")
    parser.add_argument("--run-workflow", action="store_true", help="Execute a mock resilience workflow run to verify agent execution")
    args = parser.parse_args()

    backend_base = os.getenv("BACKEND_URL", os.getenv("BACKEND_API_URL", "https://air-mcp-production.up.railway.app"))
    frontend_base = os.getenv("FRONTEND_URL", "https://air-mcp.vercel.app")

    print_header("AIR-MCP Pre-flight Presentation Verification")
    failed_critical = 0
    warnings = 0

    # 1. Environment Variable Checks
    print(f"\n{CYAN}{BOLD}1. Checking Environment Variables...{CLEAR}")
    env_file = os.path.exists(".env")
    if env_file:
        print_check("Local .env file", "OK", "Found .env")
        # Read env variables manually
        supabase_url = None
        supabase_key = None
        with open(".env", "r") as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    if "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() == "SUPABASE_URL":
                            supabase_url = v.strip().strip('"').strip("'")
                        elif k.strip() == "SUPABASE_KEY":
                            supabase_key = v.strip().strip('"').strip("'")
        
        if supabase_url and supabase_key:
            print_check("Database Configuration", "OK", "Supabase credentials loaded from .env")
        else:
            print_check("Database Configuration", "WARNING", "Supabase credentials missing. App runs in local 'Offline Fallback Mode'", warning=True)
            warnings += 1
    else:
        print_check("Local .env file", "WARNING", "Not found. System will fall back to defaults.", warning=True)
        warnings += 1

    # 2. Port and Gateway Availability
    print(f"\n{CYAN}{BOLD}2. Validating Services status...{CLEAR}")
    
    # Check Backend Gateway
    backend_url = f"{backend_base.rstrip('/')}/api/v1/health"
    status_code, body = make_request(backend_url)
    
    if status_code == 0:
        print_check("FastAPI Backend", "ERROR", f"Failed to connect to backend on port 8000. Is the API server running?")
        failed_critical += 1
        # Stop checking since rest of backend API relies on this
        print(f"\n{RED}[!] Verification halted: Backend gateway is unreachable.{CLEAR}")
        print(f"    Please verify the public backend URL is reachable: {backend_url}")
        sys.exit(1)
    
    # Backend is running, process health response
    try:
        health_data = json.loads(body)
        if status_code == 200:
            print_check("FastAPI Backend Gateway", "OK", "Online and responsive")
        else:
            print_check("FastAPI Backend Gateway", "WARNING", f"Responded with status {status_code}", warning=True)
            warnings += 1
            
        details = health_data.get("details", {})
        
        # Check API detailed health
        api_det = details.get("api", {})
        print_check("API Module Status", "OK" if api_det.get("status") == "healthy" else "ERROR", f"Uptime: {api_det.get('uptime', 'unknown')}")
        
        # Check Database
        db_det = details.get("database", {})
        db_status = db_det.get("status")
        if db_status == "healthy":
            print_check("Database Connection", "OK", f"Connected to cloud database (type: {db_det.get('type')})")
        elif db_status == "online_fallback":
            print_check("Database Connection", "OK", f"Online fallback active (in-memory mode: {db_det.get('message')})")
        else:
            print_check("Database Connection", "ERROR", f"Database is unreachable: {db_det.get('error', 'unknown error')}")
            failed_critical += 1
            
        # Check Digital Twin
        dt_det = details.get("digital_twin", {})
        if dt_det.get("status") == "healthy":
            print_check("Digital Twin Simulator Engine", "OK", f"Active background loop tracking {dt_det.get('monitored_racks', 0)} racks")
        else:
            print_check("Digital Twin Simulator Engine", "ERROR", f"Background loop inactive: {dt_det.get('error', 'unknown error')}")
            failed_critical += 1
            
        # Check MCP Server compilation
        mcp_det = details.get("mcp_server", {})
        if mcp_det.get("status") == "healthy":
            print_check("MCP Server Build State", "OK", f"TypeScript compiled. Node: {mcp_det.get('node_version')}")
        else:
            print_check("MCP Server Build State", "ERROR", f"Compilation missing or Node not installed. (Compiled: {mcp_det.get('dist_compiled')}, Node: {mcp_det.get('node_installed')})")
            failed_critical += 1
            
    except Exception as e:
        print_check("Backend Health Data", "ERROR", f"Could not parse response JSON: {str(e)}")
        failed_critical += 1

    # 3. Check Frontend Accessibility
    print(f"\n{CYAN}{BOLD}3. Validating Frontend Access...{CLEAR}")
    frontend_url = frontend_base
    fe_status, fe_body = make_request(frontend_url)
    if fe_status == 200 or fe_status == 304:
        print_check("Next.js Frontend Server", "OK", f"Responsive at {frontend_url}")
    else:
        print_check("Next.js Frontend Server", "WARNING", f"Frontend is unreachable (Status: {fe_status}) at {frontend_url}.", warning=True)
        warnings += 1

    # 4. Optional Workflow Execution Validation
    if args.run_workflow:
        print(f"\n{CYAN}{BOLD}4. Executing Trial Resilience Workflow...{CLEAR}")
        print("    [Info] Triggering E2E recovery workflow. Please wait (typically ~8 seconds)...")
        t_start = time.time()
        status_wf, body_wf = make_request(f"{backend_base.rstrip('/')}/api/v1/orchestrator/run", method="POST", timeout=30)
        duration = time.time() - t_start
        
        if status_wf == 200:
            try:
                wf_data = json.loads(body_wf)
                has_run_all = "PROCUREMENT_AND_RECOVERY" in wf_data.get("step_history", [])
                if wf_data.get("status") == "success" and has_run_all:
                    verdict = "Recovery Verified!" if wf_data.get("recovery_verified") else "Recovery In Progress (Physical cooldown active)"
                    print_check("Workflow Engine Verification", "OK", f"Completed in {duration:.2f}s. Verdict: {verdict}")
                    print(f"    - Current step: {wf_data.get('current_step')}")
                    print(f"    - Workloads Migrated: {len(wf_data.get('migrations_executed', []))}")
                    print(f"    - Ticket status: {wf_data.get('ticket', {}).get('status', 'N/A')}")
                    print(f"    - Procurement status: {wf_data.get('order', {}).get('status', 'N/A')}")
                else:
                    print_check("Workflow Engine Verification", "ERROR", f"Workflow failed to run all steps. Status: {wf_data.get('status')}")
                    failed_critical += 1
            except Exception as e:
                print_check("Workflow Engine Verification", "ERROR", f"Failed to parse workflow result: {str(e)}")
                failed_critical += 1
        else:
            print_check("Workflow Engine Verification", "ERROR", f"API responded with HTTP {status_wf}: {body_wf}")
            failed_critical += 1

    # Final verdict
    print(f"\n{BLUE}-------------------------------------------------------------------{CLEAR}")
    if failed_critical > 0:
        print(f"{RED}{BOLD}[✗] PRE-FLIGHT VERIFICATION FAILED{CLEAR}")
        print(f"    {failed_critical} critical check(s) failed and {warnings} warning(s) found.")
        print(f"    Please fix the errors listed above before presenting to the judges.")
        sys.exit(1)
    elif warnings > 0:
        print(f"{YELLOW}{BOLD}[✓] PRE-FLIGHT VERIFICATION PASSED WITH WARNINGS{CLEAR}")
        print(f"    All critical checks passed. {warnings} warning(s) found.")
        print(f"    The stack is ready for demonstration, but review the warnings above.")
        sys.exit(0)
    else:
        print(f"{GREEN}{BOLD}[✓] PRE-FLIGHT VERIFICATION PASSED SUCCESSFULLY!{CLEAR}")
        print("    All services are running, integrated, and fully healthy. Safe to demo!")
        sys.exit(0)

if __name__ == "__main__":
    main()
