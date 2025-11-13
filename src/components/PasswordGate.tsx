import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  onUnlock: () => void;
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple password check - can be changed in environment variable
    const correctPassword = import.meta.env.PUBLIC_APP_PASSWORD || 'castor2025';

    if (password === correctPassword) {
      setError(false);
      // Store in localStorage so it persists across sessions
      localStorage.setItem('authenticated', 'true');
      onUnlock();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Achat en Division
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Entrez le mot de passe pour accéder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                error
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Entrez le mot de passe"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                Mot de passe incorrect. Veuillez réessayer.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Accéder
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Cette page est protégée pour éviter l'indexation par les moteurs de recherche
          </p>
        </div>
      </div>
    </div>
  );
}
