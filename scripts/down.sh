#!/bin/bash
# =============================================================================
# AIR-MCP Shutdown / Cleanup Orchestrator
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CLEAR='\033[0m'

# Get directory where script resides
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$DIR/.."

cd "$ROOT_DIR"

echo -e "${BLUE}[+] Stopping and tearing down containerized stack...${CLEAR}"
docker compose down -v

echo -e "\n${GREEN}[✓] Teardown complete. All docker services stopped and volumes purged.${CLEAR}"
exit 0
