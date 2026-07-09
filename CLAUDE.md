@AGENTS.md

# Ruflo Integration

Ruflo (v3.25.6) is initialized in this project. It provides 314+ MCP tools for multi-agent orchestration, memory, swarm coordination, and workflow automation.

## MCP Server
- Configured globally at `~/.config/opencode/opencode.jsonc` (available to all projects)
- Also configured locally at `.mcp.json` (for Claude Code compatibility)
- Start manually: `npx ruflo@latest mcp start`

## Key Tools
| Tool | Purpose |
|------|---------|
| `memory_search` | Semantic vector search before starting any task |
| `memory_store` | Save patterns with embeddings after completing |
| `hooks_route` | Intelligent task routing |
| `swarm_init` | Initialize agent swarms for complex tasks |
| `agent_spawn` | Register specialized agent roles |

## Usage
Use `ToolSearch` to find and invoke ruflo MCP tools when working on multi-file tasks or complex features. Check system-reminder tags for `[INTELLIGENCE]` pattern suggestions before starting work.

## Runtime Data
- `.claude/` — Claude Code integration (agents, commands, helpers, skills, settings)
- `.claude-flow/` — V3 runtime (config, data, logs, sessions) — excluded from git
