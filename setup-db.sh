#!/bin/bash

echo "Setting up PostgreSQL database for Polyhedron..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start it:"
    echo "   Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   macOS: brew services start postgresql"
    echo "   Windows: Start PostgreSQL service"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database
echo "Creating database 'polyhedron'..."
createdb polyhedron 2>/dev/null || echo "Database 'polyhedron' already exists"

# Run initialization script
echo "Initializing database schema..."
sudo -u postgres psql -d polyhedron -f backend/database/init.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your PostgreSQL credentials"
echo "2. Run: npm run dev"
