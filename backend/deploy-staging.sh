#!/bin/bash

# AllIsWell Staging Deployment Script
# This script handles complete staging database setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "$1"
    echo "════════════════════════════════════════════════════════"
    echo ""
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo ""
        echo "Please create a .env file with:"
        echo "  DATABASE_URL=postgresql://user:pass@host:port/dbname"
        echo "  JWT_SECRET=your-secret"
        echo "  PORT=3001"
        exit 1
    fi
    print_success ".env file found"
}

# Check if node_modules exists
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Show menu
show_menu() {
    print_header "AllIsWell Staging Deployment"
    echo "Select deployment option:"
    echo ""
    echo "  1) Full Deployment (migrations + data seeding)"
    echo "     └─ Recommended for fresh staging environment"
    echo ""
    echo "  2) Migrations Only (no data)"
    echo "     └─ Just set up database schema"
    echo ""
    echo "  3) Reset Database (⚠️  DESTRUCTIVE)"
    echo "     └─ Drop all tables and start fresh"
    echo ""
    echo "  4) Reset + Full Deployment"
    echo "     └─ Clean slate with full data"
    echo ""
    echo "  5) Seed Data Only"
    echo "     └─ Add users and projects (requires existing schema)"
    echo ""
    echo "  6) Exit"
    echo ""
}

# Full deployment
full_deployment() {
    print_header "Running Full Deployment"
    print_info "This will run migrations and seed all data..."
    npm run db:deploy-staging
    print_success "Full deployment completed!"
}

# Migrations only
migrations_only() {
    print_header "Running Migrations Only"
    print_info "Setting up database schema..."
    npm run db:migrate-all
    print_success "Migrations completed!"
    echo ""
    print_info "To seed data, run: npm run db:seed-real"
}

# Reset database
reset_database() {
    print_header "⚠️  DATABASE RESET"
    print_warning "This will DELETE ALL DATA from the database!"
    echo ""
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" = "yes" ]; then
        print_info "Resetting database..."
        npm run db:reset
        print_success "Database reset completed!"
    else
        print_info "Reset cancelled"
    fi
}

# Reset and deploy
reset_and_deploy() {
    print_header "⚠️  RESET + FULL DEPLOYMENT"
    print_warning "This will DELETE ALL DATA and redeploy everything!"
    echo ""
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" = "yes" ]; then
        print_info "Resetting database..."
        npm run db:reset
        print_success "Database reset completed!"
        echo ""
        print_info "Running full deployment..."
        npm run db:deploy-staging
        print_success "Full deployment completed!"
    else
        print_info "Operation cancelled"
    fi
}

# Seed data only
seed_data() {
    print_header "Seeding Data"
    echo "Choose seeding option:"
    echo "  1) Real data from CSV"
    echo "  2) Test users only"
    echo ""
    read -p "Enter choice (1-2): " seed_choice
    case $seed_choice in
        1)
            print_info "Seeding real data from CSV..."
            npm run db:seed-real
            print_success "Real data seeded!"
            ;;
        2)
            print_info "Seeding test users..."
            npm run db:seed
            print_success "Test users seeded!"
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Main script
main() {
    # Change to script directory
    cd "$(dirname "$0")"

    # Check prerequisites
    check_env
    check_dependencies

    # Show menu and get choice
    while true; do
        show_menu
        read -p "Enter choice (1-6): " choice
        echo ""

        case $choice in
            1)
                full_deployment
                break
                ;;
            2)
                migrations_only
                break
                ;;
            3)
                reset_database
                break
                ;;
            4)
                reset_and_deploy
                break
                ;;
            5)
                seed_data
                break
                ;;
            6)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter 1-6"
                echo ""
                ;;
        esac
    done

    echo ""
    print_header "Deployment Complete!"
    print_info "Check the output above for login credentials"
    echo ""
}

# Run main script
main
