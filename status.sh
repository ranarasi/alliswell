#!/bin/bash

# AllIsWell Application Status Script
# This script checks the status of the application

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           AllIsWell Application Status${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Check PostgreSQL
echo -e "${BLUE}PostgreSQL:${NC}"
if brew services list | grep postgresql@14 | grep started &> /dev/null; then
    echo -e "  ${GREEN}✓ Running${NC}"
else
    echo -e "  ${RED}✗ Not running${NC}"
    echo -e "  ${YELLOW}  Start with: brew services start postgresql@14${NC}"
fi

# Check Backend
echo ""
echo -e "${BLUE}Backend Server (Port 3001):${NC}"
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "  ${GREEN}✓ Running (PID: $BACKEND_PID)${NC}"
        echo -e "  ${BLUE}  Log: logs/backend.log${NC}"
    else
        echo -e "  ${RED}✗ Not running (stale PID file)${NC}"
        rm -f backend.pid
    fi
else
    # Check by port
    BACKEND_PORT_PID=$(lsof -ti:3001 2>/dev/null)
    if [ ! -z "$BACKEND_PORT_PID" ]; then
        echo -e "  ${GREEN}✓ Running (PID: $BACKEND_PORT_PID)${NC}"
        echo -e "  ${YELLOW}  Note: No PID file found${NC}"
    else
        echo -e "  ${RED}✗ Not running${NC}"
    fi
fi

# Check Frontend
echo ""
echo -e "${BLUE}Frontend Server (Port 3000):${NC}"
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "  ${GREEN}✓ Running (PID: $FRONTEND_PID)${NC}"
        echo -e "  ${BLUE}  Log: logs/frontend.log${NC}"
    else
        echo -e "  ${RED}✗ Not running (stale PID file)${NC}"
        rm -f frontend.pid
    fi
else
    # Check by port
    FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$FRONTEND_PORT_PID" ]; then
        echo -e "  ${GREEN}✓ Running (PID: $FRONTEND_PORT_PID)${NC}"
        echo -e "  ${YELLOW}  Note: No PID file found${NC}"
    else
        echo -e "  ${RED}✗ Not running${NC}"
    fi
fi

# Check connectivity
echo ""
echo -e "${BLUE}Connectivity Test:${NC}"

# Test backend
if curl -s http://localhost:3001/health &> /dev/null; then
    echo -e "  ${GREEN}✓ Backend API responding${NC}"
else
    echo -e "  ${YELLOW}⚠ Backend API not responding${NC}"
fi

# Test frontend
if curl -s http://localhost:3000 &> /dev/null; then
    echo -e "  ${GREEN}✓ Frontend responding${NC}"
else
    echo -e "  ${YELLOW}⚠ Frontend not responding${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Check overall status
BACKEND_OK=false
FRONTEND_OK=false

if [ -f "backend.pid" ] && kill -0 $(cat backend.pid) 2>/dev/null; then
    BACKEND_OK=true
elif lsof -ti:3001 &>/dev/null; then
    BACKEND_OK=true
fi

if [ -f "frontend.pid" ] && kill -0 $(cat frontend.pid) 2>/dev/null; then
    FRONTEND_OK=true
elif lsof -ti:3000 &>/dev/null; then
    FRONTEND_OK=true
fi

if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✓ Application is running${NC}"
    echo ""
    echo -e "${BLUE}Access the application at:${NC}"
    echo -e "  ${GREEN}http://localhost:3000${NC}"
elif [ "$BACKEND_OK" = true ] || [ "$FRONTEND_OK" = true ]; then
    echo -e "${YELLOW}⚠ Application is partially running${NC}"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  Stop:  ${YELLOW}./stop.sh${NC}"
    echo -e "  Start: ${YELLOW}./start.sh${NC}"
else
    echo -e "${RED}✗ Application is not running${NC}"
    echo ""
    echo -e "${BLUE}To start the application:${NC}"
    echo -e "  ${YELLOW}./start.sh${NC}"
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
