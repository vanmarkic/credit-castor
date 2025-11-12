import { createContext, useContext, type ReactNode, useCallback } from 'react';
import { useUnlockState, type UnlockState } from '../hooks/useUnlockState';
import type { LockNotification } from '../hooks/useEditLock';
import toast from 'react-hot-toast';
import { SimpleNotificationToast } from '../components/shared/SimpleNotificationToast';

/**
 * Context value including the unlock state and control methods.
 */
interface UnlockContextValue extends UnlockState {
  unlock: (password: string, userEmail: string) => Promise<boolean>;
  lock: () => Promise<void>;
  forceUnlock: (password: string) => Promise<{ success: boolean; error?: string }>;
  validatePassword: (password: string) => boolean;
  isLoading: boolean;
}

const UnlockContext = createContext<UnlockContextValue | undefined>(undefined);

/**
 * Provider component that makes unlock state available to all child components.
 *
 * Usage:
 * ```tsx
 * <UnlockProvider projectId="my-project">
 *   <YourApp />
 * </UnlockProvider>
 * ```
 */
export function UnlockProvider({
  children,
  projectId = 'default',
}: {
  children: ReactNode;
  projectId?: string;
}) {
  // Handle lock notifications
  const handleNotification = useCallback((notification: LockNotification) => {
    const typeMap = {
      'lock-acquired': 'success',
      'lock-released': 'info',
      'lock-denied': 'error',
      'lock-stolen': 'error',
      'lock-error': 'error',
    } as const;

    toast.custom((t) => (
      <SimpleNotificationToast
        title={notification.type === 'lock-acquired' ? 'Déverrouillé' :
               notification.type === 'lock-released' ? 'Verrouillé' :
               notification.type === 'lock-denied' ? 'Accès refusé' :
               notification.type === 'lock-stolen' ? 'Verrou perdu' : 'Erreur'}
        message={notification.message}
        type={typeMap[notification.type]}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ));
  }, []);

  const unlockState = useUnlockState(projectId, handleNotification);

  return (
    <UnlockContext.Provider value={unlockState}>
      {children}
    </UnlockContext.Provider>
  );
}

/**
 * Hook to access the unlock state from any component.
 *
 * Must be used within an UnlockProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isUnlocked, unlock, lock } = useUnlock();
 *
 *   const handleUnlock = () => {
 *     const success = unlock('password123', 'user@example.com');
 *     if (success) {
 *       console.log('Unlocked!');
 *     }
 *   };
 *
 *   return <div>{isUnlocked ? 'Unlocked' : 'Locked'}</div>;
 * }
 * ```
 */
export function useUnlock(): UnlockContextValue {
  const context = useContext(UnlockContext);

  if (context === undefined) {
    throw new Error('useUnlock must be used within an UnlockProvider');
  }

  return context;
}
