@echo off
echo Setting up PostgreSQL database for Polyhedron...

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed. Please install it first:
    echo    Download from https://www.postgresql.org/download/windows/
    exit /b 1
)

echo ✅ PostgreSQL is available

REM Create database
echo Creating database 'polyhedron'...
createdb polyhedron 2>nul || echo Database 'polyhedron' already exists

REM Run initialization script
echo Initializing database schema...
psql -d polyhedron -f backend\database\init.sql

echo ✅ Database setup complete!
echo.
echo Next steps:
echo 1. Update backend\.env with your PostgreSQL credentials
echo 2. Run: npm run dev
pause
