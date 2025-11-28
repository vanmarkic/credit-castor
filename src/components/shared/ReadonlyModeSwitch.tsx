import { Eye, Edit3 } from 'lucide-react';
import { useUnlock } from '../../contexts/UnlockContext';

/**
 * Toggle switch for readonly mode.
 * When ON (readonly), all fields are disabled.
 * When OFF (edit mode), fields follow normal permission rules.
 */
export function ReadonlyModeSwitch() {
  const { isReadonlyMode, setReadonlyMode } = useUnlock();

  const handleToggle = () => {
    if (isReadonlyMode) {
      // Switching from readonly to edit mode - show confirmation
      const confirmed = window.confirm(
        'Voulez-vous activer le mode édition ?\n\nCela permettra de modifier les données.'
      );
      if (confirmed) {
        setReadonlyMode(false);
      }
    } else {
      // Switching from edit to readonly - no confirmation needed
      setReadonlyMode(true);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
        ${isReadonlyMode
          ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
        }
      `}
      title={
        isReadonlyMode
          ? 'Mode lecture seule - Cliquez pour activer le mode édition'
          : 'Mode édition actif - Cliquez pour activer le mode lecture seule'
      }
    >
      {isReadonlyMode ? (
        <>
          <Eye className="w-4 h-4" />
          <span>Lecture seule</span>
        </>
      ) : (
        <>
          <Edit3 className="w-4 h-4" />
          <span>Mode édition</span>
        </>
      )}
    </button>
  );
}
