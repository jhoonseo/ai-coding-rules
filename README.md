<div align="center">

# rulegen

**One config to rule them all.**

Generate AI coding rules for 16 agents — Claude, Cursor, Copilot, Windsurf, Gemini, Cline, and more — from a single config file.

[![npm version](https://img.shields.io/npm/v/rulegen.svg)](https://www.npmjs.com/package/rulegen)
[![npm downloads](https://img.shields.io/npm/dm/rulegen.svg)](https://www.npmjs.com/package/rulegen)
[![license](https://img.shields.io/npm/l/rulegen.svg)](https://github.com/jhoonseo/rulegen/blob/main/LICENSE)

</div>

---

## The Problem

You use Claude Code **and** Cursor **and** Copilot.
Each needs its own config file. They drift out of sync.
You waste time maintaining `CLAUDE.md`, `.cursorrules`, and `copilot-instructions.md` separately.

## The Solution

```bash
npx rulegen   # That's it. Zero-arg mode does everything.
```

One config → 16 agent files, always in sync.

## Supported Agents

| Agent | Config File | Format |
|-------|-------------|--------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `CLAUDE.md` | Markdown |
| [Cursor](https://cursor.sh) | `.cursorrules` | Markdown |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md` | Markdown |
| [Windsurf](https://codeium.com/windsurf) | `.windsurfrules` | Markdown |
| [Aider](https://aider.chat) | `.aider.conf.yml` + `CONVENTIONS.md` | YAML + Markdown |
| [Codex](https://openai.com/index/codex/) | `codex.md` | Markdown |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `GEMINI.md` | Markdown |
| [Cline](https://cline.bot) | `.clinerules/project.md` | Markdown |
| [OpenCode](https://opencode.ai) | `.opencode/rules.md` | Markdown |
| [Roo Code](https://roocode.com) | `.roo/rules.md` | Markdown |
| [Junie](https://www.jetbrains.com/junie/) | `.junie/guidelines.md` | Markdown |
| [Continue.dev](https://continue.dev) | `.continue/rules.md` | Markdown |
| [Sourcegraph Cody](https://sourcegraph.com/cody) | `.vscode/cody.json` | JSON |
| [AGENTS.md](https://openai.github.io/agents-md/) | `AGENTS.md` | Markdown |
| [Goose](https://block.github.io/goose/) | `.goose/config.yaml` | YAML |
| [Amp](https://ampcode.com) | `.amp/rules.md` | Markdown |

## Features

- **Zero-Config Setup** — `npx rulegen` one command does everything
- **Smart Detection** — Auto-scans your project for language, framework, dependencies
- **16 Agents** — Every major AI coding tool supported
- **Agent-Optimized** — Each file uses the format best for that tool (Markdown, JSON, YAML)
- **Import Existing** — `rulegen import` reads your existing agent files into a config
- **Stay in Sync** — One source of truth. Change config, regenerate all files instantly
- **Fully Customizable** — Custom rules, per-agent overrides, do/don't instructions

## Quick Start

```bash
# Zero-arg mode: auto-detect → generate
npx rulegen

# Or step by step:
npx rulegen init        # Interactive project setup
npx rulegen generate    # Generate all agent files
npx rulegen doctor      # Verify everything is in sync
```

### Import existing config files

Already have `.cursorrules` or `CLAUDE.md`? Import them:

```bash
npx rulegen import                     # Auto-detect all agent files
npx rulegen import --from claude       # Import from specific agent
npx rulegen import --from cursor,copilot  # Multiple agents
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `rulegen` | Zero-arg: init (if no config) or generate (if config exists) |
| `rulegen init` | Interactive project setup and config generation |
| `rulegen generate` | Generate agent config files from config |
| `rulegen import` | Import existing agent files into rulegen.config.json |
| `rulegen sync` | Sync files (use `--watch` for auto-sync) |
| `rulegen doctor` | Validate config and check file status |

### Common options

```bash
rulegen generate --target claude,cursor  # Specific agents only
rulegen generate --dry-run               # Preview without writing
rulegen generate --force                 # Overwrite without asking
rulegen generate --diff                  # Show changes
rulegen generate --output ./out/         # Custom output directory
rulegen sync --watch                     # Auto-regenerate on config change
```

## Configuration

<details>
<summary>Full config example (click to expand)</summary>

```json
{
  "version": "1",
  "project": {
    "name": "my-app",
    "description": "A modern web application",
    "type": "web-app",
    "language": "typescript",
    "framework": "next.js",
    "runtime": "node",
    "packageManager": "pnpm"
  },
  "rules": {
    "style": {
      "indentation": "spaces",
      "indentSize": 2,
      "quotes": "single",
      "semicolons": false,
      "maxLineLength": 100,
      "trailingComma": "all"
    },
    "naming": {
      "files": "kebab-case",
      "components": "PascalCase",
      "functions": "camelCase",
      "constants": "UPPER_SNAKE_CASE",
      "types": "PascalCase"
    },
    "patterns": {
      "server-components": "Use server components by default"
    }
  },
  "structure": {
    "src/app": "Next.js App Router pages",
    "src/components": "Reusable React components",
    "src/lib": "Utility functions and shared logic"
  },
  "instructions": {
    "do": [
      "Use TypeScript strict mode",
      "Write unit tests for all functions"
    ],
    "dont": [
      "Use 'any' type",
      "Use class components"
    ],
    "guidelines": [
      "Prefer composition over inheritance"
    ]
  },
  "targets": ["claude", "cursor", "copilot", "windsurf", "gemini", "cline"],
  "overrides": {
    "claude": {
      "extraInstructions": ["Always run tests before committing"]
    }
  }
}
```

</details>

### Key sections

- **project** — Name, language, framework, runtime
- **rules** — Code style, naming conventions, patterns
- **structure** — Directory descriptions for AI context
- **instructions** — Do/Don't/Guidelines for AI behavior
- **targets** — Which agent files to generate
- **overrides** — Per-agent customizations

## How It Works

```
┌─────────────────┐     ┌──────────┐     ┌───────────────┐
│  Your Project    │────▶│ Scanner  │────▶│    Config      │
│  (auto-detect)   │     │          │     │  .json file    │
└─────────────────┘     └──────────┘     └───────┬───────┘
                                                  │
              ┌───────────────────────────────────┼───────────────────┐
              ▼         ▼         ▼         ▼     ▼     ▼            ▼
         CLAUDE.md .cursorrules copilot GEMINI.md cody.json  ... 16 agents
```

## Why rulegen?

- **Zero-config**: `npx rulegen` — one command does everything
- **Import existing**: Already have agent files? Import them, don't start over
- **16 agents**: The most comprehensive agent support available
- **Coming soon**: AI-powered rule generation

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
