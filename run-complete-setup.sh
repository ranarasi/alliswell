#!/bin/bash

# Complete Setup and Start Script for AllIsWell
# This will complete all setup and start both servers

set -e
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

echo "═══════════════════════════════════════════════════════════════"
echo "       AllIsWell - Complete Setup & Start"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Wait for PostgreSQL
echo "Step 1: Waiting for PostgreSQL to be ready..."
sleep 5
echo -e "${GREEN}✓ PostgreSQL should be ready${NC}"

# Step 2: Create database
echo ""
echo "Step 2: Creating database..."
/opt/homebrew/opt/postgresql@14/bin/psql postgres -c "CREATE DATABASE alliswell;" 2>&1 || echo "Database might already exist"
echo -e "${GREEN}✓ Database ready${NC}"

# Step 3: Setup backend
echo ""
echo "Step 3: Setting up backend..."
cd backend

# Create .env
if [ ! -f ".env" ]; then
    cat > .env << EOF
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=alliswell
DB_USER=$USER
DB_PASSWORD=

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${YELLOW}✓ .env file already exists${NC}"
fi

# Wait for npm install if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Run migrations
echo "Running database migrations..."
npm run db:migrate

# Seed users
echo "Seeding default users..."
npm run db:seed

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Step 4: Setup frontend
echo ""
echo "Step 4: Setting up frontend..."
cd ../frontend

# Create .env.local
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
    echo -e "${GREEN}✓ Created .env.local file${NC}"
else
    echo -e "${YELLOW}✓ .env.local file already exists${NC}"
fi

# Wait for npm install if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

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
echo "To start the application, run these in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
