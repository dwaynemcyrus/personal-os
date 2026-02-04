'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type React from 'react';
import styles from './Dropdown.module.css';

const Dropdown = DropdownMenu.Root;
const DropdownTrigger = DropdownMenu.Trigger;
const DropdownPortal = DropdownMenu.Portal;

function DropdownContent({
  className,
  sideOffset = 8,
  align = 'end',
  ...props
}: DropdownMenu.DropdownMenuContentProps) {
  return (
    <DropdownPortal>
      <DropdownMenu.Content
        className={[styles.content, className].filter(Boolean).join(' ')}
        sideOffset={sideOffset}
        align={align}
        {...props}
      />
    </DropdownPortal>
  );
}

function DropdownItem({
  className,
  inset = false,
  ...props
}: DropdownMenu.DropdownMenuItemProps & { inset?: boolean }) {
  return (
    <DropdownMenu.Item
      className={[
        styles.item,
        inset ? styles['item--inset'] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

function DropdownSeparator({
  className,
  ...props
}: DropdownMenu.DropdownMenuSeparatorProps) {
  return (
    <DropdownMenu.Separator
      className={[styles.separator, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
};
