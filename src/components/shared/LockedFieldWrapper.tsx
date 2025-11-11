import { Lock } from 'lucide-react';
import { cloneElement, type ReactElement } from 'react';
import { useFieldPermissions } from '../../hooks/useFieldPermissions';

interface LockedFieldWrapperProps {
  /** Field path (e.g., 'projectParams.totalPurchase', 'participants.0.capitalApporte') */
  fieldPath: string;

  /** The input element to wrap */
  children: ReactElement;

  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Wraps an input field and applies visual feedback when locked.
 *
 * Features:
 * - Grays out locked fields
 * - Shows lock icon
 * - Displays tooltip with lock reason
 * - Disables interaction with locked fields
 *
 * @example
 * ```tsx
 * <LockedFieldWrapper fieldPath="projectParams.totalPurchase">
 *   <input
 *     type="number"
 *     value={totalPurchase}
 *     onChange={(e) => setTotalPurchase(Number(e.target.value))}
 *   />
 * </LockedFieldWrapper>
 * ```
 */
export function LockedFieldWrapper({
  fieldPath,
  children,
  className = '',
}: LockedFieldWrapperProps) {
  const { canEdit, isLocked, lockReason } = useFieldPermissions(fieldPath);

  // Clone the child element and inject the disabled prop if locked
  const childWithProps = canEdit
    ? children
    : cloneElement(children, {
        disabled: true,
        readOnly: true,
      } as Partial<typeof children.props>);

  return (
    <div
      className={`
        relative
        ${isLocked ? 'opacity-60 pointer-events-none' : ''}
        ${className}
      `}
      title={lockReason || undefined}
    >
      {/* The input field */}
      <div className={isLocked ? 'bg-gray-50 rounded' : ''}>
        {childWithProps}
      </div>

      {/* Lock icon */}
      {isLocked && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Optional tooltip */}
      {isLocked && lockReason && (
        <div className="sr-only">
          {lockReason}
        </div>
      )}
    </div>
  );
}

/**
 * Simpler variant that just disables the child without wrapper styling.
 * Useful when you already have your own container styling.
 *
 * @example
 * ```tsx
 * <DisabledIfLocked fieldPath="projectParams.totalPurchase">
 *   <input type="number" value={totalPurchase} />
 * </DisabledIfLocked>
 * ```
 */
export function DisabledIfLocked({
  fieldPath,
  children,
}: {
  fieldPath: string;
  children: ReactElement;
}) {
  const { canEdit } = useFieldPermissions(fieldPath);

  if (canEdit) {
    return children;
  }

  // Clone and inject disabled prop
  return cloneElement(children, {
    disabled: true,
    readOnly: true,
  } as Partial<typeof children.props>);
}
