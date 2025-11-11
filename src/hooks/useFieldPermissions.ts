import { useMemo } from 'react';
import { useUnlock } from '../contexts/UnlockContext';
import {
  isFieldEditable,
  getLockReason,
  isCollectiveField,
  isIndividualField,
} from '../utils/fieldPermissions';

/**
 * Hook to check field permissions based on unlock state.
 *
 * @example
 * ```tsx
 * function MyInput({ participantIndex }: Props) {
 *   const { canEdit, lockReason, isLocked } = useFieldPermissions(
 *     `participants.${participantIndex}.capitalApporte`
 *   );
 *
 *   return (
 *     <div>
 *       <input disabled={!canEdit} />
 *       {lockReason && <p>{lockReason}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldPermissions(fieldPath: string) {
  const { isUnlocked } = useUnlock();

  const canEdit = useMemo(
    () => isFieldEditable(fieldPath, isUnlocked),
    [fieldPath, isUnlocked]
  );

  const lockReason = useMemo(
    () => getLockReason(fieldPath, isUnlocked),
    [fieldPath, isUnlocked]
  );

  const isCollective = useMemo(
    () => isCollectiveField(fieldPath),
    [fieldPath]
  );

  const isIndividual = useMemo(
    () => isIndividualField(fieldPath),
    [fieldPath]
  );

  const isLocked = useMemo(
    () => isCollective && !isUnlocked,
    [isCollective, isUnlocked]
  );

  return {
    /** Whether the field can be edited */
    canEdit,

    /** Human-readable reason why the field is locked (null if not locked) */
    lockReason,

    /** Whether this field is categorized as collective */
    isCollective,

    /** Whether this field is categorized as individual */
    isIndividual,

    /** Whether this field is currently locked */
    isLocked,
  };
}

/**
 * Hook variant for participant-specific fields.
 *
 * @example
 * ```tsx
 * function ParticipantInput({ index }: Props) {
 *   const { canEdit, isLocked } = useParticipantFieldPermissions(
 *     'capitalApporte',
 *     index
 *   );
 *
 *   return <input disabled={!canEdit} />;
 * }
 * ```
 */
export function useParticipantFieldPermissions(
  fieldName: string,
  participantIndex: number
) {
  const fieldPath = `participants.${participantIndex}.${fieldName}`;
  return useFieldPermissions(fieldPath);
}

/**
 * Hook variant for project parameter fields.
 *
 * @example
 * ```tsx
 * function ProjectInput() {
 *   const { canEdit, isLocked } = useProjectParamPermissions('totalPurchase');
 *
 *   return <input disabled={!canEdit} />;
 * }
 * ```
 */
export function useProjectParamPermissions(fieldName: string) {
  const fieldPath = `projectParams.${fieldName}`;
  return useFieldPermissions(fieldPath);
}

/**
 * Hook variant for portage formula fields.
 *
 * @example
 * ```tsx
 * function PortageInput() {
 *   const { canEdit, isLocked } = usePortageFormulaPermissions('indexationRate');
 *
 *   return <input disabled={!canEdit} />;
 * }
 * ```
 */
export function usePortageFormulaPermissions(fieldName: string) {
  const fieldPath = `portageFormula.${fieldName}`;
  return useFieldPermissions(fieldPath);
}
