'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type React from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  animate,
  motion,
  useMotionValue,
} from 'framer-motion';
import styles from './Sheet.module.css';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom';
  zIndex?: number;
  overlayClassName?: string;
  enableGestures?: boolean;
  gestureDismissThreshold?: number;
  gestureEdgeExclusion?: number;
  onDragProgress?: (value: number, width: number) => void;
  onDismiss?: () => void;
};

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;


const SheetOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay> & {
    zIndex?: number;
  }
>(({ className, zIndex, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={[styles.overlay, className].filter(Boolean).join(' ')}
    style={{ zIndex }}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const DRAG_START_PX = 12;
const DIRECTION_LOCK_RATIO = 1.5;
const DEFAULT_DISMISS_THRESHOLD = 0.3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isTextSelectionActive = (target: EventTarget | null) => {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection();
  if (selection && selection.type === 'Range') {
    return true;
  }
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    return start !== null && end !== null && start !== end;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return selection?.type === 'Range';
  }
  return false;
};

const SheetContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(
  (
    {
      side = 'right',
      className,
      children,
      zIndex,
      overlayClassName,
      enableGestures = false,
      gestureDismissThreshold = DEFAULT_DISMISS_THRESHOLD,
      gestureEdgeExclusion = 0,
      onDragProgress,
      onDismiss,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => {
  const shouldEnableRightSwipe = enableGestures && side === 'right';
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragX = useMotionValue(0);
  const sheetWidthRef = useRef(0);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    dragging: false,
    blocked: false,
    target: null as EventTarget | null,
  });

  const dismissThreshold = useMemo(
    () => clamp(gestureDismissThreshold, 0.05, 0.95),
    [gestureDismissThreshold]
  );

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref]
  );

  const updateWidth = useCallback(() => {
    const node = contentRef.current;
    if (!node) return;
    sheetWidthRef.current = node.getBoundingClientRect().width;
  }, []);

  useEffect(() => {
    if (!shouldEnableRightSwipe) return;
    updateWidth();
    const node = contentRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldEnableRightSwipe, updateWidth]);

  useEffect(() => {
    if (!shouldEnableRightSwipe) return;
    const unsubscribe = dragX.on('change', (value) => {
      const width = sheetWidthRef.current || 1;
      const progress = clamp(value / width, 0, 1);
      const opacity = String(1 - progress);
      const overlayNode = overlayRef.current;
      const contentNode = contentRef.current;
      if (overlayNode) {
        overlayNode.style.opacity = opacity;
      }
      if (contentNode) {
        contentNode.style.transform = `translateX(${value}px)`;
      }
      onDragProgress?.(value, width);
    });
    const overlayNode = overlayRef.current;
    const contentNode = contentRef.current;
    return () => {
      unsubscribe();
      if (overlayNode) {
        overlayNode.style.opacity = '';
      }
      if (contentNode) {
        contentNode.style.transform = '';
      }
    };
  }, [dragX, onDragProgress, shouldEnableRightSwipe]);

  const handleDragEnd = (_: unknown, info: { offset: { x?: number; y?: number }; velocity: { x?: number; y?: number } }) => {
    if (!enableGestures) return;

    const { offset, velocity } = info;

    // Swipe down to close (for bottom sheets)
    if (side === 'bottom' && offset.y && velocity.y) {
      if (offset.y > 80 || velocity.y > 500) {
        // Trigger close via onPointerDownOutside hack
        const closeEvent = new Event('pointerdown');
        document.dispatchEvent(closeEvent);
      }
    }

    // Swipe right to back (for right sheets)
    if (side === 'right' && offset.x && velocity.x) {
      if (offset.x > 80 || velocity.x > 500) {
        const closeEvent = new Event('pointerdown');
        document.dispatchEvent(closeEvent);
      }
    }
  };

  const resetDragState = () => {
    dragStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      dragging: false,
      blocked: false,
      target: null,
    };
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableRightSwipe) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        blocked: gestureEdgeExclusion > 0 && event.clientX <= gestureEdgeExclusion,
        target: event.target,
      };
    },
    [gestureEdgeExclusion, shouldEnableRightSwipe]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableRightSwipe) return;
      const state = dragStateRef.current;
      if (state.pointerId !== event.pointerId) return;
      if (state.blocked) return;

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      if (!state.dragging) {
        if (isTextSelectionActive(state.target)) {
          state.blocked = true;
          return;
        }
        if (deltaX < DRAG_START_PX) {
          return;
        }
        if (Math.abs(deltaX) < Math.abs(deltaY) * DIRECTION_LOCK_RATIO) {
          return;
        }
        state.dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      if (!state.dragging) return;
      event.preventDefault();
      const width =
        sheetWidthRef.current || event.currentTarget.getBoundingClientRect().width;
      dragX.set(clamp(deltaX, 0, width));
    },
    [dragX, shouldEnableRightSwipe]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableRightSwipe) return;
      const state = dragStateRef.current;
      if (state.pointerId !== event.pointerId) return;

      if (!state.dragging) {
        resetDragState();
        return;
      }

      const width =
        sheetWidthRef.current || event.currentTarget.getBoundingClientRect().width;
      const shouldDismiss = dragX.get() >= width * dismissThreshold;

      if (shouldDismiss) {
        animate(dragX, width, {
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        }).then(() => {
          onDismiss?.();
        });
      } else {
        animate(dragX, 0, {
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        });
      }

      resetDragState();
    },
    [dismissThreshold, dragX, onDismiss, shouldEnableRightSwipe]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableRightSwipe) return;
      const state = dragStateRef.current;
      if (state.pointerId !== event.pointerId) return;
      animate(dragX, 0, {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      });
      resetDragState();
    },
    [dragX, shouldEnableRightSwipe]
  );

  const content = enableGestures ? (
    <motion.div
      drag={side === 'bottom' ? 'y' : side === 'right' ? 'x' : false}
      dragConstraints={side === 'bottom' ? { top: 0, bottom: 200 } : { left: 0, right: 200 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </motion.div>
  ) : (
    children
  );

  return (
    <SheetPortal>
      <SheetOverlay ref={overlayRef} zIndex={zIndex} className={overlayClassName} />
      <Dialog.Content
        ref={setCombinedRef}
        className={[
          styles.content,
          styles[`content--${side}`],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ zIndex }}
        onPointerDownOutside={onPointerDownOutside}
        onPointerDown={shouldEnableRightSwipe ? handlePointerDown : undefined}
        onPointerMove={shouldEnableRightSwipe ? handlePointerMove : undefined}
        onPointerUp={shouldEnableRightSwipe ? handlePointerUp : undefined}
        onPointerCancel={shouldEnableRightSwipe ? handlePointerCancel : undefined}
        {...props}
      >
        {shouldEnableRightSwipe ? children : content}
      </Dialog.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetTitle = Dialog.Title;
const SheetDescription = Dialog.Description;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
