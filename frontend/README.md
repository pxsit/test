# Polyhedron Frontend

React frontend for the Polyhedron competitive programming platform.

## Features

- User authentication (login/register)
- Problem creation and management
- LaTeX statement editor with Monaco
- File upload for generators, checkers, solutions
- Problem package export
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

The app will open at http://localhost:3000

## Components

- `Login/Register` - Authentication forms
- `ProblemsList` - List all user's problems
- `ProblemEditor` - Create/edit problems with tabs for:
  - General settings (name, title, limits)
  - Statement editor (LaTeX with Monaco)
  - File management (upload generators, checkers, etc.)
  - Test management (coming soon)

## Technologies

- React 18 with TypeScript
- React Router for navigation
- Axios for API calls
- Monaco Editor for code/LaTeX editing
- Tailwind CSS for styling
- React Hot Toast for notifications

## Usage

1. Register or login to access the platform
2. Create a new problem or edit existing ones
3. Write problem statement in LaTeX
4. Upload generator, checker, and solution files
5. Export problem package for use in contests
