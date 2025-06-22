#!/bin/bash

echo "Fixing PostgreSQL permissions for Polyhedron..."

# Grant permissions to current user
echo "Granting permissions to user: $USER"

sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON DATABASE polyhedron TO $USER;"
sudo -u postgres psql -d polyhedron -c "GRANT ALL ON SCHEMA public TO $USER;"
sudo -u postgres psql -d polyhedron -c "GRANT CREATE ON SCHEMA public TO $USER;"
sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $USER;"
sudo -u postgres psql -d polyhedron -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $USER;"

# Test the connection
echo "Testing database connection..."
if psql -d polyhedron -c "SELECT 'Connection successful!' as status;" > /dev/null 2>&1; then
    echo "✅ Database permissions fixed successfully!"
    echo "You can now restart the server: npm run dev"
else
    echo "❌ Still having permission issues. You may need to:"
    echo "1. Create a PostgreSQL user: sudo -u postgres createuser -s $USER"
    echo "2. Or run the full setup script: ./setup-db.sh"
fi
