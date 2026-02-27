# Sync Architecture Specification v2.0
## Project: Private Single-User Local-First PWA
## Stack: RxDB + Supabase (Postgres + Realtime + Storage + Auth)

---

# 1. System Philosophy

This application is:

- Single-user
- Private
- Local-first
- Offline-capable
- Eventually consistent
- Real-time cross-device

Local database (RxDB) guarantees UX responsiveness.
Supabase guarantees persistence and cross-device continuity.

We optimize for:
- Determinism
- Simplicity
- Recoverability
- Low operational complexity

We do NOT optimize for:
- Multi-user collaboration
- CRDT correctness
- Operational transforms
- Distributed systems complexity

---

# 2. High-Level Architecture

Client (PWA)
  ├── RxDB
  │     ├── notes
  │     ├── tasks
  │     ├── projects
  │     ├── attachments (metadata)
  │     └── note_versions (optional)
  │
  ├── RxDB ⇄ Supabase Replication Plugin (live)
  │
  └── Attachment Cache (IndexedDB/OPFS)

Supabase
  ├── Postgres (structured data)
  ├── Realtime (change stream)
  ├── Storage (binary objects)
  └── Auth (single account)

---

# 3. Mandatory Sync Implementation

## 3.1 Required Plugin

The system MUST use:

    RxDB Supabase Replication Plugin

Do NOT build custom replication endpoints unless forced.

Reason:
- Officially supported
- PostgREST pull/push
- Realtime-triggered pull
- Lower sync bug surface

---

## 3.2 Replication Mode

Replication MUST run with:

    live: true

This ensures:

- Cross-browser updates without refresh
- Device switching feels instant
- Seamless UX

Failure to achieve real-time propagation means misconfiguration.

---

## 3.3 Replication Direction

Push:
    RxDB → Supabase

Pull:
    Supabase → RxDB

Realtime:
    Supabase Realtime → triggers pull cycle

Batch size:
    50–100 documents

Retry:
    Exponential backoff
    Non-blocking UI

---

# 4. Data Model Requirements

Every structured table MUST include:

- id (uuid primary key)
- owner (uuid references auth.uid())
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted (boolean default false)
- device_id (text)
- revision (integer)

Purpose:
- LWW resolution
- Debugging
- Deterministic ordering
- Soft deletion safety

---

# 5. Table Definitions

## 5.1 notes

- id uuid primary key
- owner uuid not null
- title text
- content text
- project_id uuid nullable
- created_at timestamptz
- updated_at timestamptz
- deleted boolean default false
- device_id text
- revision integer

Indexes:
- owner
- updated_at
- project_id

---

## 5.2 tasks

- id uuid primary key
- owner uuid
- title text
- completed boolean
- due_at timestamptz nullable
- project_id uuid nullable
- note_id uuid nullable
- created_at
- updated_at
- deleted
- device_id
- revision

Indexes:
- owner
- completed
- due_at

---

## 5.3 projects

- id
- owner
- name
- description
- status
- created_at
- updated_at
- deleted
- device_id
- revision

Indexes:
- owner
- status

---

## 5.4 attachments (metadata only)

Binary files are NEVER stored in Postgres.

- id
- owner
- parent_type
- parent_id
- storage_bucket
- storage_path
- mime
- bytes
- sha256
- created_at
- updated_at
- deleted
- device_id
- revision

Indexes:
- owner
- parent_id
- sha256

---

# 6. Supabase RLS

All tables MUST enforce:

    owner = auth.uid()

No public access.

Storage bucket policy:
    storage.objects.owner = auth.uid()

The system assumes exactly one authenticated user.

---

# 7. Conflict Model

Conflicts are rare but expected.

Trigger:
- Same record edited offline on two devices
- Both reconnect

Resolution Strategy:

Default: Last Write Wins (based on updated_at)

If remote overwrites local:
- Store previous local version in note_versions table
- OR create a conflict copy

No field-level merge logic.
No CRDT.
No operational transforms.

Simplicity > theoretical perfection.

---

# 8. Attachment Lifecycle

## Upload

1. Compute sha256
2. Upload to Supabase Storage
3. Insert metadata record
4. Replicate metadata

## Download

1. Metadata syncs
2. On open:
   - Fetch from Storage
   - Cache locally
   - Mark local_cached true

## Cache Control

- LRU eviction
- Configurable max size
- Metadata remains even if cache evicted

---

# 9. Multi-Tab Coordination

RxDB multi-tab leader election MUST be enabled.

Only leader tab performs replication.
Other tabs subscribe via BroadcastChannel.

Prevents duplicate sync streams.

---

# 10. Realtime Guarantee

System is valid only if:

Editing in Browser A →
Within seconds →
Browser B reflects change →
Without refresh

If not, replication configuration is wrong.

---

# 11. Failure Handling

If Supabase unreachable:
- App fully usable offline
- Writes queued locally

If replication fails:
- Log error
- Retry
- Never block editor

If attachment upload fails:
- Mark pending_upload
- Retry background queue

---

# 12. Backup Strategy

Server:
- Supabase daily backups enabled

Optional:
- Manual JSON export (structured only)

Binary files backed by Supabase Storage.

---

# 13. Performance Constraints

- Markdown stored as plain text
- No large blobs in Postgres
- Proper indexes mandatory
- Keep payload small
- Avoid unnecessary fields

---

# 14. Non-Goals

- No collaboration
- No multi-user editing
- No peer-to-peer sync
- No CRDT
- No OT
- No offline attachment guarantee for entire library

---

# 15. Final Design Principle

This is a private operating system.

It must:

- Feel instant
- Work offline
- Sync automatically
- Recover safely

Complexity is the enemy.
Determinism is the goal.