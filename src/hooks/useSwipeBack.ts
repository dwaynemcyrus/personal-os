

import { useEffect } from 'react';

const SWIPE_THRESHOLD = 80;
const EDGE_ZONE = 30; // px from left edge to initiate

type UseSwipeBackOptions = {
  onBack: () => void;
  enabled?: boolean;
};

export function useSwipeBack({ onBack, enabled = true }: UseSwipeBackOptions) {
  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (touch.clientX <= EDGE_ZONE) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      // Must be more horizontal than vertical, and exceed threshold
      if (dx > SWIPE_THRESHOLD && dy < dx * 0.75) {
        onBack();
      }
    };

    const handleTouchCancel = () => {
      tracking = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, onBack]);
}
