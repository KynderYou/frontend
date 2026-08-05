# Midna Global — Database Schema (v1, industry-standard)

Recommended schema for the Midna Global backend. Derived from the per-page data spec and the frontend mock flows, refined with common production patterns: append-only ledger, workflow state machine, centralized file metadata, role-based access, and audit columns.

**~18 tables.** Most pages reuse the same tables:

- All scan pages (My Scans MLA, My Scans H.O, My Reports, MIS · Scans) → **`scans`** (+ workflow history).
- Notice board (Dashboard) and Communications → **`messages`**.
- Trainees / MLAs / Mentors → **`members`**, distinguished by **`member_roles`**, **`mentee_type`**, and **`mentored_by`**.

Dashboard KPIs, top performers, charts, and stat rows are **not stored** — they are aggregates (see *Derived data*).

Types shown are PostgreSQL for reference; the model is engine-agnostic.

---

## Design principles

| Principle | How it applies |
|---|---|
| **Single source of truth for money** | All debits, billing, receipts, and top-ups post to **`ledger_entries`** (append-only). |
| **Workflow as state machine** | **`scans.current_stage`** + **`current_status`**; optional **`scan_state_transitions`** for audit. |
| **Files as first-class metadata** | **`files`** table; entities reference `file_id` instead of bare URLs. |
| **Roles are many-to-many** | A member can be Mentor + MLA; use **`roles`** + **`member_roles`**. |
| **Account vs membership status** | Login eligibility (`account_status`) is separate from mentee activity (`membership_status`). |
| **Client inline on scan** | One scan = one client snapshot; no `clients` table until CRM is needed. |
| **Audit everywhere** | `created_at`, `updated_at` on all tables; soft delete where users can “remove” data. |

---

## Relationships at a glance

```
roles ─< member_roles >─ members ─┐
                                  ├─< certifications
                                  ├─< scans (scan_by, preprocessed_by, processed_by)
                                  │        ├─< scan_state_transitions
                                  │        ├─< scan_images
                                  │        └─< cab_audios
                                  ├─< ledger_entries (reference → scan | cab_audio | …)
                                  ├─< reviews
                                  ├─< messages (author_id)
                                  │        ├─< message_replies
                                  │        ├─< message_recipients (member_id | group_id)
                                  │        ├─< message_seen
                                  │        └─< polls ─< poll_options ─< poll_votes
                                  ├─< group_members >─ groups
                                  ├── mentored_by ──> members
                                  └── admin_by ─────> members

files ─ referenced by scans, scan_images, certifications, ledger_entries, cab_audios
```

`─<` = one-to-many · `>─` = many-to-one

---

## Enums (recommended)

Use DB enums or `CHECK` constraints — not free-text long term.

```sql
-- members
account_status:       active | invited | disabled
membership_status:    active | inactive | expired   -- null for non-mentees
mentee_type:          trainee | mla                   -- null for non-mentees
subscription_tier:    gold | diamond | platinum | ultima

-- scans
scan_stage:           mla | ho_preprocess | ho_process | ho_verify | ho_download | ho_report | report
-- current_status values depend on stage (validated in application layer)

-- ledger_entries
ledger_kind:          receipt | billing | topup | debit | reversal
ledger_reference_type: scan | cab_audio | topup | manual

-- messages
audience_type:        everyone | members | groups
```

---

## Tables

### 1. `roles`

System roles for authorization. Replaces a single `role` text column on `members`.

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `code` | text unique | `mla`, `mentor`, `ho_staff`, `counsellor`, `admin` |
| `label` | text | display name |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### 2. `members`

Core account. Covers **Auth**, **Profile**, **My Trainees / My MLAs / Trainee List / MLA List**, and **Admin · Member Accounts**.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | internal id — never expose in URLs |
| `member_code` | text unique | displayed member id; maps to API `mid` |
| `name` | text | |
| `email` | text unique | login; maps to API `mail_id` |
| `password_hash` | text | never store plaintext |
| `last_login` | timestamptz | |
| `account_status` | enum | `active` / `invited` / `disabled` — can they log in? |
| `membership_status` | enum nullable | `active` / `inactive` / `expired` — mentee under mentor; null otherwise |
| `mentee_type` | enum nullable | `trainee` / `mla` — separates Trainee List vs MLA List |
| `created_at` | timestamptz | account created (Member Accounts) |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz nullable | soft delete |
| **Personal** | | |
| `mobile1` | text | API `mobile_1`; also shown as phone in Member Accounts |
| `mobile2` | text | API `mobile_2` |
| `dob` | date nullable | |
| `country`, `state`, `city`, `pincode` | text | |
| `address` | text | |
| `region` | text | the “nest” (Top Performers, Network Performance) |
| **Membership** | | |
| `date_of_joining` | date nullable | API `doj` |
| `subscription_tier` | enum nullable | API `mas_type`: Gold / Diamond / Platinum / Ultima |
| `expiry_date` | date nullable | “date of expiry” / DOEx in trainee tables |
| `billing_pct` | numeric(5,2) nullable | billing %; API `billing` |
| `opening_balance` | numeric(12,2) nullable | API `op_bal` |
| **Professional** | | |
| `uid` | text | |
| `services` | text | |
| `availability` | text | |
| `certified` | boolean | |
| `certification_date` | date nullable | API `cr_date` |
| **Visibility & admin** | | |
| `show_mrp` | boolean | |
| `branding` | text | |
| `mis_training` | text | |
| `mentored_by` | bigint FK → members.id nullable | mentor for this mentee |
| `admin_by` | bigint FK → members.id nullable | |
| `remarks` | text | |
| `avatar_file_id` | bigint FK → files.id nullable | profile image |

**Relationships:** self-FK via `mentored_by` and `admin_by`; parent of scans, ledger, messages, reviews, certifications.

---

### 3. `member_roles`

Many-to-many: members ↔ roles.

| Field | Type | Notes |
|---|---|---|
| `member_id` | bigint FK → members.id | PK part |
| `role_id` | int FK → roles.id | PK part |
| `assigned_at` | timestamptz | |

---

### 4. `files`

Central file metadata. Storage path/key lives here; serve via signed URLs.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `storage_key` | text unique | S3 key, blob path, etc. |
| `original_name` | text | |
| `mime_type` | text | |
| `byte_size` | bigint | |
| `uploaded_by` | bigint FK → members.id nullable | |
| `created_at` | timestamptz | |
| `deleted_at` | timestamptz nullable | |

---

### 5. `certifications`

Uploaded certificate files on Profile.

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `member_id` | bigint FK → members.id | owner |
| `file_id` | bigint FK → files.id | |
| `created_at` | timestamptz | |

---

### 6. `scans`

Central scan record. One table for **My Scans (MLA)**, **My Scans (H.O)**, **My Reports**, and **MIS · Scans**. Client details are inline (see *Notes*).

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `scan_code` | text unique | displayed scan id (e.g. S42489) |
| `scan_by` | bigint FK → members.id | MLA who uploaded |
| **Workflow** | | |
| `current_stage` | enum | `mla` / `ho_preprocess` / `ho_process` / `ho_verify` / `ho_download` / `ho_report` / `report` |
| `current_status` | text | stage-specific status; validated in app (see *Scan workflow*) |
| `details_saved_at` | timestamptz nullable | replaces MLA `detailsSaved` boolean |
| **Upload file** | | |
| `upload_file_id` | bigint FK → files.id nullable | MLA zip / upload |
| `upload_date` | timestamptz | |
| `export_date` | timestamptz nullable | export to H.O |
| **Client (inline)** | | |
| `client_name` | text | |
| `gender` | text | |
| `age` | int nullable | |
| `phone` | text | |
| `client_type` | text | |
| `referred_by` | text | |
| `mrp` | text | |
| **H.O processing** | | |
| `report_type` | text | |
| `cost` | numeric(12,2) nullable | |
| `image_count` | int nullable | |
| `preprocessed_by` | bigint FK → members.id nullable | set at Process tab |
| `processed_by` | bigint FK → members.id nullable | set at Verify / Download / Report |
| `main_pattern` | text | from preprocess |
| `sub_pattern` | text | from preprocess |
| `urc` | int nullable | 0 in preprocess; set in process |
| `rrc` | int nullable | 0 in preprocess; set in process |
| `lfo` | int nullable | from process |
| `finger` | text nullable | `L1`–`L5`, `R1`–`R5` (not int) |
| **Report (My Reports / H.O Report tab)** | | |
| `report_file_id` | bigint FK → files.id nullable | |
| `report_generated_date` | timestamptz nullable | |
| `report_plan` | text nullable | `Standard` / `Premium` |
| `cab_requested_at` | timestamptz nullable | “CAB requested” before audio exists |
| **Audit** | | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz nullable | |

**Relationships:** belongs to `members` (scan_by, preprocessed_by, processed_by); parent of `scan_images`, `cab_audios`, `scan_state_transitions`.

---

### 7. `scan_state_transitions` (recommended)

Append-only workflow audit. Answers “who moved this scan to Rejected?”

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `scan_id` | bigint FK → scans.id | |
| `from_stage` | enum nullable | null on create |
| `to_stage` | enum | |
| `from_status` | text nullable | |
| `to_status` | text | |
| `actor_id` | bigint FK → members.id nullable | |
| `note` | text nullable | rejection reason, etc. |
| `created_at` | timestamptz | |

Insert a row on every stage/status change. **`scans.current_stage`** and **`current_status`** remain the fast read path.

---

### 8. `scan_images`

Fingerprint / photo images per scan. MLA image viewer and H.O fingerprint modal.

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `scan_id` | bigint FK → scans.id | |
| `file_id` | bigint FK → files.id | |
| `name` | text | display name |
| `label` | text | `Left` / `Right` / `Photo` |
| `finger` | text nullable | `L1`–`L5`, `R1`–`R5` |
| `view` | text nullable | `L` / `C` / `R` — left / centre / right print view |
| `created_at` | timestamptz | |

---

### 9. `cab_audios`

Counselling audio (“CAB”). Serves **My Reports** CAB list and **MIS · CAB** (mentee debit for audio taken from mentor).

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `scan_id` | bigint FK → scans.id | |
| `counsellor_id` | bigint FK → members.id | counsellor name from member |
| `mentor_id` | bigint FK → members.id nullable | audio source mentor (MIS · CAB) |
| `mentee_id` | bigint FK → members.id nullable | mentee debited (MIS · CAB) |
| `title` | text | |
| `file_id` | bigint FK → files.id | |
| `duration_sec` | int | seconds |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Debit amounts and status live in `ledger_entries`**, not here. Link via `reference_type = 'cab_audio'` and `reference_id = cab_audios.id`.

---

### 10. `ledger_entries`

**My Ledger** — receipts, billing (last 30 days in UI), top-ups, scan debits, CAB debits. **Append-only**: never update `amount`; post a **`reversal`** entry to correct mistakes.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `member_id` | bigint FK → members.id | account the entry applies to |
| `kind` | enum | `receipt` / `billing` / `topup` / `debit` / `reversal` |
| `title` | text | |
| `amount` | numeric(12,2) | positive for credits, negative for debits (pick one convention and stick to it) |
| `entry_date` | timestamptz | |
| `reference_type` | enum nullable | `scan` / `cab_audio` / `topup` / `manual` |
| `reference_id` | bigint nullable | polymorphic FK |
| `proof_file_id` | bigint FK → files.id nullable | top-up payment proof |
| `reverses_entry_id` | bigint FK → ledger_entries.id nullable | if kind = reversal |
| `created_by` | bigint FK → members.id nullable | |
| `created_at` | timestamptz | |

**Two “Debit” flows in the UI:**

| UI action | Storage |
|---|---|
| H.O Report Upload → Debit | `ledger_entries` kind=`debit`, reference=`scan` |
| MIS · CAB → Debit mentee | `ledger_entries` kind=`debit`, reference=`cab_audio`, member=`mentee_id` |

---

### 11. `reviews`

Source data for **Network Performance** review counts and charts. Not derivable from scans alone.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `member_id` | bigint FK → members.id | member being reviewed (performer) |
| `scan_id` | bigint FK → scans.id nullable | optional link to scan |
| `rating` | smallint nullable | if star ratings are added later |
| `comment` | text nullable | |
| `reviewed_at` | timestamptz | used for monthly aggregation |
| `created_at` | timestamptz | |

---

### 12. `messages`

**Notice board** (Dashboard) and **MIS · Communications** message list.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `author_id` | bigint FK → members.id | |
| `title` | text | |
| `body` | text | |
| `severity` | text nullable | |
| `audience_type` | enum | `everyone` / `members` / `groups` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz nullable | |

**Relationships:** parent of replies, recipients, seen, polls. Seen count = count of `message_seen` rows.

---

### 13. `message_replies`

Thread replies in Communications detail.

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `message_id` | bigint FK → messages.id | |
| `author_id` | bigint FK → members.id | |
| `body` | text | |
| `created_at` | timestamptz | |

---

### 14. `message_recipients`

Audience when `audience_type` is not `everyone`.

| Field | Type | Notes |
|---|---|---|
| `message_id` | bigint FK → messages.id | PK part |
| `member_id` | bigint FK → members.id nullable | specific person |
| `group_id` | int FK → groups.id nullable | group |

Exactly one of `member_id` / `group_id` per row.

---

### 15. `message_seen`

“Seen by” list on a thread.

| Field | Type | Notes |
|---|---|---|
| `message_id` | bigint FK → messages.id | PK part |
| `member_id` | bigint FK → members.id | PK part |
| `seen_at` | timestamptz | |

---

### 16. `polls`

Optional poll on a message.

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `message_id` | bigint FK → messages.id | |
| `question` | text | |
| `created_at` | timestamptz | |

---

### 17. `poll_options`

Poll choices. **`vote_count` is optional cache** — source of truth is `poll_votes`.

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `poll_id` | int FK → polls.id | |
| `text` | text | option label |
| `vote_count` | int default 0 | denormalized cache; recompute from `poll_votes` if needed |

---

### 18. `poll_votes`

One vote per member per poll (industry standard for dedupe).

| Field | Type | Notes |
|---|---|---|
| `poll_id` | int FK → polls.id | PK part |
| `member_id` | bigint FK → members.id | PK part |
| `option_id` | int FK → poll_options.id | |
| `voted_at` | timestamptz | |

---

### 19. `groups`

Communications groups (Groups tab).

| Field | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text | |
| `created_at` | timestamptz | |

---

### 20. `group_members`

Many-to-many members ↔ groups.

| Field | Type | Notes |
|---|---|---|
| `group_id` | int FK → groups.id | PK part |
| `member_id` | bigint FK → members.id | PK part |
| `joined_at` | timestamptz | |

---

## Scan workflow

`current_stage` + `current_status` replace overlapping `status`, `stage`, and `report_status` columns. Suggested status values per stage:

| Stage | Example `current_status` values |
|---|---|
| `mla` | `draft`, `saved`, `exported`, `processing` |
| `ho_preprocess` | `pending_preprocess`, `in_preprocess` |
| `ho_process` | `in_process`, `rejected` |
| `ho_verify` | `awaiting_verification`, `to_be_reviewed` |
| `ho_download` | `ready_to_download`, `downloaded` |
| `ho_report` | `uploaded`, `dds_done`, `debited`, `completed` |
| `report` | `processing`, `ready`, `upgraded` |

Validate transitions in the API (state machine). Log each change in **`scan_state_transitions`**.

**MLA export rule:** `details_saved_at IS NOT NULL` before allowing export (replaces `detailsSaved` flag).

---

## Derived data (not stored)

| Page | Value | Derived from |
|---|---|---|
| Dashboard | Scans this year / total; billing this year / total | count/sum over `scans`, `ledger_entries` by member + date |
| Dashboard | Top performers (rank, scan count) | group `scans` by `scan_by` |
| My Ledger | Total receipts, total billing (30d) | sum over `ledger_entries` |
| My Ledger | Expenses chart (per month) | sum `ledger_entries` grouped by month |
| My Reports | Stats row (reports ready, premium, CAB count) | filter `scans` by stage/status/plan; count `cab_audios` |
| Trainees / MLAs | trainee count, number of scans | count members by `mentored_by`; count `scans` by `scan_by` |
| Network Performance | KPIs, monthly charts, low-performer insights | aggregates over `scans`, `ledger_entries`, `reviews` by member/region/month |
| Communications | seen count | count of `message_seen` |
| MIS · CAB | debit status | latest `ledger_entries` for `reference_type = cab_audio` |

---

## API field mapping

Existing frontend/API types use different names. Map at the boundary:

| DB column | API / frontend field |
|---|---|
| `member_code` | `mid` |
| `email` | `mail_id` |
| `mobile1` / `mobile2` | `mobile_1` / `mobile_2` |
| `date_of_joining` | `doj` |
| `subscription_tier` | `mas_type` |
| `billing_pct` | `billing` |
| `opening_balance` | `op_bal` |
| `certification_date` | `cr_date` |
| `scan_code` | `scanId` |
| `current_stage` + `current_status` | various `status` / `section` fields in mocks |

Display names (`scan_by`, `processed_by`, counsellor) should always be **joined from `members`**, not stored as duplicate text.

---

## Notes & decisions

- **Auth `token`** — JWT/session issued at login; not persisted. Add a `sessions` table only for server-side revocation.
- **Client inline on `scans`** — no `clients` table until repeat-client tracking is required.
- **`role` vs `mentee_type`** — `member_roles` = system access; `mentee_type` = Trainee vs MLA under a mentor; `membership_status` = active/inactive mentee.
- **Counsellor is a member** — CAB counsellor name from `cab_audios.counsellor_id` → `members.name`.
- **Report Upload actions** (Upload, DDS, Debit, Delete) — Upload sets `report_file_id`; DDS advances `current_status` to `dds_done`; Debit posts `ledger_entries`; Delete soft-deletes scan or report file.
- **Indexes (minimum)** — `members(email)`, `members(mentored_by)`, `scans(scan_by, upload_date)`, `scans(current_stage, current_status)`, `ledger_entries(member_id, entry_date)`, `reviews(member_id, reviewed_at)`, all FK columns.
- **What we deferred** — separate `users`/`profiles` split, full double-entry GL, event sourcing beyond scan transitions, normalized `clients` table.

---

## Changelog from original schema draft

| Change | Reason |
|---|---|
| Added `roles`, `member_roles` | Multiple roles per member; industry RBAC |
| Split `status` into `current_stage` + `current_status` | HO + MLA + report lifecycles were overloaded |
| Added `scan_state_transitions` | Workflow audit trail |
| Added `files` | Centralized file metadata and signed URLs |
| Added `reviews` | Network Performance needs a source table |
| Added `poll_votes` | Vote dedupe and integrity |
| Moved debit fields off `cab_audios` → `ledger_entries` | Single source of truth for money |
| Added `account_status` + `membership_status` | Separates login state from mentee inactive |
| `finger` as text | UI uses L1–R5, not integers |
| Added `details_saved_at`, `cab_requested_at` | Matches MLA and Reports flows |
| Added audit columns (`created_at`, `updated_at`, `deleted_at`) | Production baseline |
