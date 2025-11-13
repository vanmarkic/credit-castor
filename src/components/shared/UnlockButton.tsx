import { useState } from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import { useUnlock } from '../../contexts/UnlockContext';

/**
 * Password prompt dialog for admin unlock.
 */
function PasswordPromptDialog({
  onSubmit,
  onCancel,
}: {
  onSubmit: (password: string, email: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    if (!password.trim()) {
      setError('Veuillez entrer le mot de passe');
      return;
    }

    onSubmit(password, email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Déverrouiller les champs collectifs
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Votre email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre-email@exemple.com"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe administrateur
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
              <p>
                Le déverrouillage permet de modifier les paramètres collectifs du projet
                (prix d'achat, frais généraux, formule de portage, etc.).
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Déverrouiller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Button to lock/unlock collective fields with admin password.
 *
 * Usage:
 * ```tsx
 * import { UnlockButton } from './components/shared/UnlockButton';
 *
 * function App() {
 *   return (
 *     <UnlockProvider>
 *       <UnlockButton />
 *       <YourApp />
 *     </UnlockProvider>
 *   );
 * }
 * ```
 */
export function UnlockButton() {
  const {
    isUnlocked,
    unlockedBy,
    unlockedAt,
    unlock,
    lock,
  } = useUnlock();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlockAttempt = async (password: string, email: string) => {
    const success = await unlock(password, email);

    if (success) {
      setShowPasswordPrompt(false);
      setError(null);
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handleLock = async () => {
    await lock();
    setError(null);
  };

  const handleToggle = () => {
    if (isUnlocked) {
      handleLock();
    } else {
      setShowPasswordPrompt(true);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
          ${isUnlocked
            ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }
        `}
        title={
          isUnlocked
            ? `Déverrouillé par ${unlockedBy} le ${unlockedAt?.toLocaleString('fr-BE')}`
            : 'Cliquez pour déverrouiller les champs collectifs'
        }
      >
        {isUnlocked ? (
          <>
            <Unlock className="w-4 h-4" />
            <span>Verrouiller</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Déverrouiller</span>
          </>
        )}
      </button>

      {showPasswordPrompt && (
        <PasswordPromptDialog
          onSubmit={(password, email) => {
            handleUnlockAttempt(password, email);
          }}
          onCancel={() => {
            setShowPasswordPrompt(false);
            setError(null);
          }}
        />
      )}

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </>
  );
}
