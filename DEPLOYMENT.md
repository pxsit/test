# Polyhedron Platform Deployment Guide

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Python 3.8+ (for Python generators/solutions)
- g++ compiler (for C++ generators/solutions)

## Server Deployment Steps

### 1. Database Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database user
sudo -u postgres createuser --interactive polyhedron

# Create database
sudo -u postgres createdb polyhedron

# Grant privileges
sudo -u postgres psql -c "ALTER USER polyhedron WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE polyhedron TO polyhedron;"
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=polyhedron
# DB_USER=polyhedron
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret_here

# Initialize database schema
psql -h localhost -U polyhedron -d polyhedron -f database/init.sql

# Build the project
npm run build

# Start the server
npm start
# Or for development:
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env:
# REACT_APP_API_URL=http://your-server:5000/api

# Build for production
npm run build

# Serve using nginx or serve
npm install -g serve
serve -s build -l 3000
```

### 4. Test Generation Requirements

Make sure these tools are available on your server:

```bash
# For C++ generators/solutions
sudo apt install build-essential g++

# For Python generators/solutions
sudo apt install python3 python3-pip

# Test installations
g++ --version
python3 --version
```

## Key Fixes Applied

1. **Database Field Mapping**: Fixed camelCase/snake_case conversion for file fields
2. **File Query Fix**: Changed `filename` to `file_name` in database queries
3. **Error Handling**: Added comprehensive error logging for debugging
4. **Compiler Detection**: Added checks for g++ and Python availability

## Common Issues and Solutions

### Issue: "Generator file not found"
- Check that files are uploaded with correct `fileType` value
- Verify file names match exactly in database

### Issue: "Failed to compile generator"
- Ensure g++ is installed and accessible
- Check file permissions on uploaded files

### Issue: "Python not found"
- Install Python 3 and ensure it's in PATH
- Script tries both `python` and `python3` commands

### Issue: Database connection errors
- Verify PostgreSQL is running
- Check credentials in .env file
- Ensure database and user exist

## Testing the Platform

1. **Register a user account**
2. **Create a new problem**
3. **Upload a Python generator** (easier to test than C++)
4. **Upload a Python solution**
5. **Go to Tests tab and generate test cases**

## Example Test Files

### Python Generator (generator.py):
```python
#!/usr/bin/env python3
import sys
import random

def main():
    if len(sys.argv) != 2:
        print("Usage: python generator.py <test_number>")
        sys.exit(1)
    
    test_number = int(sys.argv[1])
    random.seed(test_number)
    
    # Generate two random integers
    a = random.randint(1, 100)
    b = random.randint(1, 100)
    
    print(f"{a} {b}")

if __name__ == "__main__":
    main()
```

### Python Solution (solution.py):
```python
#!/usr/bin/env python3

def main():
    line = input().strip()
    a, b = map(int, line.split())
    print(a + b)

if __name__ == "__main__":
    main()
```

## Production Considerations

1. **Security**: Implement sandboxing for code execution
2. **File Storage**: Use cloud storage for uploaded files
3. **Rate Limiting**: Add rate limits for test generation
4. **Resource Limits**: Set memory/time limits for code execution
5. **Logging**: Implement comprehensive logging and monitoring
