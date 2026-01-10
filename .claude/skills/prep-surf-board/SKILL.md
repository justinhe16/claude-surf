---
name: prep-surf-board
description: Installs and configures all prerequisites needed for /solo-surf and /robot-surf. Handles gh, Linear MCP server, directories, and more.
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

# Linear MCP Server
cat ~/.mcp.json 2>/dev/null | grep -i linear

# Projects directory
[ -d "$HOME/Projects" ] && echo "Projects dir exists"

# Homebrew (needed for installs)
brew --version 2>/dev/null

# Node.js/npm (needed for MCP)
node --version 2>/dev/null
npm --version 2>/dev/null
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
  [ ] Linear MCP server
  [ ] Projects directory

  Already installed:
  [✓] Git
  [✓] Homebrew
  [✓] Node.js & npm

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

#### Projects Directory

```bash
mkdir -p "$HOME/Projects"
```

### Step 4: Set Up Linear MCP Server

This is REQUIRED for /robot-surf. Walk the user through getting their Linear API key:

```
═══════════════════════════════════════════════════════════════
  LINEAR MCP SERVER SETUP
═══════════════════════════════════════════════════════════════

  Robot-surf requires Linear MCP server to fetch ticket details.

  Step 1: Get your Linear API key
  ─────────────────────────────────────
  1. Visit: https://linear.app/settings/api
  2. Click "Personal API keys" section
  3. Click "Create key" or "New key"
  4. Name it "Claude Surf" (or similar)
  5. Copy the generated key (starts with lin_api_)

  Step 2: Provide the key
  ───────────────────────
  Paste your Linear API key below when prompted.

═══════════════════════════════════════════════════════════════
```

After getting the API key from the user, create or update ~/.mcp.json:

**If ~/.mcp.json doesn't exist:**
Create it with:
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

**If ~/.mcp.json exists:**
Read the existing file, merge the linear server config, and write it back. Be careful not to overwrite other MCP servers.

### Step 5: Verify Installation

After all installations, run the checks again:

```bash
echo "Verifying installation..."

# Re-run all checks
git --version
gh --version
gh auth status
cat ~/.mcp.json 2>/dev/null | grep -i linear && echo "Linear MCP: configured" || echo "Linear MCP: missing"
[ -d "$HOME/Projects" ] && echo "Projects directory: OK"
```

### Step 6: Final Report

```
═══════════════════════════════════════════════════════════════
  INSTALLATION COMPLETE
═══════════════════════════════════════════════════════════════

  Installed & Configured:
  ✓ GitHub CLI (gh)
  ✓ GitHub authentication
  ✓ Linear MCP server (configured in ~/.mcp.json)
  ✓ Projects directory

═══════════════════════════════════════════════════════════════
  VERIFICATION
═══════════════════════════════════════════════════════════════

  /solo-surf:  ✓ Ready
  /robot-surf: ✓ Ready

  You're all set! Try running:

    /solo-surf feature/test-branch
    /robot-surf ENG-123

═══════════════════════════════════════════════════════════════
  CONFIGURATION FILES
═══════════════════════════════════════════════════════════════

  Linear MCP: ~/.mcp.json
  - Configured with your Linear API key
  - Used by /robot-surf to fetch ticket details

═══════════════════════════════════════════════════════════════
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Homebrew not installed | Provide install command, ask user to run manually |
| Node.js/npm not available | Suggest installing Node.js first (required for MCP) |
| gh auth fails | Explain how to retry manually with `gh auth login` |
| Permission denied | Suggest fixing permissions or check file paths |
| Linear API key invalid | Ask user to verify key from https://linear.app/settings/api |
| MCP config malformed | Validate JSON syntax before writing |

## Notes

- Always ask before installing anything
- Interactive commands (gh auth) require user input
- Linear API key is stored in ~/.mcp.json - user must consent to this
- The Linear MCP server is the ONLY supported method for Linear access
- If something fails, continue with other items and report at end
- Node.js/npm is required for the Linear MCP server (uses npx)
