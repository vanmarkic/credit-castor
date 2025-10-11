import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import EnDivisionCorrect from './index';
import PasswordGate from './src/components/PasswordGate';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem('authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  return <EnDivisionCorrect />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
