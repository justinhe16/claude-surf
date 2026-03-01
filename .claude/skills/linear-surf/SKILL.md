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

Tell the user briefly: "Planning **`<description>`** — I'll ask a few questions in phases to write the most complete ticket possible."

Then use the **AskUserQuestion tool** (do NOT print plain text questions). Make two sequential calls:

**First AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Area"
     question: "Which area(s) does this work touch?"
     multiSelect: true
     options:
       - label: "[Web]"
         description: "Browser UI — pages, components, routing, forms"
       - label: "[Backend]"
         description: "API, database, business logic, background jobs"
       - label: "[iOS]"
         description: "Native iOS screens, views, Swift/SwiftUI"
       - label: "[Admin]"
         description: "API keys, deployment, infrastructure, config"

  2. header: "Change type"
     question: "What kind of change is this?"
     multiSelect: false
     options:
       - label: "Net-new feature"
         description: "Doesn't exist at all — building from scratch"
       - label: "Extension of existing"
         description: "Builds on what's already there"
       - label: "Refactor / improvement"
         description: "Same behavior, better internals or UX"
       - label: "Bug fix"
         description: "Something is broken and needs fixing"

  3. header: "Priority"
     question: "What's the priority for this work?"
     multiSelect: false
     options:
       - label: "Urgent"
         description: "Blocking production or an active release"
       - label: "High"
         description: "Needed soon — next sprint"
       - label: "Normal"
         description: "Standard backlog priority"
       - label: "Low"
         description: "Nice to have, no time pressure"
```

Wait for the user to answer, then make the **second AskUserQuestion call** — 3 questions:

```
questions:
  4. header: "Consumer"
     question: "Who is the primary consumer of this work?"
     multiSelect: false
     options:
       - label: "End users"
         description: "Public-facing — people using the product"
       - label: "Internal team / admins"
         description: "People inside the company"
       - label: "Mobile users specifically"
         description: "People on the native iOS/Android app"
       - label: "Third-party API clients"
         description: "External developers calling your API"
     (user can select Other to describe a different consumer)

  5. header: "Success"
     question: "How do you know this is done? Describe the desired end state in 1–2 sentences."
     multiSelect: false
     options:
       - label: "User can do something they couldn't before"
         description: "New capability added"
       - label: "Existing flow is faster / more reliable"
         description: "Performance or reliability improvement"
       - label: "A specific bug or regression is resolved"
         description: "Something broken is now fixed"
       - label: "Internal tooling or infra change is live"
         description: "Operational change is deployed and verified"
     (user should select Other and type their specific success criteria)

  6. header: "Constraints"
     question: "Are there any hard constraints or non-negotiables?"
     multiSelect: true
     options:
       - label: "Must use a specific library or technology"
         description: "Engineering isn't free to choose the approach"
       - label: "Must not break existing behavior"
         description: "Backwards compatibility is required"
       - label: "Must match existing UI/UX patterns"
         description: "Design consistency is non-negotiable"
       - label: "No specific constraints"
         description: "Engineering judgment is fine"
     (user can select Other to describe a custom constraint)
```

Wait for the user to answer all questions before proceeding.

### Step 3: Phase 2 — Technical Deep Dive

Based on the areas selected in Q1, ask targeted technical questions using **AskUserQuestion** for structured choices. If multiple areas were selected, go through each in sequence.

Tell the user: "Phase 2 of 3: Technical details for [area(s)]."

---

#### [Backend] Questions

**First AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Endpoints"
     question: "What API endpoint changes are needed?"
     multiSelect: false
     options:
       - label: "New endpoint(s)"
         description: "Entirely new routes"
       - label: "Modifying existing endpoint(s)"
         description: "Changing behavior of existing routes"
       - label: "Both new and modified endpoints"
         description: "Mix of additions and changes"
       - label: "No endpoint changes"
         description: "Backend-only logic, no new API surface"
     (user selects Other to give specific paths and methods)

  2. header: "Data model"
     question: "Are there database / data model changes?"
     multiSelect: false
     options:
       - label: "New table(s) / collection(s)"
         description: "Schema additions"
       - label: "Modifying existing table(s)"
         description: "Adding or changing columns/fields"
       - label: "Both new and modified"
         description: "Mix of additions and changes"
       - label: "No data model changes"
         description: "Logic only, schema stays the same"
     (user selects Other to describe specifics)

  3. header: "Side effects"
     question: "Does this trigger any side effects?"
     multiSelect: true
     options:
       - label: "Emails or push notifications"
         description: "Messages sent to users"
       - label: "Third-party API calls"
         description: "Calls to external services (Stripe, Twilio, etc.)"
       - label: "Background jobs or queues"
         description: "Async processing"
       - label: "No side effects"
         description: "Self-contained, nothing else triggered"
     (user can select Other for custom side effects)
```

Wait for answers, then ask follow-up open questions as plain text:

- **B1 (if endpoints):** "For each new/modified endpoint, describe: HTTP method + path, auth requirement (public/authed/admin), and what it does. Include request body shape and response shape."
- **B2 (if data model):** "For each table change: table name, field name, type, nullable, default, and any indexes needed."
- **B3 (always):** "What are the core business logic rules and validations? (e.g., 'email must be unique', 'user must own the resource')"
- **B4 (if side effects):** "Describe each side effect in detail — what triggers it, what it does, and any retry/failure handling."

**Second AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Traffic volume"
     question: "What's the expected traffic volume for this endpoint/feature?"
     multiSelect: false
     options:
       - label: "Low"
         description: "Infrequent calls, < 100 req/min"
       - label: "Medium"
         description: "Moderate load, 100–1000 req/min"
       - label: "High"
         description: "Heavy traffic, > 1000 req/min or bursts"
       - label: "Unknown / not a concern"
         description: "Optimize later if needed"

  2. header: "Security"
     question: "What security considerations apply?"
     multiSelect: true
     options:
       - label: "Rate limiting needed"
         description: "Prevent abuse of this endpoint"
       - label: "Stores PII or sensitive data"
         description: "Personal info, payment data, health info"
       - label: "Requires audit logging"
         description: "Changes must be tracked for compliance"
       - label: "None of the above"
         description: "Standard auth is sufficient"

  3. header: "Caching"
     question: "Is caching needed?"
     multiSelect: false
     options:
       - label: "Yes — response caching"
         description: "Cache API responses (Redis, CDN, etc.)"
       - label: "Yes — query/DB caching"
         description: "Cache expensive DB queries"
       - label: "No caching needed"
         description: "Always fetch fresh"
       - label: "Unsure"
         description: "Leave for the implementer to decide"
```

Then ask as plain text:
- **B5:** "What error cases should the API handle explicitly? (400/422 validations, 404 not found, 403 unauthorized, retry logic?)"
- **B6:** "What test cases are critical to cover? (e.g., 'unauthenticated request returns 401', 'duplicate email returns 422')"

---

#### [Web] Questions

**First AskUserQuestion call** — 4 questions:

```
questions:
  1. header: "Routes"
     question: "What routing changes are involved?"
     multiSelect: false
     options:
       - label: "New route(s) only"
         description: "Adding pages that don't exist yet"
       - label: "Modifying existing route(s)"
         description: "Changing an existing page"
       - label: "Both new and modified routes"
         description: "Mix of additions and changes"
       - label: "No routing changes"
         description: "Components only, no new pages"

  2. header: "Data fetching"
     question: "How does this page get its data?"
     multiSelect: false
     options:
       - label: "Fetched on page load"
         description: "SSR / SSG or immediate client-side fetch on mount"
       - label: "Fetched on user action"
         description: "Data loads after a click, input, or trigger"
       - label: "Mix of load + lazy"
         description: "Initial load + additional fetches"
       - label: "No data fetching"
         description: "Fully static or local state only"

  3. header: "Auth"
     question: "What are the auth requirements for this UI?"
     multiSelect: false
     options:
       - label: "Login required"
         description: "Redirect to login if unauthenticated"
       - label: "Public — no auth needed"
         description: "Anyone can access this page"
       - label: "Role-based differences"
         description: "Admin sees X, regular user sees Y"
       - label: "Mixed"
         description: "Some parts public, some gated"

  4. header: "Responsiveness"
     question: "What's the layout/responsiveness approach?"
     multiSelect: false
     options:
       - label: "Mobile-first"
         description: "Designed for mobile, scales up"
       - label: "Desktop-first"
         description: "Designed for desktop, degrades gracefully"
       - label: "Both treated equally"
         description: "Fully responsive, both are first-class"
       - label: "Desktop only"
         description: "Not expected to work on mobile"
```

**Second AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Forms"
     question: "Are there any forms in this feature?"
     multiSelect: false
     options:
       - label: "Yes"
         description: "I'll describe the fields and validation"
       - label: "No forms"
         description: "Read-only or navigation only"

  2. header: "Error/empty states"
     question: "How should loading, empty, and error states be handled?"
     multiSelect: false
     options:
       - label: "Skeleton loaders"
         description: "Placeholder shapes while loading"
       - label: "Spinner / progress indicator"
         description: "Simple spinner while loading"
       - label: "Match existing patterns"
         description: "Copy whatever the codebase already does"
       - label: "Custom — I'll describe"
         description: "Specific requirements"

  3. header: "Analytics"
     question: "Does this feature need analytics event tracking?"
     multiSelect: false
     options:
       - label: "Yes — page view + key interactions"
         description: "Standard tracking"
       - label: "Yes — custom events"
         description: "I'll specify exact event names"
       - label: "No tracking needed"
         description: "Skip analytics"
       - label: "Unknown"
         description: "Leave for product to specify"
```

Then ask as plain text:
- **W1:** "Describe the routes: what new paths are created, or which existing ones change? (e.g., `/profile/edit` is new)"
- **W2:** "What new components are needed, and which existing ones are modified? Describe the rough layout."
- **W3:** "Walk me through the full user flow step by step: how do they arrive, what do they see, what do they do, what's the success state, what's the error state?"
- **W4 (if forms):** "Describe each form: fields (name, type, required/optional), validation rules, submit behavior, where errors are shown."

---

#### [iOS] Questions

**First AskUserQuestion call** — 4 questions:

```
questions:
  1. header: "Navigation"
     question: "How does the user arrive at this screen?"
     multiSelect: false
     options:
       - label: "Tab bar"
         description: "A tab in the main tab bar"
       - label: "Pushed onto navigation stack"
         description: "NavigationLink / push navigation"
       - label: "Modal / sheet"
         description: "Presented over existing content"
       - label: "Deep link"
         description: "Launched from URL or notification"

  2. header: "Layout type"
     question: "What's the primary UI layout?"
     multiSelect: false
     options:
       - label: "List / feed"
         description: "Scrollable rows of items"
       - label: "Form / input screen"
         description: "Fields and controls for user input"
       - label: "Detail / info screen"
         description: "Displaying a single piece of content"
       - label: "Custom / complex"
         description: "Doesn't fit a standard pattern"

  3. header: "Offline support"
     question: "What should work without network connectivity?"
     multiSelect: false
     options:
       - label: "Full offline support"
         description: "All core features work offline"
       - label: "Show cached data only"
         description: "Read access to last fetched data"
       - label: "No offline support"
         description: "Gracefully show an error when offline"
       - label: "Not applicable"
         description: "Network is always required"

  4. header: "iOS permissions"
     question: "Which system permissions does this require?"
     multiSelect: true
     options:
       - label: "Camera or Photos"
         description: "Access to camera or photo library"
       - label: "Notifications"
         description: "Local or push notifications"
       - label: "Location"
         description: "User's location"
       - label: "None"
         description: "No system permissions needed"
     (user can select Other for Microphone, Contacts, HealthKit, etc.)
```

**Second AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Platform features"
     question: "Does this use any special iOS platform features?"
     multiSelect: true
     options:
       - label: "Push notifications"
         description: "Remote push via APNs"
       - label: "Widgets or Live Activities"
         description: "Home screen or Dynamic Island"
       - label: "Face ID / Touch ID / Passkeys"
         description: "Biometric or passkey auth"
       - label: "None"
         description: "Standard UIKit / SwiftUI only"
     (user can select Other for deep links, in-app purchases, etc.)

  2. header: "State management"
     question: "What state management pattern should be used?"
     multiSelect: false
     options:
       - label: "Match existing pattern"
         description: "Whatever the codebase already uses"
       - label: "ViewModel + ObservableObject"
         description: "MVVM with Combine"
       - label: "@State / @StateObject"
         description: "SwiftUI native state"
       - label: "SwiftData / CoreData"
         description: "Persistent local data store"

  3. header: "Testing"
     question: "What testing is required?"
     multiSelect: true
     options:
       - label: "Unit tests"
         description: "Logic and ViewModel tests"
       - label: "UI tests (XCTest)"
         description: "Automated UI interaction tests"
       - label: "No tests required"
         description: "Manual QA only"
       - label: "Snapshot tests"
         description: "Visual regression testing"
```

Then ask as plain text:
- **I1:** "Describe each new or modified screen: what does it display, what can the user do on it?"
- **I2:** "Which API endpoints does this screen call? Describe what data is loaded on appear vs. on user action."
- **I3 (if complex layout):** "Describe the UI layout in more detail — any custom gestures, animations, or interactions?"

---

#### [Admin] Questions

**AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Environments"
     question: "Which environment(s) does this apply to?"
     multiSelect: true
     options:
       - label: "Development"
         description: "Local dev environment"
       - label: "Staging"
         description: "Pre-production / QA environment"
       - label: "Production"
         description: "Live production environment"
       - label: "All environments"
         description: "Applies everywhere"

  2. header: "Rollback"
     question: "If something goes wrong, how do we revert?"
     multiSelect: false
     options:
       - label: "Easily reversible"
         description: "Can be undone with a single action"
       - label: "Requires manual steps"
         description: "Reverting is possible but takes effort"
       - label: "Not easily reversible"
         description: "Destructive or hard to undo"
       - label: "Unknown"
         description: "Need to think through this"

  3. header: "Documentation"
     question: "Does this need to be documented?"
     multiSelect: true
     options:
       - label: ".env.example"
         description: "New environment variables"
       - label: "README or runbook"
         description: "Operational documentation"
       - label: "Internal wiki or Notion"
         description: "Team knowledge base"
       - label: "No documentation needed"
         description: "Self-explanatory change"
```

Then ask as plain text:
- **A1:** "Describe exactly what needs to be done. Be specific — include service names, config keys, and exact values where possible."
- **A2:** "Which platforms/services are involved? (Railway, Vercel, AWS, GCP, Cloudflare, Datadog, etc.)"
- **A3:** "What credentials or access are required? Who needs to perform this action?"
- **A4:** "How do we verify it's done correctly after completing it?"

---

Wait for user to answer all questions in the relevant area(s) before continuing.

### Step 4: Phase 3 — Extra Considerations

Always ask this final round, regardless of area. Tell the user: "Phase 3 of 3: A few more things worth locking down before I write the ticket."

Use **AskUserQuestion** with two sequential calls:

**First AskUserQuestion call** — 3 questions:

```
questions:
  1. header: "Edge cases"
     question: "Which edge cases are most likely to cause problems?"
     multiSelect: true
     options:
       - label: "Concurrent access"
         description: "Two users acting on the same resource simultaneously"
       - label: "Empty / null values"
         description: "Missing or null data in unexpected places"
       - label: "Network failure mid-operation"
         description: "Request fails partway through a multi-step action"
       - label: "None I can think of"
         description: "Standard cases only"
     (user can select Other to describe specific edge cases)

  2. header: "Backwards compat"
     question: "Does this change anything existing users or consumers rely on?"
     multiSelect: false
     options:
       - label: "Yes — breaking API or schema change"
         description: "Migration or versioning strategy needed"
       - label: "Yes — but backwards compatible"
         description: "Additive change, existing behavior preserved"
       - label: "No — entirely new surface"
         description: "Nothing existing is affected"
       - label: "Needs a feature flag"
         description: "Should be dark-launched to roll out safely"

  3. header: "Rollout"
     question: "How should this be rolled out?"
     multiSelect: false
     options:
       - label: "Ship all at once"
         description: "No special rollout — merge and deploy"
       - label: "Feature flag"
         description: "Dark launch, enable for users gradually"
       - label: "Phased rollout"
         description: "Deploy to a subset of users/traffic first"
       - label: "Needs user communication"
         description: "Email, in-app notice, or changelog required"
```

**Second AskUserQuestion call** — 2 questions:

```
questions:
  1. header: "Monitoring"
     question: "What monitoring or observability changes are needed?"
     multiSelect: true
     options:
       - label: "New metrics or dashboards"
         description: "Track a new signal in production"
       - label: "New alerts"
         description: "Alert if error rate or latency spikes"
       - label: "No changes needed"
         description: "Existing monitoring is sufficient"
       - label: "Unknown"
         description: "Leave for the implementer to assess"

  2. header: "Dependencies"
     question: "Are there any dependencies on other work?"
     multiSelect: false
     options:
       - label: "Blocked by another ticket"
         description: "Can't start until something else ships"
       - label: "Blocks another ticket"
         description: "Something else is waiting on this"
       - label: "External dependency"
         description: "Waiting on a third-party API, library, or team"
       - label: "No dependencies"
         description: "Can be picked up and implemented independently"
```

Then ask as plain text:
- **E1 (always):** "What should explicitly NOT be done in this ticket? List things out of scope — this protects the implementing agent from scope creep."

Wait for the user to answer. Then proceed to drafting.

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
- **Use AskUserQuestion tool** for all structured questions — never fall back to plain text numbered lists for Phase 1, Phase 2 structured choices, or Phase 3
- For purely narrative questions (e.g., "describe the user flow step by step"), ask as plain text after the AskUserQuestion call for that phase
- Always reference actual codebase files and patterns discovered in Step 1
- The ticket description should be complete enough for `/robot-surf` to implement without any human interaction
- Don't over-specify implementation — specify WHAT to do, not every line of HOW
- Keep out-of-scope sections sharp — they protect the implementing agent from rabbit holes
- For [Admin] tickets, the acceptance criteria should be verifiable steps, not just "it's done"
- Multiple small, scoped tickets are always better than one large mixed ticket
