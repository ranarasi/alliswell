#!/bin/bash

# AllIsWell Setup Verification Script
# This script checks if all prerequisites are installed and configured

echo "═══════════════════════════════════════════════════════════════"
echo "       AllIsWell Setup Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✓ Installed${NC} ($VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}✓ Installed${NC} (v$VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓ Installed${NC} (v$VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check if PostgreSQL is running
echo -n "Checking PostgreSQL service... "
if pg_isready &> /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not running${NC}"
    echo "  Start with: brew services start postgresql@14"
fi

# Check if database exists
echo -n "Checking 'alliswell' database... "
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw alliswell; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Not created${NC}"
    echo "  Create with: psql postgres -c \"CREATE DATABASE alliswell;\""
fi

# Check backend dependencies
echo -n "Checking backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "  Install with: cd backend && npm install"
fi

# Check frontend dependencies
echo -n "Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "  Install with: cd frontend && npm install"
fi

# Check backend .env file
echo -n "Checking backend .env file... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Create with: cd backend && cp .env.example .env"
fi

# Check frontend .env file
echo -n "Checking frontend .env.local file... "
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Create with: echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > frontend/.env.local"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Summary
echo "Next steps:"
echo "1. Complete any missing installations above"
echo "2. Run: cd backend && npm run db:migrate"
echo "3. Run: cd backend && npm run db:seed"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo "6. Open http://localhost:3000"
echo ""
