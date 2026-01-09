# claude-surf

Opinionated Claude Code agents and skills for automated software development workflows.

## What's Included

### Agents
- **orchestrator** — coordinates multi-step tasks across agents
- **software-engineer** — implements code, runs tests, creates PRs, handles CI
- **code-reviewer** — reviews PRs for quality, security, and best practices

### Skills
- **/prereq-surf-check** — check if all prerequisites are installed
- **/prep-surf-board** — install missing prerequisites
- **/global-surf** — install agents and skills globally
- **/solo-surf** — spawn a git worktree with Claude in a new terminal
- **/robot-surf** — fully autonomous: Linear ticket → implemented PR

---

## Install

```bash
git clone git@github.com:justinhe16/claude-surf.git
cd claude-surf
claude
```

Then run:
```
/prereq-surf-check    # See what's missing
/prep-surf-board      # Install missing prerequisites
/global-surf          # Install agents and skills globally
```

---

## Skills

### /prereq-surf-check

Checks if all prerequisites are installed for /solo-surf and /robot-surf.

```
/prereq-surf-check
```

**Checks for:**
- Git with worktree support
- GitHub CLI (`gh`) + authentication
- Linear access (API key, CLI, or MCP)
- Terminal apps (Hyper, iTerm, Terminal)
- Projects directory

**Output:** Table showing what's installed, what's missing, and how to fix it.

### /prep-surf-board

Installs and configures all missing prerequisites.

```
/prep-surf-board
```

**Can install:**
- GitHub CLI via Homebrew
- GitHub authentication
- Linear CLI via npm
- Linear MCP server (optional)
- Projects directory

Asks for confirmation before each installation.

### /global-surf

Installs all claude-surf agents and skills to your global config.

```
/global-surf
```

**What gets installed:**

| Type | Location | Items |
|------|----------|-------|
| Agents | `~/.claude/agents/` | orchestrator, software-engineer, code-reviewer |
| Skills | `~/.claude/skills/` | solo-surf, robot-surf, prereq-surf-check, prep-surf-board |

### /solo-surf

Creates a git worktree for a feature branch and opens a new terminal with Claude ready.

```
/solo-surf <branch-name> [terminal]
```

**Arguments:**
- `branch-name` (required): The feature branch name
- `terminal` (optional): `Hyper`, `iTerm`, or `Terminal`. Default: `Hyper`

**Examples:**
```
/solo-surf feature/user-auth
/solo-surf bugfix/payment iTerm
```

### /robot-surf

Fully autonomous ticket implementation. Give it a Linear ticket, get back a PR ready for human review.

```
/robot-surf <linear-ticket-id>
```

**Examples:**
```
/robot-surf ENG-123
/robot-surf PROJ-456
```

**What it does:**
1. Fetches the Linear ticket details
2. Creates a git worktree with branch named after the ticket
3. Spawns **software-engineer** agent to implement the feature
4. Creates PR, monitors CI/CD, fixes any failures
5. Spawns **code-reviewer** agent to review the PR
6. Iterates between the two agents (max 3 rounds) until approved
7. Reports the PR URL when ready for human eyes

---

## Agents

### orchestrator

Coordinates complex tasks across specialist agents.

**The loop:**
1. Spawns software-engineer to implement
2. Waits for PR + green CI
3. Spawns code-reviewer to review
4. If issues found, spawns software-engineer with feedback
5. Repeats until both agents agree (max 3 iterations)

### software-engineer

Implements code with a test-driven feedback loop.

**Process:**
1. Understand the codebase
2. Implement the change
3. Run tests until green
4. Create PR
5. Monitor CI, fix failures
6. Report PR URL when done

### code-reviewer

Reviews code for quality, security, and correctness.

**Checks for:**
- Logic errors and edge cases
- Security vulnerabilities
- Code quality and readability
- Test coverage
- Performance issues

---

## Workflow Examples

### First time setup

```bash
> /prereq-surf-check
# Shows: gh missing, Linear CLI missing

> /prep-surf-board
# Installs gh, authenticates, installs Linear CLI

> /global-surf
# Copies agents and skills to ~/.claude/
```

### Manual: Create worktree, drive yourself

```bash
> /solo-surf feature/user-auth

# Opens new terminal at ~/Projects/myapp-feature/user-auth
# You drive Claude manually in the new session
```

### Autonomous: Ticket to PR

```bash
> /robot-surf ENG-123

# Claude takes over:
# - Creates worktree
# - Reads ticket, implements feature
# - Runs tests, creates PR
# - Monitors CI, fixes failures
# - Reviews code, addresses feedback
# - Reports: "PR #42 ready for human review"
```

---

## Customization

### Agents

Edit files in `.claude/agents/` (project) or `~/.claude/agents/` (global):

```markdown
---
name: my-agent
description: When Claude should use this agent
tools: Read, Edit, Write, Bash
model: sonnet
---

Your system prompt here...
```

### Main Branch

If your repo uses `main` instead of `master`, update the `MAIN_BRANCH` variable in the skill instructions.

---

## Structure

```
claude-surf/
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── software-engineer.md
│   │   └── code-reviewer.md
│   └── skills/
│       ├── global-surf/
│       │   └── SKILL.md
│       ├── solo-surf/
│       │   └── SKILL.md
│       ├── robot-surf/
│       │   └── SKILL.md
│       ├── prereq-surf-check/
│       │   └── SKILL.md
│       └── prep-surf-board/
│           └── SKILL.md
└── README.md
```

## License

MIT
