---
name: surf-global
description: Installs claude-surf agents globally so they're available in all your projects. Run this after cloning the repo.
allowed-tools: Bash, Read, Glob
---

# Install Claude-Surf Agents Globally

This skill copies the claude-surf agents to your global Claude configuration (`~/.claude/agents/`), making them available across all projects.

## Instructions

When invoked:

1. Create the global agents directory if it doesn't exist:
```bash
mkdir -p ~/.claude/agents
```

2. Copy all agents from this project to global:
```bash
cp .claude/agents/*.md ~/.claude/agents/
```

3. Verify installation:
```bash
ls -la ~/.claude/agents/
```

4. Report success with the list of installed agents:
   - orchestrator
   - software-engineer
   - code-reviewer

## Output

Confirm to the user:
- Which agents were installed
- Where they were installed (`~/.claude/agents/`)
- How to use them (e.g., "Use the orchestrator agent to..." or ask Claude to use a specific agent)

## Notes

- If agents already exist globally, they will be overwritten
- User can manually edit agents in `~/.claude/agents/` after installation
- To uninstall, delete the files from `~/.claude/agents/`
