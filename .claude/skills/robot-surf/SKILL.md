---
name: robot-surf
description: Fully autonomous ticket implementation. Takes a Linear ticket, creates a worktree, implements the feature, handles CI/CD, runs code review, and delivers a PR ready for human eyes. Usage: /robot-surf <linear-ticket-id>
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Task, WebFetch
---

# Robot Surf - Autonomous Ticket Implementation

Takes a Linear ticket and autonomously:
1. Creates a git worktree for the feature
2. Implements the ticket using the software-engineer agent
3. Creates a PR and monitors CI/CD
4. Runs code-reviewer agent for feedback
5. Iterates until the PR is ready for human review

## Usage

```
/robot-surf <linear-ticket-id>
```

**Examples:**
```
/robot-surf ENG-123
/robot-surf PROJ-456
```

## Instructions

### Step 0: Validate Input

**If no ticket ID is provided:**
```
Error: Linear ticket ID is required.

Usage: /robot-surf <linear-ticket-id>

Examples:
  /robot-surf ENG-123
  /robot-surf PROJ-456

The ticket ID is the identifier shown in Linear (e.g., ENG-123).
```
Stop execution and return this message.

**If ticket ID format looks invalid** (should be LETTERS-NUMBERS like ABC-123):
```
Error: Invalid ticket format. Expected format: TEAM-123

Usage: /robot-surf <linear-ticket-id>

Examples:
  /robot-surf ENG-123
  /robot-surf PROJ-456
```
Stop execution and return this message.

### Step 1: Fetch Linear Ticket

Try to fetch the ticket details. There are multiple ways to do this:

**Option A: Linear MCP Server (if configured)**
If the user has a Linear MCP server configured, use it to fetch the ticket.

**Option B: Linear CLI (if installed)**
```bash
linear issue view <ticket-id>
```

**Option C: Linear API (if LINEARAPI_KEY is set)**
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issue(id: \"<ticket-id>\") { id title description state { name } } }"}'
```

**If ticket fetch fails:**
```
Error: Could not fetch Linear ticket "<ticket-id>".

Possible reasons:
1. Ticket ID doesn't exist
2. You don't have access to this ticket
3. Linear MCP server not configured
4. Network error

To configure Linear access, run /prep-surf or manually configure ~/.mcp.json:
{
  "mcpServers": {
    "linear": {
      "url": "https://mcp.linear.app/sse",
      "env": {
        "LINEAR_API_KEY": "your-linear-api-key"
      }
    }
  }
}

Get your API key from: https://linear.app/settings/api

Please verify the ticket ID and try again.
```
Stop execution and return this message.

### Step 2: Extract Ticket Details

From the fetched ticket, extract:
- **Title**: The ticket title (used for branch name and PR title)
- **Description**: Full ticket description (used as implementation spec)
- **Ticket ID**: The identifier (e.g., ENG-123)

Create a branch name from the ticket:
```
BRANCH_NAME="<ticket-id>-<slugified-title>"
# Example: ENG-123 "Add user authentication" → "ENG-123-add-user-authentication"
```

### Step 3: Create Git Worktree

Execute the same logic as /solo-surf:

```bash
# Configuration
MAIN_BRANCH="master"  # or "main"
MAIN_REPO_DIR="$(git rev-parse --show-toplevel)"
REPO_NAME=$(basename "$MAIN_REPO_DIR")
WORKTREE_BASE_DIR="${HOME}/Projects"
WORKTREE_DIR="${WORKTREE_BASE_DIR}/${REPO_NAME}-${BRANCH_NAME}"

# Check if worktree already exists
if [ -d "$WORKTREE_DIR" ]; then
    echo "Worktree already exists at: $WORKTREE_DIR"
    echo "Using existing worktree..."
else
    # Fetch and create worktree
    git fetch origin

    if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
        git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
    else
        git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$MAIN_BRANCH"
    fi
fi

# Copy config files
# (same as /solo-surf: .env*, .envrc, .python-version, .node-version, .claude/*, .mcp.json)

# Write metadata file
cat > "$WORKTREE_DIR/.claude-surf-meta.json" <<EOF
{
  "origin": "robot-surf",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "ticketId": "<ticket-id>",
  "ticketTitle": "<ticket-title>",
  "branchName": "$BRANCH_NAME",
  "repoName": "$REPO_NAME",
  "mainRepo": "$MAIN_REPO_DIR"
}
EOF
```

Report:
```
Created worktree at: $WORKTREE_DIR
Branch: $BRANCH_NAME
Metadata written: .claude-surf-meta.json
```

### Step 4: Change to Worktree Directory

```bash
cd "$WORKTREE_DIR"
```

All subsequent operations happen in the worktree.

### Step 5: Write Live Status File

Write `.claude-surf-status.json` to indicate Claude is active:

```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Starting..."
}
EOF
```

### Step 6: Spawn Software Engineer Agent

**Before spawning, update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Implementing..."
}
EOF
```

Use the Task tool to spawn the software-engineer agent with full context:

```
Spawn software-engineer agent with:

Task: Implement Linear ticket <ticket-id>

Ticket Title: <title>

Ticket Description:
<full description from Linear>

Requirements:
1. Implement the feature as described
2. Run tests until they pass
3. Create a PR with title: "<ticket-id>: <title>"
4. Include the Linear ticket link in the PR description
5. Monitor CI/CD - if checks fail, fix and push
6. Report back when PR is green and ready for review

Branch: <branch-name>
Worktree: <worktree-dir>
```

Wait for the agent to complete and return:
- PR URL
- PR number
- Summary of implementation
- CI status

**If software-engineer fails or gets stuck:**
Report the error and stop execution. Don't proceed to code review if implementation failed.

### Step 7: Verify PR and CI Status

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Waiting for CI..."
}
EOF
```

After software-engineer completes:

```bash
# Get PR number
PR_NUMBER=$(gh pr view --json number -q '.number')

# Check CI status
gh pr checks $PR_NUMBER
```

**If CI is still running:**
Poll until complete (with timeout of 15 minutes):
```bash
gh pr checks $PR_NUMBER --watch
```

**If CI fails after software-engineer's attempts:**
Report failure and stop:
```
Error: CI checks are failing and software-engineer could not resolve them.

PR: <pr-url>
Failed checks: <list of failed checks>

Please review the failures manually and re-run /robot-surf or fix manually.
```

### Step 8: Spawn Code Reviewer Agent

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Code review..."
}
EOF
```

Once CI is green, spawn the code-reviewer agent:

```
Spawn code-reviewer agent with:

Task: Review PR #<pr-number> for Linear ticket <ticket-id>

PR URL: <pr-url>

Ticket Context:
<ticket title and description>

Instructions:
1. Review the PR for quality, security, and correctness
2. Check that it properly addresses the ticket requirements
3. Post your review using gh pr review
4. If you find issues, use REQUEST_CHANGES
5. If it looks good, APPROVE the PR
6. Report back with your verdict and any comments
```

Wait for the agent to complete and return:
- Verdict: APPROVED or REQUEST_CHANGES
- Summary of feedback
- List of issues (if any)

### Step 9: Iteration Loop

**If code-reviewer returns REQUEST_CHANGES:**

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Addressing feedback..."
}
EOF
```

Spawn software-engineer again with the feedback:

```
Spawn software-engineer agent with:

Task: Address code review feedback for PR #<pr-number>

Feedback from code-reviewer:
<paste the full review feedback>

Instructions:
1. Address each piece of feedback
2. Push fixes to the PR
3. Wait for CI to pass
4. Report back when ready for re-review
```

Then spawn code-reviewer again to re-review.

**Maximum iterations: 3**

If after 3 iterations code-reviewer still requests changes:
```
Warning: Maximum review iterations (3) reached.

PR: <pr-url>
Status: Code reviewer still has concerns after 3 rounds.

Outstanding issues:
<list remaining issues>

Please review manually and address remaining concerns.
```

### Step 10: Success - PR Ready for Human Eyes

**Update final status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "ticketId": "<ticket-id>",
  "statusMessage": "Ready for merge"
}
EOF
```

When code-reviewer returns APPROVED:

```
=================================================
  PR READY FOR HUMAN REVIEW
=================================================

Ticket: <ticket-id> - <ticket-title>
PR: <pr-url>
Branch: <branch-name>

Summary:
<brief summary of what was implemented>

Review Notes:
<any notes from code-reviewer>

CI Status: All checks passing

Next Steps:
1. Click the PR link above to review
2. Merge when satisfied
3. Clean up worktree: git worktree remove <worktree-dir>

=================================================
```

## Error Handling Summary

| Error | Message |
|-------|---------|
| No ticket ID | "Error: Linear ticket ID is required..." |
| Invalid ticket format | "Error: Invalid ticket format..." |
| Ticket not fetchable | "Error: Could not fetch Linear ticket..." |
| Not in a git repo | "Error: Not in a git repository..." |
| Worktree creation fails | "Error: Could not create worktree..." |
| Software-engineer fails | "Error: Implementation failed..." |
| CI persistently fails | "Error: CI checks are failing..." |
| Max iterations reached | "Warning: Maximum review iterations reached..." |

## Notes

- This skill runs in the CURRENT terminal, not a new one (unlike /solo-surf)
- The entire workflow can take 10-30+ minutes depending on complexity
- Each agent iteration consumes API quota
- The skill creates the worktree but operates within it
- All git operations happen on the feature branch, never on main
