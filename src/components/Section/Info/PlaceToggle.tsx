// src/components/Section/Info/PlaceToggle.tsx
import type { KeyboardEvent, ReactNode } from 'react';

export type MapTarget = 'default' | 'ceremony' | 'party';

interface PlaceToggleProps {
  target: MapTarget;
  activeMap: MapTarget;
  setActiveMap: (value: MapTarget) => void;
  children: ReactNode;
  className?: string;
}

export function PlaceToggle({
  target,
  activeMap,
  setActiveMap,
  children,
  className = '',
}: PlaceToggleProps) {
  const isActive = activeMap === target;

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveMap(target);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      className={`place-text muted ${isActive ? 'active' : ''} ${className}`.trim()}
      onClick={() => setActiveMap(target)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </span>
  );
}
