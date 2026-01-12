---
name: solo-surf
description: Creates a git worktree for a feature branch and opens a new terminal with Claude ready to go. Usage: /solo-surf <branch-name> [terminal]
allowed-tools: Bash, Read, Glob
---

# Solo Surf - Spawn a Feature Branch with Claude

Creates a git worktree, copies config files, and opens a new terminal window with Claude running.

## Usage

```
/solo-surf <branch-name> [terminal]
```

- `branch-name` (required): Name of the feature branch (e.g., `feature/auth`, `bugfix/login`)
- `terminal` (optional): Terminal app to open. Options: `Hyper`, `iTerm`, `Terminal`. Default: `Hyper`

## Examples

```
/solo-surf feature/user-auth
/solo-surf bugfix/payment iTerm
/solo-surf feature/dashboard Terminal
```

## Instructions

When invoked, parse the arguments:
- First argument: branch name (required)
- Second argument: terminal preference (optional, default "Hyper")

If no branch name is provided, ask the user for one.

Then execute the following steps:

### Step 1: Setup Variables

```bash
# Get repo info
MAIN_BRANCH="master"  # Change to "main" if needed
MAIN_REPO_DIR="$(git rev-parse --show-toplevel)"
REPO_NAME=$(basename "$MAIN_REPO_DIR")
WORKTREE_BASE_DIR="${HOME}/Projects"
BRANCH_NAME="<user-provided-branch>"
TERMINAL_APP="<user-provided-or-Hyper>"
# Sanitize branch name for directory (replace slashes with dashes)
SAFE_BRANCH_NAME="${BRANCH_NAME//\//-}"
WORKTREE_DIR="${WORKTREE_BASE_DIR}/${REPO_NAME}-${SAFE_BRANCH_NAME}"
```

### Step 2: Check if Worktree Exists

```bash
if [ -d "$WORKTREE_DIR" ]; then
    echo "Worktree already exists at: $WORKTREE_DIR"
    # Open existing worktree instead of creating new one
fi
```

### Step 3: Fetch and Create Worktree

```bash
git fetch origin

# Check if branch exists remotely
if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
    # Checkout existing remote branch
    git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
else
    # Create new branch from main
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$MAIN_BRANCH"
fi
```

### Step 4: Copy Config Files

Copy these files from main repo to worktree if they exist:

```bash
# .env files
for env_file in "$MAIN_REPO_DIR"/.env*; do
    [ -f "$env_file" ] && [ "$(basename "$env_file")" != ".envrc" ] && cp "$env_file" "$WORKTREE_DIR/"
done

# .envrc (direnv)
[ -f "$MAIN_REPO_DIR/.envrc" ] && cp "$MAIN_REPO_DIR/.envrc" "$WORKTREE_DIR/"

# Version files
[ -f "$MAIN_REPO_DIR/.python-version" ] && cp "$MAIN_REPO_DIR/.python-version" "$WORKTREE_DIR/"
[ -f "$MAIN_REPO_DIR/.node-version" ] && cp "$MAIN_REPO_DIR/.node-version" "$WORKTREE_DIR/"
[ -f "$MAIN_REPO_DIR/.nvmrc" ] && cp "$MAIN_REPO_DIR/.nvmrc" "$WORKTREE_DIR/"

# Claude config
if [ -d "$MAIN_REPO_DIR/.claude" ]; then
    mkdir -p "$WORKTREE_DIR/.claude"
    [ -f "$MAIN_REPO_DIR/.claude/settings.json" ] && cp "$MAIN_REPO_DIR/.claude/settings.json" "$WORKTREE_DIR/.claude/"
    [ -f "$MAIN_REPO_DIR/.claude/settings.local.json" ] && cp "$MAIN_REPO_DIR/.claude/settings.local.json" "$WORKTREE_DIR/.claude/"
fi

# MCP config
[ -f "$MAIN_REPO_DIR/.mcp.json" ] && cp "$MAIN_REPO_DIR/.mcp.json" "$WORKTREE_DIR/"
```

### Step 5: Write Metadata File

Create `.claude-surf-meta.json` to track worktree origin:

```bash
cat > "$WORKTREE_DIR/.claude-surf-meta.json" <<EOF
{
  "origin": "solo-surf",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "branchName": "$BRANCH_NAME",
  "repoName": "$REPO_NAME",
  "mainRepo": "$MAIN_REPO_DIR"
}
EOF
```

### Step 6: Open Terminal with Claude

Based on terminal preference:

**For Hyper:**
```bash
# Write status file before opening
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "statusMessage": "Coding..."
}
EOF

open -a Hyper "$WORKTREE_DIR"
echo "Opened Hyper at $WORKTREE_DIR - run 'claude' to start"
```

**For iTerm:**
```bash
# Write status file before opening
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "statusMessage": "Coding..."
}
EOF

osascript -e "
tell application \"iTerm\"
    create window with default profile
    tell current session of current window
        write text \"cd '$WORKTREE_DIR' && claude\"
    end tell
end tell
"
```

**For Terminal:**
```bash
# Write status file before opening
cat > "$WORKTREE_DIR/.claude-surf-status.json" <<EOF
{
  "status": "active",
  "lastActive": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pid": $$,
  "statusMessage": "Coding..."
}
EOF

osascript -e "
tell application \"Terminal\"
    do script \"cd '$WORKTREE_DIR' && claude\"
    activate
end tell
"
```

### Step 7: Report Success

Tell the user:
- Worktree created at: `$WORKTREE_DIR`
- Branch: `$BRANCH_NAME`
- Terminal opened: `$TERMINAL_APP`
- What config files were copied
- Note: The new Claude session is independent (no shared context)

## Notes

- If the main branch is `main` instead of `master`, adjust the `MAIN_BRANCH` variable
- The worktree is created at `~/Projects/<repo>-<branch>` (slashes in branch names are converted to dashes)
- Example: branch `feature/auth` → `~/Projects/myrepo-feature-auth`
- The new Claude session starts fresh with no context from the current session
- To clean up worktrees later, use `git worktree remove <path>` or `git worktree prune`
