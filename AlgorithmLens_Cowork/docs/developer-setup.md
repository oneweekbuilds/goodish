# Developer Setup Guide (#36)

This guide covers the recommended setup for AlgorithmLens frontend development.

## Prerequisites

- Node.js 20+
- npm 10+
- Git
- A code editor (VS Code recommended)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AlgorithmLens_Cowork
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## Development

### Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Start both frontend and backend:
```bash
npm run dev:full
```

This runs the frontend on port 5173 and backend on port 8000.

## Pre-Commit Checks

Before committing your changes, run linting on modified files:

```bash
npm run lint:changed
```

This runs ESLint only on files you've changed, providing faster feedback.

For a full lint of the entire codebase:

```bash
npm run lint:all
```

## Running Tests

### Smoke tests (E2E dashboard tests):
```bash
npm run test:smoke
```

### Run tests in UI mode:
```bash
npm run test:smoke:ui
```

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Code Quality Standards

1. **Linting**: Always pass `npm run lint:changed` before committing
2. **Types**: Use JSDoc comments for .jsx files and import TypeScript types from src/types/
3. **Testing**: Ensure E2E smoke tests pass
4. **Accessibility**: Test with keyboard navigation and screen readers
5. **Performance**: Use React DevTools profiler to check render times

## Common Tasks

### Add a new dependency:
```bash
npm install <package-name>
npm run lint:all  # Check for any lint issues
```

### Update dependencies:
```bash
npm update
```

### Set up environment variables:
```bash
npm run env:setup
npm run env:verify
```

## Git Workflow

1. Create a feature branch: `git checkout -b feature/description`
2. Make changes and commit: `git add <files> && git commit -m "message"`
3. Run linting on changed files: `npm run lint:changed`
4. Push and create a pull request
5. Ensure CI/CD pipeline passes

## Troubleshooting

### Port 5173 already in use:
```bash
npm run dev -- --port 3000
```

### Dependencies installation fails:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend API not responding:
- Ensure backend is running on port 8000
- Check `VITE_ALG_API_BASE_URL` in .env.local
- Verify database connection in backend

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [ESLint Documentation](https://eslint.org/)
