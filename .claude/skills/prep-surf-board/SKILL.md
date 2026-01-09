---
name: prep-surf-board
description: Installs and configures all prerequisites needed for /solo-surf and /robot-surf. Handles gh, Linear CLI, directories, and more.
allowed-tools: Bash, Read, Write, Edit
---

# Prep Surf Board - Install All Prerequisites

Automatically installs and configures everything needed for /solo-surf and /robot-surf.

## Instructions

Run checks first, then install/configure missing items. Ask the user before making changes.

### Step 1: Check What's Already Installed

Run the same checks as /prereq-surf-check to identify what's missing:

```bash
# Git
git --version 2>/dev/null

# GitHub CLI
gh --version 2>/dev/null

# GitHub Auth
gh auth status 2>/dev/null

# Linear CLI
linear --version 2>/dev/null

# LINEAR_API_KEY
[ -n "$LINEAR_API_KEY" ] && echo "LINEAR_API_KEY set"

# Linear MCP
cat ~/.mcp.json 2>/dev/null | grep -i linear
cat .mcp.json 2>/dev/null | grep -i linear

# Projects directory
[ -d "$HOME/Projects" ] && echo "Projects dir exists"

# Homebrew (needed for installs)
brew --version 2>/dev/null
```

### Step 2: Report Findings and Confirm

Show the user what will be installed:

```
═══════════════════════════════════════════════════════════════
  PREP SURF BOARD
═══════════════════════════════════════════════════════════════

  The following items need to be installed/configured:

  [ ] GitHub CLI (gh)
  [ ] GitHub authentication
  [ ] Linear CLI
  [ ] Projects directory

  Already installed:
  [✓] Git
  [✓] Homebrew

  Proceed with installation? (Will ask for confirmation at each step)
═══════════════════════════════════════════════════════════════
```

### Step 3: Install Missing Items

For each missing item, attempt to install:

#### Homebrew (if missing)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Note: This requires user interaction. If Homebrew is missing, instruct the user to install it manually first.

#### GitHub CLI

```bash
brew install gh
```

#### GitHub Authentication

```bash
gh auth login
```

Note: This is interactive. Run it and let the user complete the flow.

#### Linear CLI

```bash
npm install -g @linear/cli
```

Then authenticate:
```bash
linear auth
```

Note: This is interactive. Run it and let the user complete the flow.

#### Projects Directory

```bash
mkdir -p "$HOME/Projects"
```

### Step 4: Handle Linear MCP Server (Optional)

Ask the user if they want to set up the Linear MCP server:

```
═══════════════════════════════════════════════════════════════
  LINEAR MCP SERVER (Optional)
═══════════════════════════════════════════════════════════════

  You can also set up the Linear MCP server for richer ticket access.
  This requires a Linear API key.

  Options:
  1. Skip (Linear CLI is sufficient)
  2. Set up Linear MCP server

  Note: You'll need a Linear API key from:
  https://linear.app/settings/api
═══════════════════════════════════════════════════════════════
```

If they choose to set up MCP:

```bash
# Check if ~/.mcp.json exists
if [ -f ~/.mcp.json ]; then
    # Add Linear server to existing config
    echo "Adding Linear to existing MCP config..."
else
    # Create new config
    echo "Creating MCP config..."
fi
```

Example Linear MCP config to add:
```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@linear/mcp-server"],
      "env": {
        "LINEAR_API_KEY": "<user-provided-key>"
      }
    }
  }
}
```

### Step 5: Verify Installation

After all installations, run the checks again:

```bash
echo "Verifying installation..."

# Re-run all checks
git --version
gh --version
gh auth status
linear --version 2>/dev/null || echo "Linear CLI: not installed (optional)"
[ -d "$HOME/Projects" ] && echo "Projects directory: OK"
```

### Step 6: Final Report

```
═══════════════════════════════════════════════════════════════
  INSTALLATION COMPLETE
═══════════════════════════════════════════════════════════════

  Installed:
  ✓ GitHub CLI (gh)
  ✓ GitHub authentication
  ✓ Linear CLI
  ✓ Projects directory

  Skipped:
  - Linear MCP server (optional)

═══════════════════════════════════════════════════════════════
  VERIFICATION
═══════════════════════════════════════════════════════════════

  /solo-surf:  ✓ Ready
  /robot-surf: ✓ Ready

  You're all set! Try running:

    /solo-surf feature/test-branch
    /robot-surf ENG-123

═══════════════════════════════════════════════════════════════
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Homebrew not installed | Provide install command, ask user to run manually |
| npm not available | Suggest installing Node.js first |
| Auth fails | Explain how to retry manually |
| Permission denied | Suggest running with sudo or fixing permissions |

## Notes

- Always ask before installing anything
- Interactive commands (gh auth, linear auth) require user input
- Don't store API keys in plain text files without user consent
- Prefer CLI tools over API keys when possible (easier setup)
- If something fails, continue with other items and report at end
