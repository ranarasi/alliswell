#!/bin/bash

# AllIsWell Application Stop Script
# This script stops both the backend and frontend servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           Stopping AllIsWell Application${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Function to stop a process
stop_process() {
    local PID_FILE=$1
    local NAME=$2

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo -e "${YELLOW}Stopping $NAME (PID: $PID)...${NC}"
            kill $PID
            sleep 2

            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                echo -e "${YELLOW}Force stopping $NAME...${NC}"
                kill -9 $PID 2>/dev/null || true
            fi

            echo -e "${GREEN}✓ $NAME stopped${NC}"
        else
            echo -e "${YELLOW}⚠ $NAME process (PID: $PID) not running${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}⚠ No PID file found for $NAME${NC}"
    fi
}

# Stop backend
stop_process "backend.pid" "Backend"

# Stop frontend
stop_process "frontend.pid" "Frontend"

# Also try to kill by port (backup method)
echo ""
echo -e "${BLUE}Checking for processes on ports 3000 and 3001...${NC}"

# Kill process on port 3001 (backend)
BACKEND_PORT_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    echo -e "${YELLOW}Found process on port 3001 (PID: $BACKEND_PORT_PID)${NC}"
    kill -9 $BACKEND_PORT_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Killed process on port 3001${NC}"
fi

# Kill process on port 3000 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    echo -e "${YELLOW}Found process on port 3000 (PID: $FRONTEND_PORT_PID)${NC}"
    kill -9 $FRONTEND_PORT_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Killed process on port 3000${NC}"
fi

# Clean up any npm/node processes related to the project
echo ""
echo -e "${BLUE}Cleaning up any remaining processes...${NC}"
pkill -f "ts-node-dev.*alliswell" 2>/dev/null || true
pkill -f "next dev.*alliswell" 2>/dev/null || true

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ AllIsWell Application Stopped${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}To start the application again, run:${NC}"
echo -e "  ${YELLOW}./start.sh${NC}"
echo ""
