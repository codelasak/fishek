'use client';

import { useState, useRef, TouchEvent } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  threshold?: number; // Swipe threshold in pixels
}

export default function SwipeableCard({
  children,
  onEdit,
  onDelete,
  threshold = 80,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Only allow left swipe (negative values)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -160)); // Max swipe distance
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (translateX < -threshold) {
      // Snap to revealed state
      setTranslateX(-140);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Action buttons (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTranslateX(0);
            onEdit();
          }}
          className="h-12 w-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTranslateX(0);
            onDelete();
          }}
          className="h-12 w-12 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="bg-white dark:bg-surface-dark"
      >
        {children}
      </div>
    </div>
  );
}
