#!/bin/bash

echo "Installing Polyhedron Platform..."

echo ""
echo "Installing root dependencies..."
npm install

echo ""
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database"
echo "2. Copy backend/.env.example to backend/.env and configure"
echo "3. Run database initialization: psql -U postgres -d polyhedron -f backend/database/init.sql"
echo "4. Start development: npm run dev"
echo ""
