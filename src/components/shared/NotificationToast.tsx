import { Users, FileEdit, X, RefreshCw, GitMerge } from 'lucide-react';
import type { ChangeEvent } from '../../hooks/useChangeNotifications';
import type { ActiveUser } from '../../hooks/usePresenceDetection';

/**
 * Props for ChangeNotificationToast
 */
interface ChangeNotificationToastProps {
  /** The change event to display */
  change: ChangeEvent;
  /** Callback when user clicks "Recharger" (reload) */
  onReload: () => void;
  /** Callback when user clicks "Fusionner" (merge) */
  onMerge?: () => void;
  /** Callback when user clicks "Ignorer" (dismiss) */
  onDismiss: () => void;
}

/**
 * Toast notification for data changes from other tabs.
 *
 * Displays French messages with action buttons:
 * - Recharger: Reload data from localStorage
 * - Fusionner: Merge changes (Phase 3 feature)
 * - Ignorer: Dismiss notification
 */
export function ChangeNotificationToast({
  change,
  onReload,
  onMerge,
  onDismiss,
}: ChangeNotificationToastProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-4 max-w-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <FileEdit className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Données modifiées
          </h3>
          <p className="text-sm text-gray-600 mt-1">{change.description}</p>
          {change.changedBy && (
            <p className="text-xs text-gray-500 mt-1">
              Par {change.changedBy}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onReload}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recharger
        </button>

        {onMerge && (
          <button
            onClick={onMerge}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
          >
            <GitMerge className="w-4 h-4" />
            Fusionner
          </button>
        )}

        <button
          onClick={onDismiss}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}

/**
 * Props for PresenceNotificationToast
 */
interface PresenceNotificationToastProps {
  /** The active user who joined/left */
  user: ActiveUser;
  /** Whether this is a join or leave event */
  action: 'joined' | 'left';
  /** Callback when user clicks dismiss */
  onDismiss: () => void;
}

/**
 * Toast notification for user presence (join/leave).
 *
 * Shows when another user opens the app in a different tab.
 */
export function PresenceNotificationToast({
  user,
  action,
  onDismiss,
}: PresenceNotificationToastProps) {
  const isJoin = action === 'joined';

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border p-4 max-w-md ${
        isJoin ? 'border-green-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isJoin ? 'bg-green-100' : 'bg-gray-100'
          }`}
        >
          <Users
            className={`w-5 h-5 ${isJoin ? 'text-green-600' : 'text-gray-600'}`}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {isJoin ? 'Utilisateur actif' : 'Utilisateur parti'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {user.email} {isJoin ? 'a ouvert' : 'a fermé'} l'application
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Props for SimpleNotificationToast
 */
interface SimpleNotificationToastProps {
  /** Toast title */
  title: string;
  /** Toast message */
  message: string;
  /** Toast type (affects styling) */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Callback when user clicks dismiss */
  onDismiss: () => void;
}

/**
 * Simple notification toast for general messages.
 */
export function SimpleNotificationToast({
  title,
  message,
  type = 'info',
  onDismiss,
}: SimpleNotificationToastProps) {
  const colors = {
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  };

  const iconColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 max-w-md ${colors[type]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${iconColors[type]}`}>{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
