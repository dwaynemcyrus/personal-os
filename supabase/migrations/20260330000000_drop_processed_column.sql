-- Migration: drop redundant `processed` boolean from items
--
-- Inbox items are now filtered by status = 'unprocessed'.
-- The processed boolean was always redundant with the status column.

ALTER TABLE items DROP COLUMN IF EXISTS processed;
