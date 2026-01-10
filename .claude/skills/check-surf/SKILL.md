---
name: check-surf
description: Checks if all prerequisites are installed for /solo-surf and /robot-surf. Shows what's missing and how to fix it.
allowed-tools: Bash, Read
---

# Prerequisite Check for Claude-Surf

Checks all required tools and configurations for running /solo-surf and /robot-surf.

## Instructions

Run each check below and collect results. At the end, display a summary showing what's installed, what's missing, and how to fix it.

### Check 1: Git

```bash
git --version
```

- **Required for:** /solo-surf, /robot-surf
- **Pass:** Git is installed
- **Fail:** Git not found

### Check 2: Git Worktree Support

```bash
git worktree list 2>/dev/null
```

- **Required for:** /solo-surf, /robot-surf
- **Pass:** Command works (even if not in a repo)
- **Fail:** Git version too old (needs 2.5+)

### Check 3: GitHub CLI (gh)

```bash
gh --version
```

- **Required for:** /robot-surf (PR operations)
- **Pass:** gh is installed
- **Fail:** gh not found

### Check 4: GitHub CLI Authentication

```bash
gh auth status
```

- **Required for:** /robot-surf
- **Pass:** Logged in to github.com
- **Fail:** Not authenticated

### Check 5: Linear MCP Server

Check if ~/.mcp.json exists and contains a linear server:
```bash
cat ~/.mcp.json 2>/dev/null | grep -i linear
```

- **Required for:** /robot-surf
- **Pass:** Linear MCP server is configured in ~/.mcp.json
- **Fail:** No Linear MCP server configured

### Check 6: Terminal Apps (for /solo-surf)

Check which terminal apps are available:

```bash
# Hyper
[ -d "/Applications/Hyper.app" ] && echo "Hyper: installed" || echo "Hyper: not found"

# iTerm
[ -d "/Applications/iTerm.app" ] && echo "iTerm: installed" || echo "iTerm: not found"

# Terminal.app (always available on macOS)
[ -d "/Applications/Utilities/Terminal.app" ] && echo "Terminal: installed" || echo "Terminal: not found"
```

- **Required for:** /solo-surf
- **Pass:** At least one terminal app available
- **Fail:** No supported terminal found

### Check 7: Projects Directory

```bash
[ -d "$HOME/Projects" ] && echo "exists" || echo "not found"
```

- **Required for:** /solo-surf, /robot-surf (worktree location)
- **Pass:** Directory exists
- **Fail:** Directory doesn't exist (will be created automatically, but note it)

## Output Format

Display results in a clear table:

```
═══════════════════════════════════════════════════════════════
  CLAUDE-SURF PREREQUISITE CHECK
═══════════════════════════════════════════════════════════════

  TOOL/CONFIG              STATUS          REQUIRED FOR
  ─────────────────────────────────────────────────────────────
  Git                      ✓ Installed     solo-surf, robot-surf
  Git Worktree             ✓ Supported     solo-surf, robot-surf
  GitHub CLI (gh)          ✓ Installed     robot-surf
  GitHub Auth              ✓ Logged in     robot-surf
  Linear MCP Server        ✗ Missing       robot-surf
  Terminal App             ✓ Hyper         solo-surf
  Projects Directory       ✓ Exists        solo-surf, robot-surf

═══════════════════════════════════════════════════════════════
  SUMMARY
═══════════════════════════════════════════════════════════════

  /solo-surf:  ✓ Ready
  /robot-surf: ✗ Missing prerequisites

═══════════════════════════════════════════════════════════════
  MISSING ITEMS
═══════════════════════════════════════════════════════════════

  Linear MCP Server
  ─────────────────
  Robot-surf needs Linear MCP server to fetch ticket details.

  Setup instructions:

  1. Get a Linear API key:
     https://linear.app/settings/api
     - Click "Personal API keys"
     - Create a new key (name it "Claude Surf")
     - Copy the key (starts with lin_api_)

  2. Run /prep-surf to automatically configure MCP
     OR manually create ~/.mcp.json:

     {
       "mcpServers": {
         "linear": {
           "url": "https://mcp.linear.app/sse",
           "env": {
             "LINEAR_API_KEY": "lin_api_xxxxx"
           }
         }
       }
     }

═══════════════════════════════════════════════════════════════
  NEXT STEPS
═══════════════════════════════════════════════════════════════

  Run /prep-surf to automatically install missing items.

═══════════════════════════════════════════════════════════════
```

## Notes

- Use ✓ for passing checks, ✗ for failing
- Group all missing items at the end with fix instructions
- Show which skills are ready vs blocked
- Always suggest /prep-surf at the end if anything is missing
