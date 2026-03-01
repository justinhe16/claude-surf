---
name: linear-surf
description: Deep planning tool that creates comprehensive, agent-ready Linear tickets via MCP. Enters question mode to explore requirements, examines the codebase for patterns, and produces cleanly scoped tickets per area ([Web], [Backend], [iOS], [Admin]). Usage: /linear-surf <description>
allowed-tools: Bash, Read, Glob, Grep, WebFetch
---

# Linear Surf — Deep Ticket Planning

Creates comprehensive, well-scoped Linear tickets through a structured question-and-answer process. Designed so another agent (like /robot-surf) can pick up the ticket and implement it cleanly — no ambiguity, no guessing, no scope creep.

## Philosophy

A great ticket:
- Is scoped to **ONE area** (`[Web]`, `[Backend]`, `[iOS]`, or `[Admin]`)
- Contains enough context that no clarification is needed during implementation
- References existing codebase patterns and real file paths
- Specifies WHAT, WHY, and HOW — but leaves room for engineering judgment within those constraints
- Includes explicit acceptance criteria and out-of-scope boundaries
- Anticipates edge cases and failure modes before implementation begins

## Ticket Scopes

| Scope | When to Use |
|-------|-------------|
| `[Web]` | Browser-based UI — pages, components, routing, forms |
| `[Backend]` | API endpoints, database, background jobs, server logic |
| `[iOS]` | Native iOS app — screens, navigation, Swift/SwiftUI work |
| `[Admin]` | Operational work — API keys, deployment, infrastructure, config |

For full-stack features, create **one ticket per area** and link them as related. Never combine areas into a single ticket.

Rarely, other scopes are acceptable (e.g., `[Docs]`, `[Analytics]`, `[Design]`) — use sparingly.

## Usage

```
/linear-surf <description>
```

**Examples:**
```
/linear-surf "Add user profile editing to the mobile app"
/linear-surf "Build a Stripe webhook handler for subscription events"
/linear-surf "Create an admin dashboard for monitoring user activity"
/linear-surf "Add dark mode support to the web app"
```

---

## Instructions

### Step 0: Parse Input

Extract the description from args. If none provided:

```
Error: A description is required.

Usage: /linear-surf <description>

Example:
  /linear-surf "Add a user profile editing flow"
```

Stop and return this message.

### Step 1: Explore the Codebase

Before asking anything, silently explore the existing codebase. This ensures tickets reference real patterns and file paths rather than generic placeholders.

Check if we're in a git repo:
```bash
git rev-parse --show-toplevel 2>/dev/null && echo "in-repo" || echo "not-in-repo"
```

If in a repo, gather context:

```bash
# Root structure
ls -la

# package.json for JS/TS projects
cat package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({k: d.get(k) for k in ['name','dependencies','devDependencies']}, indent=2))" 2>/dev/null | head -60

# iOS: Podfile, Package.swift
cat Podfile 2>/dev/null | head -20
cat Package.swift 2>/dev/null | head -20

# Backend: go.mod, pyproject.toml, Cargo.toml, Gemfile
cat go.mod 2>/dev/null | head -10
cat pyproject.toml 2>/dev/null | head -20
cat Cargo.toml 2>/dev/null | head -10
cat Gemfile 2>/dev/null | head -20
```

Use Glob and Grep to understand structure:
- What framework is used? (Next.js, Remix, Rails, FastAPI, Django, Vapor, etc.)
- What's the API style? (REST, GraphQL, tRPC, etc.)
- What's the state management? (Redux, Zustand, MobX, SwiftUI @State, etc.)
- What's the ORM or database layer? (Prisma, SQLAlchemy, CoreData, etc.)
- What's the test framework?
- What naming conventions are used? (file names, component names, route patterns)
- What are the key directories?

Build a silent codebase context summary to use later when writing tickets:

```
Tech stack:       [e.g., Next.js 14, TypeScript, Tailwind]
API style:        [e.g., REST via tRPC, /api/v1/* routes]
State:            [e.g., Zustand, React Query for server state]
Database/ORM:     [e.g., PostgreSQL via Prisma]
Test framework:   [e.g., Jest + Playwright]
Key directories:
  src/app/        → Next.js App Router pages
  src/components/ → Shared UI components
  src/lib/        → Utilities and helpers
  src/api/        → API route handlers
Naming patterns:
  Files:          kebab-case (e.g., user-profile.tsx)
  Components:     PascalCase (e.g., UserProfileCard)
  API routes:     /api/v1/resource/:id
```

If NOT in a git repo, skip exploration and note that codebase context is unavailable.

### Step 2: Phase 1 — Scope Questions

Display the opening banner and first set of questions:

```
═══════════════════════════════════════════════════════════════
  LINEAR SURF — PLANNING MODE
═══════════════════════════════════════════════════════════════

  Request: "<initial description>"

  I'll ask questions in phases to build the most comprehensive
  ticket(s) possible. The goal: a ticket so complete that an
  agent can implement it with zero ambiguity.

  Take your time — detail here saves time during implementation.

═══════════════════════════════════════════════════════════════
  PHASE 1 OF 3: SCOPE & CONTEXT
═══════════════════════════════════════════════════════════════
```

Ask ALL of the following questions at once (display numbered list, user answers all before continuing):

**Q1. Areas touched** — Which area(s) does this work touch?

```
  a) [Web]     — Browser UI, pages, components, routing
  b) [Backend] — API, database, business logic, background jobs
  c) [iOS]     — Native iOS screens, views, navigation
  d) [Admin]   — API keys, deployment, infrastructure, config
  e) Multiple areas (I'll create one ticket per area)
```

**Q2. Nature of the work** — What kind of change is this?

```
  a) Net-new feature (doesn't exist at all)
  b) Extension of existing feature (builds on what's there)
  c) Refactor / improvement (same behavior, better internals)
  d) Bug fix (something is broken)
```

**Q3. Priority**

```
  a) Urgent   — blocking production or an active release
  b) High     — needed soon, next sprint
  c) Normal   — standard backlog priority
  d) Low      — nice to have
```

**Q4. User / consumer** — Who is the primary consumer of this work?

```
  (e.g., end users, internal team, mobile users, third-party API clients, admins)
```

**Q5. Success definition** — In one or two sentences, how do you know this is done? What's the desired end state?

**Q6. Constraints or non-negotiables** — Are there any hard constraints? (specific library to use, must not break X, must match existing UI pattern, performance budget, etc.)

Wait for user to answer all six before proceeding.

### Step 3: Phase 2 — Technical Deep Dive

Based on the areas selected in Q1, ask targeted technical questions. If multiple areas were selected, go through each in sequence.

Display the phase header:

```
═══════════════════════════════════════════════════════════════
  PHASE 2 OF 3: TECHNICAL DETAILS
═══════════════════════════════════════════════════════════════
```

---

#### [Backend] Questions

```
  ── BACKEND ─────────────────────────────────────────────────
```

Ask all of the following (display as a numbered list for the user to answer):

**B1. API Endpoints**
What new endpoints are needed? For each:
- HTTP method + path (e.g., `POST /api/v1/users/:id/profile`)
- Authentication: public / requires auth / admin only
- One-line description of what it does

If extending an existing endpoint — which one, and what changes?

**B2. Request & Response Shape**
What does the request body look like? What does the response return?
(Rough is fine: e.g., "takes `{ name, bio, avatarUrl }` returns updated user object")

**B3. Data Model Changes**
New database tables/collections, or changes to existing ones?
For each: table name → field name, type, nullable, default, index?

**B4. Business Logic & Validations**
What are the core rules?
(e.g., "email must be unique", "price must be > 0", "user must own the resource to edit it")

**B5. Side Effects**
Does this trigger anything else?
- Emails or push notifications?
- Updates to other records or caches?
- Third-party API calls?
- Background jobs or queues?

**B6. Error Cases**
What should happen when things fail?
- What 400/422 validation errors are possible?
- What 404 cases (resource not found)?
- What 403 unauthorized cases?
- Retry logic needed anywhere?

**B7. Performance & Scalability**
- Expected volume: low / medium / high traffic?
- Caching needed? (what, for how long, invalidated by what?)
- Any queries that could be slow? Indexes needed?
- Pagination required?

**B8. Security**
- Rate limiting?
- Input sanitization or special encoding concerns?
- Sensitive data being stored (PII, payment info)?
- Audit logging required?

**B9. Testing**
What test cases are critical to cover?
(e.g., "unauthenticated requests rejected", "duplicate email returns 422", "pagination returns correct page size")

---

#### [Web] Questions

```
  ── WEB ─────────────────────────────────────────────────────
```

Ask all of the following:

**W1. Pages & Routes**
What new routes are created, or existing routes are modified?
(e.g., `/profile/edit` is new, `/settings` gets a new tab)

**W2. Components**
What new components are needed?
What existing components are modified?
Roughly describe the layout/structure of each.

**W3. Data & API Calls**
- What endpoints does this call? (existing or new from backend ticket?)
- What data is fetched on page load vs. on user action?
- Any local state vs. server state distinction?
- How is data stored client-side? (React Query, Zustand, context, local component state?)

**W4. User Flow — Step by Step**
Walk me through the full user journey:
1. User arrives at... (how?)
2. They see...
3. They do...
4. Result / next step...
5. Success state looks like...
6. Error state looks like...

**W5. Forms & Validation**
Are there any forms? If yes:
- Fields? (name, type, optional/required)
- Validation rules? (required, min/max length, regex, etc.)
- Submit behavior? (what API call, what happens on success?)
- Where are errors shown? (inline under field, toast, banner?)

**W6. Loading, Empty & Error States**
- Loading state: skeleton, spinner, or nothing?
- Empty state: what's shown when there's no data?
- Error state: toast, inline message, full-page error?

**W7. Responsiveness & Layout**
- Mobile-first or desktop-first?
- Any specific breakpoints that need special handling?
- Any differences in behavior on mobile vs. desktop?

**W8. Auth & Permissions**
- Is this route gated behind login?
- Any role-based UI differences? (admin sees X, regular user sees Y)
- Redirect behavior for unauthenticated users?

**W9. Analytics & Tracking**
- Should any events be tracked? (page view, button click, form submit, etc.)
- Which analytics tool is in use? (Segment, Mixpanel, GA4, PostHog, etc.)
- Event names / properties to capture?

**W10. Accessibility**
- Any specific a11y requirements?
- Keyboard navigation critical for any interactions?
- ARIA labels or roles needed?

---

#### [iOS] Questions

```
  ── iOS ──────────────────────────────────────────────────────
```

Ask all of the following:

**I1. Screens & Views**
What new screens or views are added?
What existing screens are modified?
Briefly describe what each screen contains.

**I2. Navigation**
- How does the user arrive at this screen? (tab bar, push, modal, sheet, deep link?)
- What's the dismiss/back behavior?
- Any deep link URLs to support?

**I3. UI Layout & Interactions**
Describe the layout:
- List? Grid? Form? Custom?
- Any custom gestures? (swipe, long press, pinch?)
- Any animations or transitions?

**I4. Data & API**
- Which endpoints does this call?
- Local caching strategy? (CoreData, UserDefaults, in-memory, none?)
- Offline behavior — what works without network connectivity?

**I5. State Management**
- ViewModel? ObservableObject? @State? SwiftData?
- What triggers a re-render / reload?

**I6. iOS Permissions**
Any system permissions required?
(Camera, Photos, Notifications, Location, Contacts, Microphone, HealthKit, etc.)

**I7. Platform-Specific Features**
Does this use any of the following?
- Push notifications
- Background fetch / processing
- Widgets or Live Activities
- App Clips
- Face ID / Touch ID / Passkeys
- In-app purchases
- ShareSheet / UIActivityViewController
- Universal Links / deep links

**I8. Performance**
- Long lists? (infinite scroll, pagination, lazy loading strategy?)
- Heavy image loading? (caching approach?)
- Anything that could block the main thread?

**I9. Testing**
- Unit test requirements?
- UI test requirements (XCTest)?
- Any simulator vs. real device specific requirements?

---

#### [Admin] Questions

```
  ── ADMIN / INFRASTRUCTURE ──────────────────────────────────
```

Ask all of the following:

**A1. What needs to be done?**
Be specific:
(e.g., "Add `STRIPE_WEBHOOK_SECRET` to Railway prod environment", "Configure S3 bucket CORS for uploads", "Set up Cloudflare Worker for edge caching")

**A2. Environments**
Which environment(s) does this apply to?
- [ ] Development
- [ ] Staging
- [ ] Production
- [ ] All

**A3. Platforms & Services**
Which services are involved?
(e.g., Railway, Vercel, AWS, GCP, Heroku, Cloudflare, Datadog, Sentry, etc.)

**A4. Credentials & Access**
What credentials or access is required to complete this?
Who needs to do it?

**A5. Verification**
How do we verify the work is done correctly after completing it?

**A6. Documentation**
Does this need to be documented anywhere?
(`.env.example`, README, internal runbook, team wiki)

**A7. Rollback Plan**
If something goes wrong, how do we revert?

---

Wait for user to answer all questions in the relevant area(s) before continuing.

### Step 4: Phase 3 — Extra Considerations

Always ask this final round, regardless of area. These surface things the user likely didn't think about.

```
═══════════════════════════════════════════════════════════════
  PHASE 3 OF 3: EXTRA CONSIDERATIONS
  (things worth locking down before we write the tickets)
═══════════════════════════════════════════════════════════════
```

**E1. Edge Cases**
What are the tricky edge cases? Think about:
- Two users acting on the same resource simultaneously
- Empty or null values in unexpected places
- Very large data sets or long strings
- Network failure mid-operation
- Clock skew / timezone issues

**E2. Backwards Compatibility**
Does this change anything that existing users or consumers rely on?
- Breaking API changes?
- Data migration strategy for existing records?
- Feature flag needed to roll out safely?

**E3. Rollout Strategy**
- Can this ship all at once, or does it need a phased rollout?
- Any dark launch / feature flag?
- Any user-facing communication needed? (email, in-app notice, changelog)

**E4. Monitoring & Alerting**
- Any new metrics, logs, or traces to add?
- Any alerts that should fire if this breaks in production?
- Error rate thresholds?

**E5. Dependencies**
- Does this block or get blocked by any other tickets?
- Any external team or third-party dependency?
- Any API rate limits or quotas to be aware of?

**E6. Out of Scope**
What should explicitly **NOT** be done in this ticket?
(This is critical — helps the implementing agent avoid scope creep)

Wait for user to answer. Then proceed to drafting.

### Step 5: Draft Tickets

After collecting all answers, draft the ticket(s). Do not create them yet — show drafts for review.

**Rules:**
- One area = one ticket
- Multiple areas = one ticket per area, cross-referenced
- Never mix areas in a single ticket
- Title format: `[Area] <Action verb> <brief noun phrase>` (e.g., `[Backend] Add user profile update API`, `[Web] Build user profile editing UI`)

For each ticket, produce the following structure:

---

```
═══════════════════════════════════════════════════════════════
  TICKET DRAFT <N> of <TOTAL>
═══════════════════════════════════════════════════════════════

TITLE
  [Area] <Concise action-oriented title>

OVERVIEW
  What we're building and why. 2–4 sentences, plain English.
  A non-technical stakeholder should understand the business
  purpose from this paragraph alone.

BACKGROUND
  Why this exists now. What problem it solves. What happens
  without it. Context about where we are today vs. where we
  want to be.

TECHNICAL APPROACH
  How to implement this. Reference actual codebase patterns:

  - "Follow the pattern used in `src/api/users.ts` for the
    new endpoint handler."
  - "Add to the existing `UserModel` in `src/models/user.ts`
    rather than creating a new model."
  - "Create a new component in `src/components/profile/`
    following the same structure as `src/components/settings/`."

  Be specific enough that an agent can implement without
  guessing, but don't micro-manage. Leave room for good
  engineering judgment within the described approach.

DATA MODELS
  (omit section if no model changes)

  New or modified tables/collections:
  - `users` table: add `avatar_url` (varchar 500, nullable),
    `bio` (text, nullable), `updated_at` (timestamp, not null)
  - New table: `user_sessions`
      id          uuid, PK
      user_id     uuid, FK → users.id
      token       varchar 255, unique, indexed
      expires_at  timestamp, not null
      created_at  timestamp, not null, default now()

API ENDPOINTS
  (omit section if no API changes)

  POST /api/v1/profile
    Auth:     Bearer token required
    Request:  { name: string, bio?: string, avatarUrl?: string }
    Response: { user: UserObject }
    Errors:   401 if unauthenticated, 422 with field errors if
              validation fails

UI/UX DETAILS
  (omit section if no UI changes)

  Page/Screen: [name and route/path]

  User flow:
  1. User navigates to...
  2. They see...
  3. They interact with...
  4. Result...

  Components:
  - [ComponentName] — description of purpose
  - [ComponentName] — description of purpose

  States:
  - Loading: [describe]
  - Empty: [describe]
  - Error: [describe]
  - Success: [describe]

ACCEPTANCE CRITERIA
  [ ] [Happy path] Describe the successful case
  [ ] [Happy path] Another success case
  [ ] [Error] Unauthenticated request returns 401
  [ ] [Error] Invalid input returns descriptive validation error
  [ ] [Edge case] Describe the edge case behavior
  [ ] [Performance] Specific performance requirement if any
  [ ] [Accessibility] A11y requirement if applicable

EDGE CASES & CONSIDERATIONS
  - [edge case 1]: how to handle it
  - [edge case 2]: how to handle it
  - Security: [any security notes]
  - Performance: [any performance notes]
  - Backwards compatibility: [any migration notes]

TESTING REQUIREMENTS
  Unit tests:
  - [what to test and why]

  Integration tests:
  - [API contract test case 1]

  E2E tests (if applicable):
  - [critical user flow to cover]

OUT OF SCOPE
  The following is explicitly NOT part of this ticket:
  - [thing 1] — defer to [future ticket / separate discussion]
  - [thing 2]

DEPENDENCIES
  - Blocked by: [ticket IDs or "none"]
  - Blocks: [ticket IDs or "none"]
  - Related: [ticket IDs or "none"]
  - External: [third-party dependencies or "none"]

CODEBASE NOTES
  For the implementing agent — relevant context from the codebase:

  - Key files to look at:
      src/api/users.ts       — existing user endpoint pattern
      src/models/user.ts     — UserModel definition
      src/components/settings/ — component structure to mirror

  - Pattern to follow: [describe the existing pattern concisely]
  - Gotchas: [any known tricky areas, version-specific quirks, etc.]

═══════════════════════════════════════════════════════════════
```

Repeat the full block for each ticket.

### Step 6: Review & Confirmation

After displaying all drafts:

```
═══════════════════════════════════════════════════════════════
  REVIEW
═══════════════════════════════════════════════════════════════

  I've drafted <N> ticket(s) above.

  Review each section carefully. You can:
    1. Approve and create  → reply "create" or "looks good"
    2. Modify a section    → "change [section] to [new content]"
    3. Add missing detail  → "also add [detail] to ticket [N]"
    4. Start over          → "restart"

  Before I create these, I need:
    • Linear team name   → e.g., "Engineering", "Mobile", "Platform"
    • Assignee           → "me", a username, or "unassigned"
    • Sprint/cycle       → "current sprint", "next sprint", or "none"

═══════════════════════════════════════════════════════════════
```

Handle iterative edits — apply user's changes to the draft, re-display affected sections, and ask for final approval before creating.

### Step 7: Create Tickets via Linear MCP

Once the user approves, create each ticket using the Linear MCP server.

For each ticket:

1. Find the team:
   - Call `mcp__linear__list_teams` to list available teams
   - Match the user's team name (case-insensitive fuzzy match)
   - If ambiguous, list options and ask user to confirm

2. Create the issue with `mcp__linear__save_issue`:
   - `title`: Full scoped title (e.g., `[Backend] Add user profile update API`)
   - `team`: resolved team ID
   - `description`: Full markdown body from the draft (OVERVIEW through CODEBASE NOTES)
   - `priority`: Map from user's Phase 1 answer: Urgent=1, High=2, Normal=3, Low=4
   - `assignee`: If specified — "me", username, or omit for unassigned
   - `cycle`: If specified — "current sprint" → look up current cycle via `mcp__linear__list_cycles`

3. After all tickets are created, link related ones:
   - If multiple tickets were created for the same request, link them with `relatedTo`
   - Use `mcp__linear__save_issue` with `relatedTo: [id1, id2]` to set the relation

### Step 8: Report Success

```
═══════════════════════════════════════════════════════════════
  TICKETS CREATED
═══════════════════════════════════════════════════════════════

  ✓ [Backend] Add user profile update API
    → ENG-456  https://linear.app/...

  ✓ [Web] Build user profile editing UI
    → ENG-457  https://linear.app/...

  Both tickets are linked as related issues.

  Next steps:
    /robot-surf ENG-456   → implement the backend ticket
    /robot-surf ENG-457   → implement the web ticket

═══════════════════════════════════════════════════════════════
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No description provided | Show usage and stop |
| Linear MCP not configured | Tell user to run `/prep-surf` to set it up |
| Team not found | List all available teams, ask user to pick |
| Cycle/sprint not found | List cycles, ask user to confirm |
| Ticket creation fails | Show the Linear error, offer to retry |
| Not in a git repo | Skip codebase exploration, note it in the ticket |

## Notes

- **Question mode is mandatory** — never skip to drafting without completing all three phases
- Always reference actual codebase files and patterns discovered in Step 1
- The ticket description should be complete enough for `/robot-surf` to implement without any human interaction
- Don't over-specify implementation — specify WHAT to do, not every line of HOW
- Keep out-of-scope sections sharp — they protect the implementing agent from rabbit holes
- For [Admin] tickets, the acceptance criteria should be verifiable steps, not just "it's done"
- Multiple small, scoped tickets are always better than one large mixed ticket
