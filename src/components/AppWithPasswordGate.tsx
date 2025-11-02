import { useState, useEffect } from 'react';
import EnDivisionCorrect from './EnDivisionCorrect';
import PasswordGate from './PasswordGate';

export default function AppWithPasswordGate() {
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
