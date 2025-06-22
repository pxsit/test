# Polyhedron Backend

Backend API for the Polyhedron competitive programming platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
- Install PostgreSQL
- Create a database named `polyhedron`
- Update database credentials in .env

4. Run database initialization:
```bash
psql -U postgres -d polyhedron -f database/init.sql
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Problems
- `GET /api/problems` - Get all problems for authenticated user
- `GET /api/problems/:id` - Get specific problem with details
- `POST /api/problems` - Create new problem
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem
- `POST /api/problems/:id/files` - Upload problem files
- `GET /api/problems/:id/export` - Export problem package

## File Types

Supported file types for problem files:
- `solution` - Main solution files
- `checker` - Custom checker programs
- `generator` - Test data generators
- `interactor` - Interactive problem handlers

## Templates

Template files are provided in `/templates/` directory:
- `generator.cpp/py` - Test data generator templates
- `checker.cpp/py` - Checker templates  
- `interactor.cpp` - Interactor template
- `solution.cpp/py` - Solution templates

## Export Format

Problems are exported in Polygon-compatible format with:
- `problem.xml` - Problem configuration
- Source files (generators, checkers, solutions)
- Test data files
