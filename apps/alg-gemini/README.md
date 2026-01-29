# AlgorithmLens - PRIMARY APP

> **This is the primary AlgorithmLens frontend. All new development should happen here.**

## Quick Start

```powershell
cd apps/alg-gemini
npm run dev
```

**Dashboard URL:** http://localhost:5173/dashboard

## Important Notes

- **DO NOT** edit `apps/algorithm-lens` - that is the legacy app kept for reference
- This app runs on port 5173 by default
- Backend API is in `apps/alg-gemini/backend`

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Waitlist Configuration

The AlgorithmLens waitlist form submits to `/api/subscribe`, a Vercel serverless function that proxies to Beehiiv API v2.

### Required Environment Variables

Set these in the Vercel project `algorithmlens-coming-soon-v3` for both **Production** and **Preview** environments:

- **`BEEHIIV_API_KEY`**: Your Beehiiv API key (from Beehiiv dashboard → Settings → API)
- **`BEEHIIV_PUBLICATION_ID`**: Your Beehiiv publication ID (e.g., `607214bf-384d-41dc-bc24-ac0c304c62b4`)

### Local Testing

1. Create `.env.local` in `apps/alg-gemini/` with:
   ```
   BEEHIIV_API_KEY=your_api_key_here
   BEEHIIV_PUBLICATION_ID=your_publication_id_here
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Test the API endpoint with curl:
   ```bash
   curl -X POST http://localhost:5173/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

   Expected response:
   ```json
   {"ok":true}
   ```

4. Test in browser:
   - Visit http://localhost:5173
   - Scroll to waitlist form
   - Enter an email and submit
   - Verify inline success message appears
   - Check Beehiiv dashboard for new subscriber
