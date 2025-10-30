#!/bin/bash

# AllIsWell - Install Dependencies Script
# Run this AFTER Node.js installation completes

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "       AllIsWell - Installing Dependencies"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed yet!${NC}"
    echo ""
    echo "Please wait for Node.js installation to complete."
    echo "Check status with: node --version"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo -e "${GREEN}✓ npm v${NPM_VERSION} found${NC}"
echo ""

# Install backend dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Installing Backend Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

echo ""
echo "Installing backend packages..."
echo "  - express, cors, dotenv"
echo "  - pg (PostgreSQL client)"
echo "  - bcrypt, jsonwebtoken"
echo "  - TypeScript and dev dependencies"
echo ""
npm config set strict-ssl false
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
    echo ""
    echo "Installed packages:"
    npm list --depth=0 2>/dev/null || true
else
    echo -e "${RED}✗ Backend installation failed${NC}"
    exit 1
fi

cd ..

# Install frontend dependencies
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Installing Frontend Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend

echo ""
echo "Installing frontend packages..."
echo "  - next, react, react-dom"
echo "  - @tanstack/react-query"
echo "  - axios, zustand"
echo "  - tailwindcss, TypeScript"
echo ""

npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
    echo ""
    echo "Installed packages:"
    npm list --depth=0 2>/dev/null || true
else
    echo -e "${RED}✗ Frontend installation failed${NC}"
    exit 1
fi

cd ..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ All dependencies installed successfully!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  ✓ Backend dependencies: $(cd backend && npm list 2>/dev/null | grep -c '├──\|└──' || echo 'installed')"
echo "  ✓ Frontend dependencies: $(cd frontend && npm list 2>/dev/null | grep -c '├──\|└──' || echo 'installed')"
echo ""
echo "Next steps:"
echo "  1. Install PostgreSQL (if not done): brew install postgresql@14"
echo "  2. Start PostgreSQL: brew services start postgresql@14"
echo "  3. Run complete setup: ./complete-setup.sh"
echo ""
