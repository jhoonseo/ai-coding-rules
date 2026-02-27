<div align="center">

# rulegen

**One config to rule them all.**

Generate AI coding rules for Claude Code, Cursor, Copilot, Windsurf, Aider, and Codex — from a single config file.

[![npm version](https://img.shields.io/npm/v/rulegen.svg)](https://www.npmjs.com/package/rulegen)
[![npm downloads](https://img.shields.io/npm/dm/rulegen.svg)](https://www.npmjs.com/package/rulegen)
[![license](https://img.shields.io/npm/l/rulegen.svg)](https://github.com/jhoonseo/rulegen/blob/main/LICENSE)

<!-- ![demo](./assets/demo.gif) -->

</div>

---

## The Problem

You use Claude Code **and** Cursor **and** Copilot.
Each needs its own config file. They drift out of sync.
You waste time maintaining `CLAUDE.md`, `.cursorrules`, and `copilot-instructions.md` separately.

## The Solution

```bash
npx rulegen init      # Smart-detect your project
npx rulegen generate  # Generate all agent configs
```

That's it. One config → six agent files, always in sync.

## Supported Agents

| Agent | Config File | Status |
|-------|-------------|--------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `CLAUDE.md` | ✅ Supported |
| [Cursor](https://cursor.sh) | `.cursorrules` | ✅ Supported |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md` | ✅ Supported |
| [Windsurf](https://codeium.com/windsurf) | `.windsurfrules` | ✅ Supported |
| [Aider](https://aider.chat) | `.aider.conf.yml` + `CONVENTIONS.md` | ✅ Supported |
| [Codex](https://openai.com/index/codex/) | `codex.md` | ✅ Supported |

## Features

🔍 **Smart Detection** — Auto-scans your project for language, framework, dependencies, and structure

🎯 **Agent-Optimized** — Each file uses the format and style that works best for that specific AI tool

🔄 **Stay in Sync** — One source of truth. Change the config, regenerate all files instantly

🧩 **Fully Customizable** — Add custom rules, per-agent overrides, do/don't instructions

## Quick Start

### Install globally (optional)

```bash
npm install -g rulegen
```

### Or use directly with npx

```bash
npx rulegen init
```

This will:
1. Scan your project directory
2. Detect language, framework, and tooling
3. Ask which AI agents you use
4. Generate `rulegen.config.json`

Then generate your files:

```bash
npx rulegen generate
```

### Verify setup

```bash
npx rulegen doctor
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
  "targets": ["claude", "cursor", "copilot", "windsurf", "aider", "codex"],
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

## CLI Commands

| Command | Description |
|---------|-------------|
| `rulegen init` | Interactive project setup and config generation |
| `rulegen generate` | Generate agent config files from config |
| `rulegen sync` | Sync files (use `--watch` for auto-sync) |
| `rulegen doctor` | Validate config and check file status |

### Common options

```bash
rulegen generate --target claude,cursor  # Specific agents only
rulegen generate --dry-run               # Preview without writing
rulegen generate --force                  # Overwrite without asking
rulegen generate --diff                   # Show changes
rulegen sync --watch                      # Auto-regenerate on config change
```

## How It Works

```
┌─────────────────┐     ┌──────────┐     ┌───────────────┐
│  Your Project    │────▶│ Scanner  │────▶│    Config      │
│  (auto-detect)   │     │          │     │  .json file    │
└─────────────────┘     └──────────┘     └───────┬───────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         ▼            ▼           ▼          ▼            ▼
                    ┌─────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ ┌────────┐
                    │CLAUDE.md│ │.cursor    │ │copilot │ │.windsurf│ │codex.md│
                    │         │ │rules     │ │instr.md│ │rules    │ │        │
                    └─────────┘ └──────────┘ └────────┘ └─────────┘ └────────┘
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [self-made4](https://github.com/self-made4)
