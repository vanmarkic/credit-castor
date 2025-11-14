/**
 * EditLockBanner Component
 *
 * Displays a banner when another user is currently editing the project
 * Shows inline near the unlock button
 */

import { useState } from 'react';
import { AlertTriangle, X, Unlock } from 'lucide-react';
import type { EditLock } from '../../services/editLockService';

interface EditLockBannerProps {
  /** Lock details (if someone else is editing) */
  lock: EditLock | null;

  /** Whether the lock is owned by the current user */
  isOwnLock: boolean;

  /** Callback to force release the lock (admin only) */
  onForceUnlock?: (password: string, email: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Banner to show when another user is editing
 */
export function EditLockBanner({ lock, isOwnLock, onForceUnlock }: EditLockBannerProps) {
  const [showForceUnlockDialog, setShowForceUnlockDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show banner if no lock or if it's our own lock
  if (!lock || isOwnLock) {
    return null;
  }

  const handleForceUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onForceUnlock) {
      return;
    }

    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    if (!password.trim()) {
      setError('Veuillez entrer le mot de passe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onForceUnlock(password, email);

      if (result.success) {
        setShowForceUnlockDialog(false);
        setPassword('');
        setEmail('');
        setError(null);
      } else {
        setError(result.error || 'Mot de passe incorrect');
      }
    } catch (_err) {
      setError('Erreur lors du déverrouillage forcé');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the last activity time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return 'à l\'instant';
    } else if (minutes < 60) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        {/* Warning Icon */}
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />

        {/* Message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900">
            <span className="font-semibold">{lock.userEmail}</span> est en train de modifier le projet
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Actif {formatTime(lock.lastHeartbeat)} • Expire dans {Math.max(0, Math.floor((lock.expiresAt.getTime() - Date.now()) / 60000))} min
          </p>
        </div>

        {/* Force Unlock Button (Admin) */}
        {onForceUnlock && (
          <button
            onClick={() => setShowForceUnlockDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded-md transition-colors"
            title="Déverrouillage forcé (Admin)"
          >
            <Unlock className="w-4 h-4" />
            Forcer le déverrouillage
          </button>
        )}
      </div>

      {/* Force Unlock Dialog */}
      {showForceUnlockDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Déverrouillage forcé (Admin)
              </h2>
              <button
                onClick={() => {
                  setShowForceUnlockDialog(false);
                  setPassword('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleForceUnlock} className="p-6">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                  <p className="font-medium">⚠️ Action Administrative</p>
                  <p className="mt-1">
                    Cette action forcera le déverrouillage et permettra de prendre le contrôle de l'édition.
                    L'utilisateur <strong>{lock.userEmail}</strong> sera déconnecté.
                  </p>
                </div>

                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Votre email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="votre-email@exemple.com"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe administrateur
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForceUnlockDialog(false);
                    setPassword('');
                    setEmail('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Déverrouillage...' : 'Forcer le déverrouillage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
