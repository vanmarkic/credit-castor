import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import type { Participant } from '../../utils/calculatorUtils';
import { getDateEntriesFromTimeline } from './draggableRenovationDateUtils';

interface DraggableRenovationDateCardProps {
  renovationStartDate: string;
  deedDate: string;
  participants: Participant[];
  onDateChange: (date: string) => void;
  canEdit: boolean;
  isLocked: boolean;
  lockReason?: string;
}

export const DraggableRenovationDateCard: React.FC<DraggableRenovationDateCardProps> = ({
  renovationStartDate,
  deedDate,
  participants,
  onDateChange,
  canEdit,
  isLocked,
  lockReason,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartCardY, setDragStartCardY] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Find timeline container
  useEffect(() => {
    const findContainer = () => {
      if (cardRef.current) {
        const container = cardRef.current.closest('[data-timeline-container]') as HTMLElement;
        if (container) {
          timelineContainerRef.current = container;
        }
      }
    };
    
    findContainer();
    const timeout = setTimeout(findContainer, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked || !canEdit) return;
      e.preventDefault();
      setIsDragging(true);
      // Store the offset from mouse click to card top, and card's initial DOM position
      if (cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const container = cardRef.current.closest('[data-timeline-container]') as HTMLElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          // Offset from mouse click to card top
          const offsetY = e.clientY - cardRect.top;
          // Card's initial position relative to container (before any transform)
          const initialCardY = cardRect.top - containerRect.top;
          setDragStartY(e.clientY);
          setDragStartCardY(initialCardY);
          // Store offset separately
          (cardRef.current as any)._dragOffsetY = offsetY;
        }
      }
    },
    [isLocked, canEdit]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isLocked || !canEdit) return;
      // Update visual position during drag
      if (cardRef.current && dragStartY !== null && dragStartCardY !== null) {
        const container = cardRef.current.closest('[data-timeline-container]') as HTMLElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const offsetY = (cardRef.current as any)._dragOffsetY || 0;
          // Calculate where card top should be: mouse Y minus the click offset
          const targetCardTop = e.clientY - offsetY;
          // Calculate transform: target position minus initial DOM position
          const newY = targetCardTop - containerRect.top - dragStartCardY;
          cardRef.current.style.transform = `translateY(${newY}px)`;
        }
      }
    },
    [isDragging, isLocked, canEdit, dragStartY, dragStartCardY]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isLocked || !canEdit) return;
      
      setIsDragging(false);
      setDragStartY(null);
      setDragStartCardY(null);

      // Reset transform and clear stored offset
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        delete (cardRef.current as any)._dragOffsetY;
      }

      // Find which date group the mouse is dropped after (use mouse position, not card position)
      if (timelineContainerRef.current) {
        const dateEntries = getDateEntriesFromTimeline(
          timelineContainerRef.current,
          participants,
          deedDate
        );

        if (dateEntries.length > 0) {
          const containerRect = timelineContainerRef.current.getBoundingClientRect();
          const mouseY = e.clientY;
          const relativeY = mouseY - containerRect.top;

          let targetDate = deedDate;
          
          // Find which date group we're after (check from bottom to top)
          // We want to find the last group that the mouse is positioned after
          for (let i = dateEntries.length - 1; i >= 0; i--) {
            const entry = dateEntries[i];
            // If mouse Y is after this entry's bottom, we're after this group
            if (relativeY >= entry.bottom) {
              // Set date to this entry's date + 1 day
              const entryDate = new Date(entry.date);
              entryDate.setDate(entryDate.getDate() + 1);
              targetDate = entryDate.toISOString().split('T')[0];
              break;
            }
          }

          // If before first entry, use deedDate + 1 day
          if (relativeY < dateEntries[0].top) {
            const deedDateObj = new Date(deedDate);
            deedDateObj.setDate(deedDateObj.getDate() + 1);
            targetDate = deedDateObj.toISOString().split('T')[0];
          }

          // Ensure date is valid (>= deedDate)
          if (targetDate < deedDate) {
            targetDate = deedDate;
          }

          // Update date if it changed
          if (targetDate !== renovationStartDate) {
            onDateChange(targetDate);
          }
        }
      }
    },
    [isDragging, isLocked, canEdit, participants, deedDate, renovationStartDate, onDateChange]
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      const handleMouseUpGlobal = (e: MouseEvent) => handleMouseUp(e);
      document.addEventListener('mouseup', handleMouseUpGlobal);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUpGlobal);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={cardRef}
      data-testid="draggable-renovation-card"
      data-dragging={isDragging}
      className={`relative ${
        isLocked || !canEdit ? 'opacity-60' : ''
      } ${isDragging ? 'z-50' : ''}`}
      style={{
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      <div
        data-testid="draggable-card-content"
        className={`px-4 py-2 rounded-lg border-2 transition-all ${
          isLocked
            ? 'bg-gray-100 border-gray-300 text-gray-600'
            : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 hover:shadow-md'
        } ${isDragging ? 'shadow-xl scale-105 ring-2 ring-orange-400 ring-opacity-50' : ''}`}
        onMouseDown={handleMouseDown}
        title={isLocked ? lockReason || 'Champ verrouillé' : 'Glisser pour changer la date'}
        style={{
          cursor: isLocked || !canEdit ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={renovationStartDate || deedDate}
            onChange={(e) => {
              if (!isLocked && canEdit && e.target.value >= deedDate) {
                onDateChange(e.target.value);
              }
            }}
            min={deedDate}
            disabled={isLocked || !canEdit}
            className={`text-sm font-semibold px-2 py-1 border-2 rounded-lg focus:outline-none ${
              isLocked
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'border-orange-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white text-gray-700'
            }`}
            onClick={(e) => e.stopPropagation()}
            title={isLocked ? lockReason || undefined : undefined}
          />
          <div className="flex flex-col">
            <div className="text-xs text-orange-600 font-medium">
              Début des rénovations
            </div>
            <div className="text-xs text-gray-500 italic flex items-center gap-1">
              <Info className="w-3 h-3" />
              Date de début des travaux de rénovation (liée à la date de l'acte)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
