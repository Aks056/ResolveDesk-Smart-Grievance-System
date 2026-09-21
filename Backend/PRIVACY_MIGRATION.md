# Backend Privacy Handoff

## API contracts

All routes below are relative to `/api/grievances` and require authentication.
Service authorization reloads the active database user and role. Private case
access is limited to the owning USER, the assigned OFFICER in the case's current
department, and ADMIN. Publication never grants access to private case details.

| Route | Contract |
| --- | --- |
| `GET /all?page=0&size=10` | Spring `Page<PublicGrievanceResponse>`, published rows only, newest first. Negative page or size below 1 returns 400; size above 100 is capped. |
| `GET /public/{publicId}` | One published summary; missing or withdrawn UUID returns 404. |
| `POST /public/{publicId}/upvote` | Toggle vote on a published case; returns only `upvoteCount` and `hasUpvoted`. |
| `POST /{id}/upvote` | Compatibility numeric route with the same published-only restriction and two-field response. |
| `PUT /{id}/publication` | ADMIN only. Body: `{ "published": true, "publicTitle": "Reviewed title", "publicSummary": "Reviewed summary" }`. Returns authorized private `GrievanceResponse`. |
| `GET /` | ADMIN-only paginated private records. Existing `/api/admin/grievances` also remains admin-only. |
| `GET /{id}` | Authorized private details. |
| `GET /recent` | Owner cases, officer's assigned same-department cases, or admin cases; at most five. |
| `GET /assigned?scope=MY_TASKS` | OFFICER/ADMIN. Omitted scope defaults to `MY_TASKS`. Accepted scopes: `MY_TASKS`, `DEPT_POOL`, `RESOLVED` (case-insensitive); others, including empty scope, return 400. |
| `PUT /{id}/accept` | Authorized staff claim, with a database write lock serializing competing claims. Department and existing-assignment checks remain enforced. |
| `PUT /{id}/status` | Assigned same-department OFFICER or ADMIN. Existing transition rules apply. Optional `visibility` defaults to `INTERNAL`; `PUBLIC` is rejected with 400. |
| `PUT /{id}/priority` | Assigned same-department OFFICER or ADMIN; ownership alone is insufficient. |
| `GET /{id}/history` | Private case access required. Owners cannot see internal history. |
| `GET /officers` | Staff-only directory with exactly `id`, `firstName`, `lastName`, `departmentId`, `departmentName`. |
| `GET /{id}/attachments/evidence` | Private case authorization before resolving the stored evidence key. Missing or unsafe evidence returns generic 404. |

`PublicGrievanceResponse` contains exactly:

```text
publicId: string (UUID)
publicTitle: string
publicSummary: string
departmentName: string
status: GrievanceStatus
createdDate: LocalDate (ISO yyyy-MM-dd under the standard Jackson configuration)
upvoteCount: integer
hasUpvoted: boolean
```

No internal ID, grievance number, raw title/description, identity, contact details,
attachment, precise timestamp, or history is part of this public response.
`UpvoteResponse` contains exactly `{ upvoteCount: integer, hasUpvoted: boolean }`.

Publishing requires explicitly supplied nonblank title and summary, with maximum
lengths of 200 and 2000 respectively. Raw private text is never copied automatically.
The first publication generates a UUID, retained on withdrawal/republication.
Withdrawal accepts `{ "published": false }`; omitted reviewed title/summary fields
are cleared. Include them in the withdrawal request to retain the reviewed text.
All new cases default to private; legacy null publication flags also fail closed.
Human review must remove identifying information: length validation is not a PII detector.

`DEPT_POOL` uses a dedicated queue DTO for both staff roles with exactly:
`id`, `title` (constant `Private grievance`), `departmentId`, `departmentName`,
`status`, `priority`, `createdAt`, `privateDetailsAvailable` (false).
Officers receive only unassigned cases in their own department. Admins receive the
existing global pending pool, still through this minimal DTO. `MY_TASKS` and
`RESOLVED` use authorized private responses; officers cannot read other officers'
cases, including resolved cases. Authorized private responses add `published`,
`publicId`, `publicTitle`, `publicSummary`, and `privateDetailsAvailable: true`.

Private `attachmentUrl` and compatibility `imageUrl` are both null when no evidence
exists, otherwise both equal `/api/grievances/{id}/attachments/evidence`. Fetch this
URL with the bearer token and download the returned blob; it is not a public image URL.
Responses use `Content-Type: application/octet-stream`,
`Content-Disposition: attachment; filename="evidence"`,
`X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`.
No endpoint accepts an evidence filename or filesystem path from the caller.

History persists `PUBLIC`, `PARTICIPANTS`, or `INTERNAL`. Missing/null visibility
and remarks containing `[INTERNAL]` (case-insensitive) are effectively internal.
Owners see only PUBLIC/PARTICIPANTS entries; authorized staff can see all entries.
PUBLIC history is not exposed through public summary endpoints. New status notes
default internal; explicitly selected PARTICIPANTS notes are visible to the owner
unless the internal marker overrides them. Priority notes remain internal;
assignment, claim, and owner closure events are participant-visible.
Raw feedback reads and per-case rating aggregates require private case access;
feedback submission requires the owner USER and existing lifecycle rules.

## Concurrent mutations

`Grievance.version` is a persisted primitive `long` annotated with `@Version`.
Both the no-argument constructor and Lombok builder default it to zero. Hibernate
checks the loaded version when updating/deleting a row and increments it on updates.
All current grievance row writers use managed entities in `GrievanceService`
transactions: creation, status, priority, assignment, claim, publication, owner
closure, and deletion. There are no production bulk updates bypassing versioning.
The existing pessimistic claim lock remains in place; its updates also increment
the version, preventing a stale publication write from clearing an assignment.

Stale status/priority writes cannot restore publication after a committed
withdrawal. Spring-translated and JPA optimistic-lock exceptions return HTTP 409
with only the generic message: `The record was changed by another request. Reload
it and try again.` No exception message, entity contents, or SQL is exposed. Owner
closure preserves optimistic-lock exceptions instead of wrapping them as HTTP 500.
Reload and reconsider the operation after a conflict; do not retry stale data blindly.
The version is internal, not a client-supplied version/ETag contract.

The service transaction proxy commits before returning to the synchronous MVC
controller. DTO conversion can occur inside the transaction, but a flush/commit
conflict prevents that DTO from reaching HTTP serialization; the error handler
returns 409 instead. No streaming response or caught-and-ignored conflict is used.

## Manual MySQL migration

Back up the database and evidence directory. Stop old application writers and use
a maintenance window. This document is a manual migration, not Flyway/Liquibase;
the SQL below has not been executed against a live MySQL server.

Inspect the live schema first. If none of the new columns exists, run:

```sql
ALTER TABLE grievances
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN published BOOLEAN DEFAULT FALSE,
    ADD COLUMN public_id VARCHAR(36) NULL,
    ADD COLUMN public_title VARCHAR(200) NULL,
    ADD COLUMN public_summary VARCHAR(2000) NULL,
    ADD CONSTRAINT uk_grievances_public_id UNIQUE (public_id);

ALTER TABLE grievance_history
    ADD COLUMN visibility VARCHAR(20) DEFAULT 'INTERNAL';
```

If Hibernate schema update or a prior deployment already created any columns,
apply only the missing column/index definitions instead. Do not run the preceding
ALTER statements blindly or add a redundant unique index. Check public ID duplicates
before creating a missing unique index. No UUID backfill or auto-publication is required.

After columns exist, apply these repeatable backfill/default statements:

```sql
UPDATE grievances SET version = 0 WHERE version IS NULL;
ALTER TABLE grievances MODIFY COLUMN version BIGINT NOT NULL DEFAULT 0;

UPDATE grievances SET published = FALSE WHERE published IS NULL;
ALTER TABLE grievances ALTER COLUMN published SET DEFAULT FALSE;

UPDATE grievance_history
SET visibility = 'INTERNAL'
WHERE visibility IS NULL
   OR UPPER(remarks) LIKE '%[INTERNAL]%';
ALTER TABLE grievance_history ALTER COLUMN visibility SET DEFAULT 'INTERNAL';
```

These statements preserve explicitly published rows and deliberately reviewed
participant history. Legacy remarks must not be bulk-promoted to participant or
public visibility. Null values remain tolerated in application code and fail closed.
This null tolerance applies to publication/history, not `version`: backfill every
null version before starting the upgraded application. Existing non-null version
counters must never be reset. If only the version column is missing, add it with
`ALTER TABLE grievances ADD COLUMN version BIGINT NOT NULL DEFAULT 0;`, then run
the repeatable backfill/default statements above. Keep all old application writers
stopped until every instance uses optimistic versioning; mixed old/new writers,
manual SQL updates, and bulk JPQL updates can bypass the version check. Future
non-ORM writers must explicitly check and increment the version. Do not rely on
Hibernate `ddl-auto=update` alone to backfill or enforce an existing nullable column.
The existing bootstrap schema is not an upgrade script; do not rerun it as this
migration. Prefer controlled migrations and schema validation in production.

## Evidence and rollout

New uploads use `UUID.extension` keys, never original filenames. Existing
`UUID_originalFilename` files can remain in place. The loader accepts safe legacy
keys, configured relative paths, and absolute paths only when they resolve to a
direct child of the configured storage root. Traversal, outside-root paths, nested
paths, non-UUID keys, and symlink escapes are rejected. No files are automatically
moved or deleted. Preserve the storage root and working-directory assumptions for
legacy relative paths, or reconcile stored keys in a separately reviewed migration.

The application upload resource handler is removed. `/uploads` and `/uploads/**`
are denied (401 anonymous, 403 authenticated), including existing filename URLs.
Storage roots under static/public/resources/META-INF/webapp directories are rejected.
The root must also be outside any reverse-proxy document root or object-store public
bucket; local directory-name checks cannot discover external publishing configuration.

Before reopening traffic:

1. Remove reverse-proxy aliases/static locations and CDN routes serving old uploads.
2. Disable public object-store access and purge CDN/proxy caches for old evidence URLs.
3. Ensure authenticated APIs are not cached/shared at proxies; purge old full-feed caches.
4. Deploy backend and frontend together; public cards must use UUID summary routes,
   not numeric private details, and queue cards must honor `privateDetailsAvailable`.
5. Verify the old URLs are inaccessible from outside the network boundary, with and
   without authentication, and test authorized evidence downloads through the proxy.

Previously downloaded files, browser caches, or third-party copies cannot be revoked
by this patch. Do not roll back to the old publicly exposed upload handler as a
schema rollback strategy. Frontend/proxy/live deployment verification is separate.

## Implementation inventory

Paths below are relative to `Backend/`. Existing unstaged edits were preserved.
No dependency versions changed and no commit or push was performed.

Modified for privacy:

- `src/main/java/com/grievance/config/WebConfig.java`
- `src/main/java/com/grievance/controller/GrievanceController.java`
- `src/main/java/com/grievance/dto/request/UpdateStatusRequest.java`
- `src/main/java/com/grievance/dto/response/GrievanceHistoryResponse.java`
- `src/main/java/com/grievance/dto/response/GrievanceResponse.java`
- `src/main/java/com/grievance/entity/Grievance.java`
- `src/main/java/com/grievance/entity/GrievanceHistory.java`
- `src/main/java/com/grievance/repository/GrievanceRepository.java`
- `src/main/java/com/grievance/security/SecurityConfig.java`
- `src/main/java/com/grievance/service/FeedbackService.java`
- `src/main/java/com/grievance/service/FileStorageService.java`
- `src/main/java/com/grievance/service/GrievanceService.java`

Added:

- `src/main/java/com/grievance/dto/request/PublicationRequest.java`
- `src/main/java/com/grievance/dto/response/GrievanceQueueResponse.java`
- `src/main/java/com/grievance/dto/response/OfficerDirectoryResponse.java`
- `src/main/java/com/grievance/dto/response/PublicGrievanceResponse.java`
- `src/main/java/com/grievance/dto/response/UpvoteResponse.java`
- `src/main/java/com/grievance/enums/HistoryVisibility.java`
- `src/main/java/com/grievance/service/GrievanceAccessPolicy.java`
- `src/test/java/com/grievance/service/GrievanceAccessPolicyTest.java`
- `src/test/java/com/grievance/service/GrievancePrivacyTest.java`
- `src/test/java/com/grievance/service/FileStoragePrivacyTest.java`
- `src/test/java/com/grievance/controller/GrievancePrivacyMvcTest.java`
- `src/test/java/com/grievance/repository/PublicationRepositoryTest.java`
- `PRIVACY_MIGRATION.md`

Pre-existing changes to OfficerController, DashboardResponse, JwtTokenProvider,
DashboardService, and application property files were not part of this privacy
implementation. Pre-existing GrievanceRepository/GrievanceService changes were retained.
`API_CONTRACT.md` documents the revised privacy endpoints and response contracts.

Concurrency follow-up changes only:

- `src/main/java/com/grievance/entity/Grievance.java`: persisted zero-default version.
- `src/main/java/com/grievance/exception/GlobalExceptionHandler.java`: sanitized 409 handling.
- `src/main/java/com/grievance/service/GrievanceService.java`: preserve closure conflict exceptions.
- `src/test/java/com/grievance/repository/GrievanceConcurrencyTest.java`: three competing-transaction H2 regressions.
- `src/test/java/com/grievance/controller/GrievancePrivacyMvcTest.java`: two optimistic-conflict HTTP cases.
- `PRIVACY_MIGRATION.md`: version migration, concurrency behavior, and verification results.

## Verification

From the repository root:

```powershell
mvn -f Backend/pom.xml '-Dtest=GrievanceAccessPolicyTest,GrievancePrivacyTest,FileStoragePrivacyTest,GrievancePrivacyMvcTest,PublicationRepositoryTest,GrievanceConcurrencyTest' clean test
```

Verified on 2026-09-21 with Maven 3.9.12 and Java 17.0.12: **BUILD SUCCESS**,
31 tests, 30 passed, 0 failures, 0 errors, 1 skipped (Windows symlink permissions).

| Suite | Tests | Failures | Errors | Skipped |
| --- | ---: | ---: | ---: | ---: |
| GrievanceAccessPolicyTest | 1 | 0 | 0 | 0 |
| GrievancePrivacyTest | 13 | 0 | 0 | 0 |
| FileStoragePrivacyTest | 5 | 0 | 0 | 1 |
| GrievancePrivacyMvcTest | 8 | 0 | 0 | 0 |
| PublicationRepositoryTest | 1 | 0 | 0 | 0 |
| GrievanceConcurrencyTest | 3 | 0 | 0 | 0 |

The suite covers access policy, DTO allowlists, publication/voting, officer scopes,
history filtering, evidence paths/headers, feedback bypasses, Spring Security HTTP
boundaries, H2 persistence/publication queries, and acquisition of the claim lock.
The concurrency regressions use independent EntityManagers with overlapping real
transactions, deterministic interleaving, and commit-time optimistic-lock failures:
withdrawal versus stale status, withdrawal versus stale priority, and claim versus
stale publication. Fresh transactions verify the winning values and incremented
version remain persisted; withdrawn public UUID lookup stays unavailable. These
are actual stale writes, not only lock-acquisition assertions. MVC tests separately
verify sanitized 409 responses for translated and raw JPA conflicts, with no success DTO.
The symlink escape test skips when Windows cannot create symlinks. Tests use mocks,
temporary files, and H2, not a live database. The pre-existing deployment-dependent
application-context test is intentionally excluded. MySQL migration execution,
live multi-request concurrency stress testing, external proxy/cache behavior, and
frontend integration remain deployment verification tasks.