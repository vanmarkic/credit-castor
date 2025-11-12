import { useState, useEffect } from 'react';
import EnDivisionCorrect from './EnDivisionCorrect';
import PasswordGate from './PasswordGate';
import { UnlockProvider } from '../contexts/UnlockContext';
import { CalculatorProvider } from './calculator/CalculatorProvider';

export default function AppWithPasswordGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const authenticated = localStorage.getItem('authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <UnlockProvider>
      <CalculatorProvider>
        <EnDivisionCorrect />
      </CalculatorProvider>
    </UnlockProvider>
  );
}
