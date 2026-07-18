#!/bin/bash
# =============================================================================
# AIR-MCP Startup Orchestrator
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CLEAR='\033[0m'

# Get directory where script resides
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$DIR/.."

cd "$ROOT_DIR"

# 1. Run validation
if ! bash ./scripts/validate_env.sh; then
    echo -e "${RED}[✗] Startup aborted due to environment validation failures.${CLEAR}"
    exit 1
fi

echo -e "\n${BLUE}[+] Rebuilding and starting docker containers...${CLEAR}"
docker compose up --build -d

echo -e "\n${BLUE}[+] Waiting for services to become healthy...${CLEAR}"

MAX_RETRIES=20
RETRY_INTERVAL=3

# Helper to check JSON status from curl
check_health() {
    local url=$1
    local name=$2
    
    if response=$(curl -s --max-time 2 "$url"); then
        if echo "$response" | grep -q '"status":"healthy"'; then
            echo -e "${GREEN}[✓] $name is healthy.${CLEAR}"
            return 0
        else
            echo -e "${YELLOW}[!] $name is responding but status is degraded.${CLEAR}"
            return 2
        fi
    else
        return 1
    fi
}

# Wait loop
for ((i=1; i<=MAX_RETRIES; i++)); do
    echo -e "${YELLOW}[...] Probe $i/$MAX_RETRIES...${CLEAR}"
    
    BACKEND_OK=0
    FRONTEND_OK=0
    
    if check_health "http://localhost:8000/api/v1/health" "FastAPI Backend Gateway"; then
        BACKEND_OK=1
    fi
    
    if check_health "http://localhost:3000/api/health" "Next.js Frontend"; then
        FRONTEND_OK=1
    fi
    
    if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
        echo -e "\n${GREEN}===================================================================${CLEAR}"
        echo -e "${GREEN}      AIR-MCP Platform is ONLINE and operational!${CLEAR}"
        echo -e "${GREEN}===================================================================${CLEAR}"
        echo -e "${BLUE}Frontend Dashboard:${CLEAR} http://localhost:3000"
        echo -e "${BLUE}Backend API Gateway:${CLEAR} http://localhost:8000"
        echo -e "${BLUE}Backend Docs (Swagger):${CLEAR} http://localhost:8000/docs"
        echo -e "${BLUE}Backend Health Check:${CLEAR} http://localhost:8000/api/v1/health"
        echo -e "${BLUE}Frontend Health Check:${CLEAR} http://localhost:3000/api/health"
        echo -e "${BLUE}Standalone MCP Server (SSE):${CLEAR} http://localhost:3001"
        echo -e "${GREEN}-------------------------------------------------------------------${CLEAR}"
        echo -e "${GREEN}Enjoy the demo! Run ./scripts/down.sh to tear down the services.${CLEAR}"
        exit 0
    fi
    
    sleep $RETRY_INTERVAL
done

echo -e "\n${RED}[✗] Error: Services failed to become healthy within the timeout period.${CLEAR}"
echo -e "${YELLOW}Printing container logs for diagnosis...${CLEAR}"
docker compose logs --tail=50
exit 1
