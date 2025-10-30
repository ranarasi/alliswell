#!/bin/bash

# AllIsWell Application Restart Script

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           Restarting AllIsWell Application${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Stop the application
echo -e "${BLUE}Step 1: Stopping application...${NC}"
./stop.sh

# Wait a moment
echo ""
echo -e "${BLUE}Waiting 3 seconds...${NC}"
sleep 3

# Start the application
echo ""
echo -e "${BLUE}Step 2: Starting application...${NC}"
./start.sh
