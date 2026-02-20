

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type React from 'react';
import styles from './Dropdown.module.css';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

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

function DropdownCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: DropdownMenu.DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenu.CheckboxItem
      className={[styles.item, styles['item--checkbox'], className].filter(Boolean).join(' ')}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
    >
      <span className={styles.checkboxLabel}>{children}</span>
      <DropdownMenu.ItemIndicator className={styles.checkboxIndicator}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.CheckboxItem>
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
  DropdownCheckboxItem,
  DropdownSeparator,
};
