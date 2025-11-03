import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Tailwind entry – your existing global styles (keep as-is if you already import index.css)
// If your Tailwind entry file is named differently, keep your current import instead.
import './index.css'

// Figma-scoped globals (tokens + utility scopes)
import './figma-ui/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
