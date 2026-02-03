/**
 * ContextPicker
 *
 * Full-screen overlay with drag-to-select context zones.
 * Triggered by holding FAB for 500ms.
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import type { NavigationContext } from '@/lib/navigation/types';
import styles from './ContextPicker.module.css';

interface ContextPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectContext: (context: NavigationContext) => void;
}

type DragZone = {
  context: NavigationContext;
  label: string;
  description: string;
};

const DRAG_ZONES: DragZone[] = [
  {
    context: 'strategy',
    label: 'Strategy',
    description: 'Projects, goals, planning',
  },
  {
    context: 'knowledge',
    label: 'Knowledge',
    description: 'Notes, ideas, references',
  },
  {
    context: 'execution',
    label: 'Execution',
    description: 'Tasks, habits, focus',
  },
];

const SNAP_THRESHOLD_OFFSET = 80;
const SNAP_THRESHOLD_VELOCITY = 500;

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export function ContextPicker({
  open,
  onOpenChange,
  onSelectContext,
}: ContextPickerProps) {
  const [activeZone, setActiveZone] = useState<NavigationContext | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reset motion values when closed (not activeZone, as that causes issues)
  useEffect(() => {
    if (!open) {
      x.set(0);
      y.set(0);
    }
  }, [open, x, y]);

  // Keyboard navigation: Escape to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    const { offset, velocity } = info;

    // Determine which zone was activated based on drag position
    // Zones are arranged vertically: Strategy (top), Knowledge (middle), Execution (bottom)
    const shouldSnap =
      Math.abs(offset.y) > SNAP_THRESHOLD_OFFSET ||
      Math.abs(velocity.y) > SNAP_THRESHOLD_VELOCITY;

    if (shouldSnap) {
      // Divide screen into thirds
      const viewportHeight = window.innerHeight;
      const dragYPosition = y.get();
      const fabCenterY = viewportHeight - 80; // FAB is ~80px from bottom

      const absoluteY = fabCenterY + dragYPosition;
      const relativePosition = absoluteY / viewportHeight;

      let selectedContext: NavigationContext | null = null;

      if (relativePosition < 0.33) {
        selectedContext = 'strategy';
      } else if (relativePosition < 0.66) {
        selectedContext = 'knowledge';
      } else {
        selectedContext = 'execution';
      }

      if (selectedContext) {
        triggerHaptic();
        onSelectContext(selectedContext);
        onOpenChange(false);
      }
    } else {
      // No snap, just close
      onOpenChange(false);
    }
  };

  const handleDrag = () => {
    const dragYPosition = y.get();
    const viewportHeight = window.innerHeight;
    const fabCenterY = viewportHeight - 80;
    const absoluteY = fabCenterY + dragYPosition;
    const relativePosition = absoluteY / viewportHeight;

    let zone: NavigationContext | null = null;
    if (Math.abs(dragYPosition) > 40) {
      if (relativePosition < 0.33) {
        zone = 'strategy';
      } else if (relativePosition < 0.66) {
        zone = 'knowledge';
      } else {
        zone = 'execution';
      }
    }

    if (zone !== activeZone) {
      setActiveZone(zone);
      if (zone) {
        triggerHaptic();
      }
    }
  };

  if (!open) {
    return null;
  }

  // Reset activeZone when opening
  const handleOverlayClick = () => {
    setActiveZone(null);
    onOpenChange(false);
  };

  return (
    <div
      className={styles['context-picker']}
      role="dialog"
      aria-label="Context picker"
      aria-modal="true"
    >
      <div
        className={styles['context-picker__overlay']}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div className={styles['context-picker__zones']} role="group" aria-label="Context zones">
        {DRAG_ZONES.map((zone) => (
          <div
            key={zone.context}
            className={styles['context-picker__zone']}
            data-active={activeZone === zone.context}
            role="region"
            aria-label={`${zone.label} context zone`}
          >
            <div className={styles['context-picker__zone-label']}>
              {zone.label}
            </div>
            <div className={styles['context-picker__zone-description']}>
              {zone.description}
            </div>
          </div>
        ))}
      </div>

      <motion.div
        className={styles['context-picker__fab']}
        drag
        dragConstraints={{ left: 0, right: 0, top: -400, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, y }}
      >
        <PlusIcon />
      </motion.div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['context-picker__fab-icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
