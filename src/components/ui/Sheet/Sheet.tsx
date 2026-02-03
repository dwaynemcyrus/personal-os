'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type React from 'react';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Sheet.module.css';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom';
  zIndex?: number;
  enableGestures?: boolean;
};

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;

const SheetOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay> & { zIndex?: number }
>(({ className, zIndex, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={[styles.overlay, className].filter(Boolean).join(' ')}
    style={{ zIndex }}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(({ side = 'right', className, children, zIndex, enableGestures = false, onPointerDownOutside, ...props }, ref) => {
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
      <SheetOverlay zIndex={zIndex} />
      <Dialog.Content
        ref={ref}
        className={[
          styles.content,
          styles[`content--${side}`],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ zIndex }}
        onPointerDownOutside={onPointerDownOutside}
        {...props}
      >
        {content}
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
