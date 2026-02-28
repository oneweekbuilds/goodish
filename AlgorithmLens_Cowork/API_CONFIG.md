# API Configuration

## Backend URL Configuration

The AlgorithmLens frontend uses a configurable API base URL to connect to the backend.

### Environment Variable

Set `VITE_ALG_API_BASE_URL` in your `.env` or `.env.local` file:

```bash
# Example: Using a remote backend
VITE_ALG_API_BASE_URL=https://api.algorithmlens.com

# Example: Using local backend on a different port
VITE_ALG_API_BASE_URL=http://localhost:3001
```

### Default Behavior

- **Development** (`npm run dev`): Defaults to `http://127.0.0.1:8000` if the env var is not set
- **Production** (`npm run build`): Uses relative paths (`/api`) if the env var is not set

### Starting the Backend

If you're developing locally, start the backend server:

```bash
cd apps/alg-gemini/backend
python -m uvicorn app:app --reload --port 8000
```

The frontend will automatically connect to the backend at the configured URL.

### Demo Mode

To use demo mode (no backend required):

```
http://localhost:5174/dashboard?demo=1
```

Demo mode bypasses all API calls and uses generated sample data.

### Troubleshooting

If the dashboard shows "No scans yet" but you have scans:
1. Check that the backend is running
2. Verify the API URL is correct (check browser console for network errors)
3. Ensure CORS is configured to allow your frontend origin

### Configuration Files

- `src/lib/apiConfig.js` - Single source of truth for API base URL
- `src/lib/dashboard/useDashboardData.js` - Dashboard data fetching hook
