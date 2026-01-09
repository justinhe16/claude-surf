---
name: global-surf
description: Installs claude-surf agents and skills globally so they're available in all your projects. Run this after cloning the repo.
allowed-tools: Bash, Read, Glob
---

# Install Claude-Surf Globally

Copies all claude-surf agents and skills to your global Claude configuration (`~/.claude/`), making them available across all projects.

## Instructions

When invoked, execute these steps:

### Step 1: Create Global Directories

```bash
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/skills
```

### Step 2: Copy Agents

```bash
cp .claude/agents/*.md ~/.claude/agents/
```

### Step 3: Copy Skills

Copy each skill directory (except global-surf itself, since it's only needed in this repo):

```bash
cp -r .claude/skills/solo-surf ~/.claude/skills/
```

### Step 4: Verify Installation

```bash
echo "=== Installed Agents ==="
ls -la ~/.claude/agents/

echo ""
echo "=== Installed Skills ==="
ls -la ~/.claude/skills/
```

### Step 5: Report Success

Tell the user what was installed:

**Agents installed to `~/.claude/agents/`:**
- orchestrator
- software-engineer
- code-reviewer

**Skills installed to `~/.claude/skills/`:**
- solo-surf

**How to use:**
- Agents: "Use the orchestrator agent to..." or Claude auto-delegates based on task
- Skills: Type `/solo-surf feature/my-branch` in any project

## Notes

- Existing files will be overwritten
- To uninstall: `rm -rf ~/.claude/agents/* ~/.claude/skills/*`
- To update: Re-run `/global-surf` after pulling latest changes
- The `/global-surf` skill itself is NOT copied (only needed in this repo)
