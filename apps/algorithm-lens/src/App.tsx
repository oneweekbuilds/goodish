import { useState } from 'react';
import { Home } from './routes/Home';
import { Dashboard } from './routes/Dashboard';
import { Demo } from './routes/Demo';
import { Header } from './components/layout/Header';

type Route = 'home' | 'dashboard' | 'demo' | 'about';

function App() {
  const [route, setRoute] = useState<Route>('home');
  const [toastMessage, setToastMessage] = useState<{msg: string; type: 'success' | 'error' | 'info'} | null>(null);

  const handleToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGetStarted = () => {
    setRoute('dashboard');
  };

  const handleSamples = () => {
    setRoute('dashboard');
  };

  const handleNavigate = (newRoute: 'home' | 'dashboard' | 'about' | 'demo') => {
    if (newRoute === 'about') {
      // About page not implemented yet, redirect to home
      setRoute('home');
    } else {
      setRoute(newRoute as Route);
    }
  };

  try {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FEFCF4' }}>
        <Header 
          currentRoute={route} 
          onNavigate={handleNavigate}
          onTrySample={handleSamples}
        />
        
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 50,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: toastMessage.type === 'success' ? '#10b981' :
                             toastMessage.type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white'
          }}>
            {toastMessage.msg}
          </div>
        )}
        
        {route === 'home' && (
          <Home onGetStarted={handleGetStarted} onSamples={handleSamples} />
        )}
        
        {route === 'dashboard' && (
          <Dashboard onToast={handleToast} />
        )}
        
        {route === 'demo' && (
          <Demo />
        )}
      </div>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Error loading app</h1>
        <p>{String(error)}</p>
        <pre>{error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }
}

export default App;

