---
name: robot-surf-prompt
description: Fully autonomous task implementation from a prompt. Takes a freeform task description, creates a worktree, plans if needed, implements the feature, handles CI/CD, runs code review, and delivers a PR. Usage: /robot-surf-prompt "your task description"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Task, WebFetch
---

# Robot Surf Prompt - Autonomous Task Implementation

Takes a freeform task prompt and autonomously:
1. Creates a git worktree for the feature
2. Assesses task complexity using staff-engineer-planner agent
3. Creates detailed implementation plan (if complex)
4. Implements the task using the software-engineer agent
5. Creates a PR and monitors CI/CD
6. Runs code-reviewer agent for feedback
7. Iterates until the PR is ready for human review

## Usage

```
/robot-surf-prompt "your task description here"
```

**Examples:**
```
/robot-surf-prompt "Add user authentication with JWT tokens"
/robot-surf-prompt "Refactor the API client to use axios instead of fetch"
/robot-surf-prompt "Fix the bug where modal doesn't close on escape key"
/robot-surf-prompt "Implement dark mode toggle in settings"
```

## Instructions

### Step 0: Validate Input

**If no prompt is provided:**
```
Error: Task prompt is required.

Usage: /robot-surf-prompt "your task description"

Examples:
  /robot-surf-prompt "Add user authentication"
  /robot-surf-prompt "Fix memory leak in event listeners"
  /robot-surf-prompt "Refactor database layer to use Prisma"

Provide a clear, detailed description of what you want to implement.
```
Stop execution and return this message.

**If prompt is too vague (less than 10 characters):**
```
Error: Task prompt is too vague.

Please provide a detailed description of what you want to implement.

Good examples:
  "Add user authentication with JWT tokens and refresh logic"
  "Refactor the API client to use axios and add retry logic"

Bad examples:
  "fix bug"
  "update code"

Your prompt should clearly describe the goal and any important requirements.
```
Stop execution and return this message.

### Step 1: Generate Task Metadata

From the task prompt, generate:
- **Task ID**: Generate a unique ID using timestamp: `TASK-<YYYYMMDD>-<HHMMSS>` (e.g., `TASK-20260112-143022`)
- **Title**: Create a concise title from the prompt (first 50 chars, remove special chars)
- **Description**: Use the full prompt as the task description
- **Branch Name**: Create a branch name: `<task-id>-<slugified-title>`

Example:
```
Prompt: "Add user authentication with JWT tokens"

Generated:
- Task ID: TASK-20260112-143022
- Title: Add user authentication with JWT tokens
- Branch Name: TASK-20260112-143022-add-user-authentication-jwt
```

### Step 2: Create Git Worktree

Execute the same logic as /solo-surf:

```bash
# Configuration
MAIN_BRANCH="master"  # or "main"
MAIN_REPO_DIR="$(git rev-parse --show-toplevel)"
REPO_NAME=$(basename "$MAIN_REPO_DIR")
WORKTREE_BASE_DIR="${HOME}/Projects"

# Sanitize branch name for directory (replace slashes with dashes)
SAFE_BRANCH_NAME="${BRANCH_NAME//\//-}"
WORKTREE_DIR="${WORKTREE_BASE_DIR}/${REPO_NAME}-${SAFE_BRANCH_NAME}"

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
  "origin": "robot-surf-prompt",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "taskId": "<task-id>",
  "taskPrompt": "<original-prompt>",
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
Task: <task-id>
Metadata written: .claude-surf-meta.json
```

### Step 3: Change to Worktree Directory

```bash
cd "$WORKTREE_DIR"
```

All subsequent operations happen in the worktree.

### Step 4: Write Live Status File

Write `.claude-surf-status.json` to indicate Claude is active:

```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Starting..."
}
EOF
```

### Step 5: Assess Task Complexity

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Planning..."
}
EOF
```

Spawn the staff-engineer-planner agent to assess if the task needs detailed planning:

```
Spawn staff-engineer-planner agent with:

Task: Assess complexity for task <task-id>

Task Prompt:
<full original prompt>

Your job:
1. Explore the codebase to understand what this task requires
2. Determine if this is SIMPLE (can implement directly) or COMPLEX (needs planning)
3. Return your assessment with reasoning

Please provide your assessment in the standard format (ASSESSMENT: SIMPLE or COMPLEX).
```

Wait for the agent to complete and return one of:
- **ASSESSMENT: SIMPLE** - Skip detailed planning, go directly to implementation
- **ASSESSMENT: COMPLEX** - Proceed to detailed planning phase

Store the assessment result for use in next steps.

### Step 6: Create Implementation Plan (If Complex)

**This step only runs if staff-engineer-planner returned ASSESSMENT: COMPLEX**

If the task is COMPLEX, use Claude Code's built-in Plan agent to create a detailed implementation plan:

```
Spawn Plan agent with:

Task: Create implementation plan for task <task-id>

Task Prompt:
<full original prompt>

Staff Engineer Assessment:
<paste the full assessment from staff-engineer-planner>

Your job:
1. Create a detailed, step-by-step implementation plan
2. Identify all files that need to be created or modified
3. Consider architectural trade-offs and explain decisions
4. Highlight potential risks and mitigation strategies
5. Provide a clear execution order for the changes

The plan should be actionable for the software-engineer agent.
```

Wait for the Plan agent to complete and return:
- Detailed implementation plan
- List of files to modify
- Architectural decisions
- Risk assessment

Store the plan for passing to software-engineer in the next step.

**If the task is SIMPLE, skip this step entirely** and proceed directly to Step 7.

### Step 7: Spawn Software Engineer Agent

**Before spawning, update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Implementing..."
}
EOF
```

Use the Task tool to spawn the software-engineer agent with full context.

**If a plan was created (COMPLEX task):**

```
Spawn software-engineer agent with:

Task: <task-id>

Task Prompt:
<full original prompt>

Implementation Plan:
<paste the full plan from the Plan agent>

Requirements:
1. Follow the implementation plan provided
2. Implement the feature as described in the prompt
3. Run tests until they pass
4. Create a PR with title: "<task-id>: <title>"
5. Include the task prompt in the PR description
6. Monitor CI/CD - if checks fail, fix and push
7. Report back when PR is green and ready for review

Branch: <branch-name>
Worktree: <worktree-dir>
```

**If no plan (SIMPLE task):**

```
Spawn software-engineer agent with:

Task: <task-id>

Task Prompt:
<full original prompt>

Requirements:
1. Implement the feature as described in the prompt
2. Run tests until they pass
3. Create a PR with title: "<task-id>: <title>"
4. Include the task prompt in the PR description
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

### Step 8: Verify PR and CI Status

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
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

Please review the failures manually and re-run /robot-surf-prompt or fix manually.
```

### Step 9: Spawn Code Reviewer Agent

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Code review..."
}
EOF
```

Once CI is green, spawn the code-reviewer agent:

```
Spawn code-reviewer agent with:

Task: Review PR #<pr-number> for task <task-id>

PR URL: <pr-url>

Task Prompt:
<original prompt>

Instructions:
1. Review the PR for quality, security, and correctness
2. Check that it properly addresses the task requirements
3. Post your review using gh pr review
4. If you find issues, use REQUEST_CHANGES
5. If it looks good, APPROVE the PR
6. Report back with your verdict and any comments
```

Wait for the agent to complete and return:
- Verdict: APPROVED or REQUEST_CHANGES
- Summary of feedback
- List of issues (if any)

### Step 10: Iteration Loop

**If code-reviewer returns REQUEST_CHANGES:**

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
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
Task: <task-id>
Status: Code reviewer still has concerns after 3 rounds.

Outstanding issues:
<list remaining issues>

Please review manually and address remaining concerns.
```

### Step 11: Announce PR Ready and Start Human Review Monitoring

**Update status:**
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Awaiting human review"
}
EOF
```

When code-reviewer returns APPROVED:

```
=================================================
  PR READY FOR HUMAN REVIEW
=================================================

Task: <task-id>
Prompt: <original prompt>
PR: <pr-url>
Branch: <branch-name>

Summary:
<brief summary of what was implemented>

Review Notes:
<any notes from code-reviewer>

CI Status: All checks passing

Now monitoring for human review feedback...
Will automatically address any review comments.

=================================================
```

### Step 12: Poll for Human Reviews

After announcing the PR is ready, continuously poll for human review feedback.

**Polling logic:**
```bash
PR_NUMBER=$(gh pr view --json number -q '.number')
ITERATION_COUNT=0
MAX_ITERATIONS=10
START_TIME=$(date +%s)
MAX_DURATION=7200  # 2 hours in seconds

while true; do
  # Check elapsed time
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  if [ $ELAPSED -gt $MAX_DURATION ]; then
    echo "Timeout: Stopped monitoring after 2 hours"
    break
  fi

  # Check PR state
  PR_STATE=$(gh pr view $PR_NUMBER --json state -q '.state')

  if [ "$PR_STATE" = "MERGED" ]; then
    echo "PR has been merged! 🎉"
    break
  elif [ "$PR_STATE" = "CLOSED" ]; then
    echo "PR has been closed."
    break
  fi

  # Check for human reviews
  REVIEWS=$(gh pr view $PR_NUMBER --json reviews -q '.reviews[] | select(.author.login != "github-actions[bot]") | {author: .author.login, state: .state, body: .body}')

  # Check if there are any REQUEST_CHANGES reviews
  NEEDS_CHANGES=$(echo "$REVIEWS" | grep -c "REQUEST_CHANGES" || true)

  if [ "$NEEDS_CHANGES" -gt 0 ]; then
    # Extract review comments
    REVIEW_COMMENTS=$(gh pr view $PR_NUMBER --json reviews -q '.reviews[] | select(.state == "CHANGES_REQUESTED") | "**@\(.author.login):**\n\(.body)\n"')

    # Also get inline comments from reviews
    INLINE_COMMENTS=$(gh pr view $PR_NUMBER --json reviews -q '.reviews[].comments[]? | "**\(.path):\(.line)**\n\(.body)\n"')

    # Also get general PR comments
    PR_COMMENTS=$(gh pr view $PR_NUMBER --json comments -q '.comments[] | select(.author.login != "github-actions[bot]") | "**@\(.author.login):**\n\(.body)\n"')

    ITERATION_COUNT=$((ITERATION_COUNT + 1))

    if [ $ITERATION_COUNT -gt $MAX_ITERATIONS ]; then
      echo "Maximum iterations ($MAX_ITERATIONS) reached. Stopping automated fixes."
      break
    fi

    # Break out of bash and spawn software-engineer
    break
  fi

  # Sleep before next poll
  sleep 60
done
```

**When human requests changes:**

Update status:
```bash
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "taskId": "<task-id>",
  "statusMessage": "Addressing human feedback (round $ITERATION_COUNT)"
}
EOF
```

Spawn software-engineer to address the feedback:

```
Spawn software-engineer agent with:

Task: Address human review feedback for PR #<pr-number> (Round <iteration-count>)

Human Review Feedback:
<paste review comments, inline comments, and PR comments>

Instructions:
1. Carefully read all review comments
2. Address each piece of feedback
3. Push fixes to the PR
4. Wait for CI to pass
5. Report back when ready

Do NOT approve or merge the PR yourself - wait for human approval.
```

After software-engineer completes, return to polling (go back to start of Step 12).

**When PR is merged or closed:**
```
=================================================
  PR COMPLETED
=================================================

Task: <task-id>
PR: <pr-url>
Status: <MERGED or CLOSED>

Total human feedback rounds: <iteration-count>

Worktree cleanup:
git worktree remove <worktree-dir>

=================================================
```

**When timeout or max iterations reached:**
```
=================================================
  MONITORING STOPPED
=================================================

Task: <task-id>
PR: <pr-url>
Status: Still open, awaiting review

Reason: <Timeout after 2 hours / Maximum iterations reached>

The PR is still open. You can:
1. Continue reviewing and providing feedback manually
2. Re-run /robot-surf-prompt with the same task to resume automated fixes
3. Merge the PR if satisfied

Worktree location: <worktree-dir>
To clean up: git worktree remove <worktree-dir>

=================================================
```

## Error Handling Summary

| Error | Message |
|-------|---------|
| No prompt | "Error: Task prompt is required..." |
| Prompt too vague | "Error: Task prompt is too vague..." |
| Not in a git repo | "Error: Not in a git repository..." |
| Worktree creation fails | "Error: Could not create worktree..." |
| Software-engineer fails | "Error: Implementation failed..." |
| CI persistently fails | "Error: CI checks are failing..." |
| Max iterations reached | "Warning: Maximum review iterations reached..." |

## Notes

- This skill runs in the CURRENT terminal, not a new one (unlike /solo-surf)
- The entire workflow can take 10-30+ minutes depending on complexity
- After PR creation, the agent will poll for human reviews for up to 2 hours or 10 feedback rounds
- Each agent iteration consumes API quota
- Planning step adds 2-5 minutes but can save significant rework time for complex tasks
- Simple tasks skip detailed planning and go straight to implementation
- Task IDs are timestamp-based to ensure uniqueness
- The skill creates the worktree but operates within it (slashes in branch names are converted to dashes)
- Example: branch `TASK-20260112-143022-add-user-auth` → `~/Projects/myrepo-TASK-20260112-143022-add-user-auth`
- All git operations happen on the feature branch, never on main
- Unlike /robot-surf, this doesn't require Linear integration
- Polling checks every 60 seconds for new human review comments
- Agent automatically addresses REQUEST_CHANGES reviews by spawning software-engineer
- Monitoring stops when PR is merged, closed, timeout (2h), or max iterations (10) reached

## Comparison to /robot-surf

| Feature | /robot-surf | /robot-surf-prompt |
|---------|-------------|-------------------|
| Input | Linear ticket ID | Freeform task prompt |
| Ticket fetching | Fetches from Linear API/MCP | Generates metadata from prompt |
| Task ID | From Linear (e.g., ENG-123) | Timestamp-based (e.g., TASK-20260112-143022) |
| Planning | Yes (via staff-engineer-planner) | Yes (via staff-engineer-planner) |
| Implementation | software-engineer agent | software-engineer agent |
| Code Review | code-reviewer agent | code-reviewer agent |
| Dependencies | Requires Linear access | No external dependencies |
| Use Case | For teams using Linear | For ad-hoc tasks, personal projects |
