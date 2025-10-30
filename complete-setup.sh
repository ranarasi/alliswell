#!/bin/bash

# AllIsWell Complete Setup Script
# Run this after Node.js and PostgreSQL are installed

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "       AllIsWell Complete Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install PostgreSQL (if Node.js locked it earlier)
echo "Step 1: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    brew install postgresql@14
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
else
    echo -e "${YELLOW}PostgreSQL already installed${NC}"
fi

# Step 2: Start PostgreSQL
echo ""
echo "Step 2: Starting PostgreSQL service..."
brew services start postgresql@14
sleep 3
echo -e "${GREEN}✓ PostgreSQL started${NC}"

# Step 3: Create database
echo ""
echo "Step 3: Creating 'alliswell' database..."
if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw alliswell; then
    psql postgres -c "CREATE DATABASE alliswell;"
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${YELLOW}Database already exists${NC}"
fi

# Step 4: Install backend dependencies
echo ""
echo "Step 4: Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Step 5: Setup backend environment
echo ""
echo "Step 5: Setting up backend environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

# Step 6: Run database migrations
echo ""
echo "Step 6: Running database migrations..."
npm run db:migrate
echo -e "${GREEN}✓ Database tables created${NC}"

# Step 7: Seed default users
echo ""
echo "Step 7: Seeding default users..."
npm run db:seed
echo -e "${GREEN}✓ Default users created${NC}"

# Step 8: Install frontend dependencies
echo ""
echo "Step 8: Installing frontend dependencies..."
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Step 9: Setup frontend environment
echo ""
echo "Step 9: Setting up frontend environment..."
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
    echo -e "${GREEN}✓ .env.local file created${NC}"
else
    echo -e "${YELLOW}.env.local file already exists${NC}"
fi

cd ..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Default Users:"
echo "  Admin:         admin@alliswell.com / admin123"
echo "  PDM:           pdm@alliswell.com / pdm123"
echo "  Practice Head: head@alliswell.com / head123"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
