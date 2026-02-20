

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type React from 'react';
import { forwardRef, useCallback, useRef } from 'react';
import styles from './Sheet.module.css';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom';
  zIndex?: number;
  overlayClassName?: string;
  ariaLabel?: string;
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
      ariaLabel = 'Sheet',
      asChild,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

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
        aria-describedby={undefined}
        onPointerDownOutside={onPointerDownOutside}
        asChild={asChild}
        {...props}
      >
        {!asChild && (
          <VisuallyHidden>
            <Dialog.Title>{ariaLabel}</Dialog.Title>
          </VisuallyHidden>
        )}
        {children}
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
