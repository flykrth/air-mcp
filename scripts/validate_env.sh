#!/bin/bash
# =============================================================================
# AIR-MCP Pre-flight Environment Validation Script
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;34m' # No Color
CLEAR='\033[0m'

echo -e "${BLUE}===================================================================${CLEAR}"
echo -e "${BLUE}        AIR-MCP Pre-flight Environment Validation Check${CLEAR}"
echo -e "${BLUE}===================================================================${CLEAR}"

FAILED_CHECKS=0

# 1. Check/initialize .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}[!] Warning: .env file not found. Copying from .env.example...${CLEAR}"
    cp .env.example .env
    echo -e "${GREEN}[+] Created .env file. Please review it and fill in Supabase credentials if needed.${CLEAR}"
else
    echo -e "${GREEN}[✓] .env file exists.${CLEAR}"
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# 2. Check Docker dependency
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[✗] Error: docker CLI is not installed.${CLEAR}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    if ! docker info &> /dev/null; then
        echo -e "${RED}[✗] Error: Docker daemon is not running.${CLEAR}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        echo -e "${GREEN}[✓] Docker daemon is running.${CLEAR}"
    fi
fi

# 3. Check Docker Compose dependency
if ! docker compose version &> /dev/null; then
    echo -e "${RED}[✗] Error: docker compose is not installed.${CLEAR}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo -e "${GREEN}[✓] Docker Compose is installed.${CLEAR}"
fi

# 4. Check Port Availabilities
check_port() {
    local port=$1
    local name=$2
    # Use netstat or ss or lsof if available, fallback to python socket test
    if python3 -c "import socket; s = socket.socket(); s.connect(('127.0.0.1', $port))" 2>/dev/null; then
        echo -e "${RED}[✗] Error: Port $port ($name) is already in use.${CLEAR}"
        return 1
    else
        echo -e "${GREEN}[✓] Port $port ($name) is free.${CLEAR}"
        return 0
    fi
}

echo -e "\nChecking local port availability..."
check_port 3000 "Next.js Frontend" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
check_port 3001 "Standalone MCP Server (SSE)" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
check_port 8000 "FastAPI Backend Gateway" || FAILED_CHECKS=$((FAILED_CHECKS + 1))

# 5. Check if offline fallback or Supabase credentials are configured
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "\n${YELLOW}[!] Note: SUPABASE_URL or SUPABASE_KEY is missing.${CLEAR}"
    echo -e "${YELLOW}    The system will automatically run in thread-safe 'Offline Fallback Mode' (in-memory database).${CLEAR}"
else
    echo -e "\n${GREEN}[✓] Supabase credentials loaded. Application will connect to Cloud Supabase database.${CLEAR}"
fi

# Final status
echo -e "\n-------------------------------------------------------------------"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}[✗] Environment validation failed with $FAILED_CHECKS error(s). Please resolve them before launching.${CLEAR}"
    exit 1
else
    echo -e "${GREEN}[✓] All environment validation checks passed. Ready for deployment!${CLEAR}"
    exit 0
fi
