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

# Create database and setup with proper permissions
echo "Creating database 'polyhedron' and setting up permissions..."

# Method 1: Try with current user first
if createdb polyhedron 2>/dev/null && psql -d polyhedron -f backend/database/setup.sql 2>/dev/null; then
    echo "✅ Database created successfully with current user"
else
    echo "Trying with postgres superuser..."
    # Method 2: Use postgres superuser
    sudo -u postgres createdb polyhedron 2>/dev/null || echo "Database 'polyhedron' already exists"
    sudo -u postgres psql -d polyhedron -f backend/database/setup.sql
    
    # Grant permissions to current user
    sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON DATABASE polyhedron TO $USER;"
    sudo -u postgres psql -d polyhedron -c "GRANT ALL ON SCHEMA public TO $USER;"
    sudo -u postgres psql -d polyhedron -c "GRANT CREATE ON SCHEMA public TO $USER;"
    sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $USER;"
    sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $USER;"
fi

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your PostgreSQL credentials"
echo "2. Run: npm run dev"
