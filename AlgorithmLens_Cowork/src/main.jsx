import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProfileProvider } from './context/UserProfileContext.jsx'
import { HelmetProvider } from 'react-helmet-async'
import { initSentry } from './lib/sentry.js'

// Initialize Sentry before React renders so it captures all errors from startup
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <UserProfileProvider>
          <App />
        </UserProfileProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
