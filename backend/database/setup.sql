-- Database setup with proper permissions
-- This script should be run as the postgres superuser

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE polyhedron' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'polyhedron')\gexec

-- Connect to the database
\c polyhedron

-- Grant privileges to current user or create a user
DO $$
BEGIN
    -- Try to create user if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = current_user) THEN
        EXECUTE format('CREATE USER %I', current_user);
    END IF;
    
    -- Grant necessary privileges
    EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE polyhedron TO %I', current_user);
    EXECUTE format('GRANT ALL ON SCHEMA public TO %I', current_user);
    EXECUTE format('GRANT CREATE ON SCHEMA public TO %I', current_user);
END
$$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    statement_latex TEXT,
    time_limit INTEGER DEFAULT 1000,
    memory_limit INTEGER DEFAULT 256,
    input_format TEXT,
    output_format TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_groups table
CREATE TABLE IF NOT EXISTS test_groups (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES test_groups(id) ON DELETE CASCADE,
    input_file VARCHAR(255),
    output_file VARCHAR(255),
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create problem_files table
CREATE TABLE IF NOT EXISTS problem_files (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL, -- 'generator', 'checker', 'interactor', 'solution'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problems_author_id ON problems(author_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_problem_id ON test_groups(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_group_id ON test_cases(group_id);
CREATE INDEX IF NOT EXISTS idx_problem_files_problem_id ON problem_files(problem_id);

-- Grant permissions on all tables to current user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;
