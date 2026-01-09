# claude-surf

Opinionated Claude Code agents and skills for automated software development workflows.

## What's Included

### Agents
- **orchestrator** — coordinates multi-step tasks across agents
- **software-engineer** — implements code, runs tests, creates PRs, handles CI
- **code-reviewer** — reviews PRs for quality, security, and best practices

### Skills
- **/global-surf** — install agents and skills globally for use in any project
- **/solo-surf** — spawn a git worktree with Claude in a new terminal
- **/robot-surf** — fully autonomous: Linear ticket → implemented PR ready for review

---

## Install

```bash
git clone git@github.com:justinhe16/claude-surf.git
cd claude-surf
claude
```

Then run:
```
/global-surf
```

Agents and skills are now available globally in `~/.claude/`.

---

## Skills

### /global-surf

Installs all claude-surf agents and skills to your global config.

```
/global-surf
```

**What gets installed:**

| Type | Location | Items |
|------|----------|-------|
| Agents | `~/.claude/agents/` | orchestrator, software-engineer, code-reviewer |
| Skills | `~/.claude/skills/` | solo-surf, robot-surf |

Run once after cloning. Everything will be available in all your projects.

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

**What it does:**
1. Creates worktree at `~/Projects/<repo>-<branch>`
2. Copies config files (`.env*`, `.claude/*`, etc.)
3. Opens your preferred terminal at the worktree
4. Starts Claude (or prompts you to run it)

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

**Requirements:**
- Linear API access (one of):
  - `LINEAR_API_KEY` environment variable
  - Linear CLI: `npm install -g @linear/cli && linear auth`
  - Linear MCP server configured
- GitHub CLI: `gh` (for PR operations)

**Error handling:**
- No ticket ID → explains usage
- Invalid ticket format → explains expected format
- Ticket not fetchable → explains how to configure Linear access
- CI failures → reports and stops if unresolvable
- Max iterations → reports remaining issues for manual review

---

## Agents

### Usage

**Direct invocation:**
```
Use the software-engineer agent to implement user authentication
```
```
Use the code-reviewer agent to review PR #42
```

**Natural language** — Claude auto-delegates based on agent descriptions:
```
Implement the login feature, make sure tests pass, and create a PR
```

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

### Linear Access

Configure one of:
```bash
# Option 1: API key
export LINEAR_API_KEY=lin_api_xxxxx

# Option 2: CLI
npm install -g @linear/cli
linear auth

# Option 3: MCP server (in .mcp.json)
```

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
│       └── robot-surf/
│           └── SKILL.md
└── README.md
```

## License

MIT
