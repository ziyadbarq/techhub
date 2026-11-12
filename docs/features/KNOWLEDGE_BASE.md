# Knowledge Base — TechHub

## Scope
Knowledge Base is an internal, permission-controlled library for Barq policies, cybersecurity guidance, procedures, and reusable technical articles.

The first version supports:
- Two formats: **PDF upload** and **structured block editor** (plain text, headings, lists and quotes; no arbitrary HTML).
- Taxonomy/category and classification: INTERNAL or RESTRICTED.
- Draft revisions, controlled publication, and a published snapshot that remains unchanged while edits are in progress.
- Audit records for create, edit, publish and archive; revision metadata.
- Per-version reading acknowledgement, when the author marks a policy as requiring it.
- Catalog search across published article content and metadata. PDF search covers metadata, not embedded PDF text.
- Historical revision access for authorized editors/publishers.
- Private PDF download endpoint; every request is authenticated, feature-gated and permission-checked.

## Paths
- `/knowledge-base` — catalog
- `/knowledge-base/new` — create a draft
- `/knowledge-base/[id]` — published document / authorized unpublished draft
- `/knowledge-base/[id]/edit` — editor
- `/api/knowledge-base` — catalog and article creation
- `/api/knowledge-base/upload` — private PDF upload or new PDF version
- `/api/knowledge-base/[id]` — read, edit, publish, archive
- `/api/knowledge-base/[id]/download` — protected download
- `/api/knowledge-base/[id]/acknowledge` — acknowledgement of published version

## Feature Flag
`KNOWLEDGE_BASE` is **OFF by default**, category LAYER_3, depends on RBAC.
After migrations and Prisma Client generation, run the approved feature/permission seed and enable the flag in Admin → Feature Flags.

## Permissions
| Key | Meaning |
|---|---|
| `knowledge-base:view` | Browse accessible published documents |
| `knowledge-base:create` | Create an editor article or PDF draft |
| `knowledge-base:update` | Edit a draft, replace a PDF, inspect revisions |
| `knowledge-base:publish` | Publish an immutable revision |
| `knowledge-base:archive` | Archive a document; no hard delete |
| `knowledge-base:view:restricted` | See or create RESTRICTED documents |

No non-admin role receives the new permissions automatically. Grant appropriate access through TechHub Roles; the system administrator receives all permissions from RBAC seeding.

## Security & deployment gates
1. Apply `20261110150000_add_knowledge_base` migration via GitLab/DevOps pipeline, after applying the earlier role migration.
2. Generate Prisma Client: `npm run db:generate`.
3. Run the approved RBAC + feature seed: `npm run db:seed`. Check existing custom role permissions remain intact.
4. Enable the feature for intended users after creating their access policy.
5. **PDF requires `GCS_BUCKET_NAME` and `GCS_ATTACHMENTS_PREFIX` with a private GCS bucket, uniform bucket-level access, and correct Workload Identity.** The upload fails closed when those settings are absent; it never stores KB policies in `public/uploads`.
6. Before real employee policy uploads, arrange malware scanning, file retention/legal review, cloud access logging, and a cyber risk assessment. File signature validation is not antivirus scanning.
7. Run `npm run generate:routes`, `npm run validate`, then test Editor/PDF create and update, publication visibility, restricted authorization, anonymous rejections, stale-version conflicts, archive, and acknowledgement revocation for a new published version.

### Known limitations of v1
- PDF text indexing/OCR, Word documents, automatic review-and-approval workflow, targeted role-by-role document visibility, and enterprise-wide acknowledgement compliance reports are **not implemented**.
- The PDF is offered as a protected download rather than embedded in a browser preview.
- Catalog API returns at most 250 recent records; add cursor pagination before large-scale rollout.
- Archived articles are hidden; recovery requires a managed administrative procedure.
- Publishing is permission-gated but has no second-person approval step yet.

## Data model
`KnowledgeArticle` is the working draft and publication pointer. `KnowledgeRevision` stores immutable content snapshots; `KnowledgeAcknowledgement` captures acceptance by user and published version. The PDF object is stored in private GCS; revision metadata references its opaque storage path.

No public/unverified URLs, HTML rendering, anonymous document access, or QR codes.
