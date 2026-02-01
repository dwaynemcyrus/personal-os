'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type React from 'react';
import { forwardRef } from 'react';
import styles from './Sheet.module.css';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom';
};

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;

const SheetOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={[styles.overlay, className].filter(Boolean).join(' ')}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Content
      ref={ref}
      className={[
        styles.content,
        styles[`content--${side}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Dialog.Content>
  </SheetPortal>
));
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
