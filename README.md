# 🌊 `claude-surf` 🏄‍♂️

Opinionated Claude Code agents, skills, and commands for autonomous software development.

## Install

```bash
git clone git@github.com:justinhe16/claude-surf.git
cd claude-surf
claude
```

```
/prereq-surf-check    # check what's missing
/prep-surf-board      # install missing prerequisites
/global-surf          # install agents + skills globally
```

## Usage

| Skill | Description |
|-------|-------------|
| `/prereq-surf-check` | Check if gh, Linear CLI, etc. are installed |
| `/prep-surf-board` | Install missing prerequisites (gh, Linear CLI, etc.) |
| `/global-surf` | Copy all agents and skills to `~/.claude/` for global use |
| `/solo-surf <branch> [terminal]` | Create git worktree + open new terminal with Claude |
| `/robot-surf <ticket-id>` | Autonomous: Linear ticket → implemented PR with code review |

---

## Agents & Skills

### Agents

Agents are specialized AI assistants that Claude can delegate work to. When you are under a `/solo-surf`, you can use any of these specific agents to help your work. 

| Agent | What it does |
|-------|--------------|
| **orchestrator** | Coordinates multi-step tasks, spawns other agents, manages iteration loops |
| **software-engineer** | Implements features, runs tests, creates PRs, monitors CI, fixes failures |
| **code-reviewer** | Reviews PRs for bugs, security issues, code quality; approves or requests changes |

### Skills

Skills are slash commands that teach Claude how to do specific workflows.

| Skill | What it does |
|-------|--------------|
| **prereq-surf-check** | Checks for git, gh CLI, Linear access, terminal apps |
| **prep-surf-board** | Installs gh via Homebrew, Linear CLI via npm, handles auth |
| **global-surf** | Copies agents + skills to ~/.claude/ for use in any project |
| **solo-surf** | Creates git worktree, copies .env files, opens terminal with Claude |
| **robot-surf** | Full automation: fetch ticket → implement → PR → CI → code review → done |

### The Robot-Surf Loop

```
/robot-surf ENG-123
       │
       ▼
┌─────────────────────────────────────┐
│  1. Fetch Linear ticket             │
│  2. Create git worktree + branch    │
│  3. software-engineer implements    │
│  4. Create PR, wait for CI green    │
│  5. code-reviewer reviews           │
│  6. If issues → back to step 3      │
│  7. Repeat until approved (max 3x)  │
│  8. Report: "PR ready for review"   │
└─────────────────────────────────────┘
```

---

## Customization

Agents live in `.claude/agents/` (project) or `~/.claude/agents/` (global).

```markdown
---
name: my-agent
description: When to use this agent
tools: Read, Edit, Write, Bash
model: sonnet
---

Your system prompt here...
```

---

## Structure

```
claude-surf/
├── .claude/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── software-engineer.md
│   │   └── code-reviewer.md
│   └── skills/
│       ├── prereq-surf-check/
│       ├── prep-surf-board/
│       ├── global-surf/
│       ├── solo-surf/
│       └── robot-surf/
└── README.md
```

## License

MIT
