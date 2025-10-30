#!/bin/bash

# AllIsWell Application Startup Script
# This script starts both the backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           Starting AllIsWell Application${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Set Node.js path
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo -e "${YELLOW}Please run: export PATH=\"/opt/homebrew/opt/node@20/bin:\$PATH\"${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if PostgreSQL is running
if ! brew services list | grep postgresql@14 | grep started &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL is not running. Starting...${NC}"
    brew services start postgresql@14
    sleep 3
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
fi

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Check for PID files from previous runs
if [ -f .backend.pid ] || [ -f .frontend.pid ]; then
    echo -e "${YELLOW}⚠ Found existing PID files. Running cleanup...${NC}"
    ./stop.sh 2>/dev/null || true
    sleep 2
fi

# Start Backend
echo ""
echo -e "${BLUE}Starting Backend Server...${NC}"
cd "$PROJECT_DIR/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Backend dependencies not installed. Installing...${NC}"
    npm install
fi

# Start backend in background
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
echo -e "${GREEN}✓ Backend server starting (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}  Log: logs/backend.log${NC}"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo ""
echo -e "${BLUE}Starting Frontend Server...${NC}"
cd "$PROJECT_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Frontend dependencies not installed. Installing...${NC}"
    npm install
fi

# Start frontend in background
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo -e "${GREEN}✓ Frontend server starting (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}  Log: logs/frontend.log${NC}"

# Wait for servers to be fully up
echo ""
echo -e "${YELLOW}Waiting for servers to be ready...${NC}"
sleep 5

# Check if processes are still running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log${NC}"
fi

# Display access information
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ AllIsWell Application Started Successfully!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Application URL:${NC}"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Login Credentials:${NC}"
echo -e "  Admin:         admin@alliswell.com / admin123"
echo -e "  Practice Head: head@alliswell.com / head123"
echo -e "  PDM (Sample):  anand.shah@accionlabs.com / anand123"
echo ""
echo -e "${BLUE}Server PIDs:${NC}"
echo -e "  Backend:  $BACKEND_PID (logs/backend.log)"
echo -e "  Frontend: $FRONTEND_PID (logs/frontend.log)"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo -e "  Stop servers:     ${YELLOW}./stop.sh${NC}"
echo -e "  View backend log: ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  View frontend log:${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "  Check status:     ${YELLOW}./status.sh${NC}"
echo ""
echo -e "${GREEN}Application is ready! Open http://localhost:3000 in your browser.${NC}"
echo ""
