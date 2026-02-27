import type { CodeAnalysis } from '../analyzers/index.js'
import type { ScanResult } from '../types/scanner.js'

/** Build the AI prompt from scan results and code analysis */
export function buildPrompt(scanResult: ScanResult, analysis: CodeAnalysis): string {
  const sections: string[] = []

  sections.push(
    'You are an expert developer analyzing a codebase to generate optimal AI coding rules.',
  )

  // Project info from scanner
  sections.push(buildProjectSection(scanResult))

  // Config files
  sections.push(buildConfigSection(analysis))

  // Code samples
  sections.push(buildCodeSamplesSection(analysis))

  // Git history
  sections.push(buildGitSection(analysis))

  // Project structure
  sections.push(buildStructureSection(analysis))

  // Instructions
  sections.push(buildInstructionSection())

  return sections.filter(Boolean).join('\n\n')
}

function buildProjectSection(scan: ScanResult): string {
  const { project } = scan
  const lines = ['## Project Info']

  if (project.detectedLanguage) lines.push(`- Language: ${project.detectedLanguage}`)
  if (project.detectedFramework) lines.push(`- Framework: ${project.detectedFramework}`)
  if (project.detectedRuntime) lines.push(`- Runtime: ${project.detectedRuntime}`)
  if (project.detectedPackageManager)
    lines.push(`- Package Manager: ${project.detectedPackageManager}`)
  if (project.detectedTestFramework)
    lines.push(`- Test Framework: ${project.detectedTestFramework}`)
  if (project.detectedLinter) lines.push(`- Linter: ${project.detectedLinter}`)
  if (project.detectedFormatter) lines.push(`- Formatter: ${project.detectedFormatter}`)

  return lines.join('\n')
}

function buildConfigSection(analysis: CodeAnalysis): string {
  const { configFiles } = analysis
  const lines = ['## Configuration Files']

  if (configFiles.eslint) {
    lines.push(`\n### ESLint`)
    if (configFiles.eslint.extends.length > 0) {
      lines.push(`Extends: ${configFiles.eslint.extends.join(', ')}`)
    }
    if (configFiles.eslint.rules.length > 0) {
      lines.push(`Rules: ${configFiles.eslint.rules.slice(0, 20).join(', ')}`)
    }
  }

  if (configFiles.prettier) {
    lines.push(`\n### Prettier`)
    lines.push(JSON.stringify(configFiles.prettier, null, 2))
  }

  if (configFiles.tsconfig) {
    lines.push(`\n### TSConfig`)
    lines.push(`- Strict: ${configFiles.tsconfig.strict}`)
    lines.push(`- Target: ${configFiles.tsconfig.target}`)
    lines.push(`- Path aliases: ${configFiles.tsconfig.paths}`)
  }

  if (configFiles.biome) {
    lines.push(`\n### Biome`)
    lines.push(JSON.stringify(configFiles.biome, null, 2))
  }

  if (configFiles.editorconfig) {
    lines.push(`\n### EditorConfig`)
    for (const [key, value] of Object.entries(configFiles.editorconfig)) {
      lines.push(`- ${key}: ${value}`)
    }
  }

  return lines.length > 1 ? lines.join('\n') : ''
}

function buildCodeSamplesSection(analysis: CodeAnalysis): string {
  const { codePatterns } = analysis
  const lines = ['## Code Samples']

  if (codePatterns.detectedPatterns.length > 0) {
    lines.push(`\nDetected patterns: ${codePatterns.detectedPatterns.join(', ')}`)
  }

  // Include up to 5 samples to keep prompt size manageable
  const samples = codePatterns.samples.slice(0, 5)
  for (const sample of samples) {
    lines.push(`\n### ${sample.path}`)
    lines.push('```')
    lines.push(sample.snippet)
    lines.push('```')
  }

  return lines.join('\n')
}

function buildGitSection(analysis: CodeAnalysis): string {
  const { gitInfo } = analysis
  const lines = ['## Git History']

  lines.push(`- Conventional commits: ${gitInfo.isConventionalCommits ? 'yes' : 'no'}`)

  if (gitInfo.recentCommits.length > 0) {
    lines.push(`\nRecent commits:`)
    for (const commit of gitInfo.recentCommits.slice(0, 10)) {
      lines.push(`- ${commit}`)
    }
  }

  return lines.join('\n')
}

function buildStructureSection(analysis: CodeAnalysis): string {
  const { projectStructure } = analysis
  const lines = ['## Project Structure']

  if (projectStructure.tree) {
    lines.push('```')
    lines.push(projectStructure.tree)
    lines.push('```')
  }

  if (Object.keys(projectStructure.directories).length > 0) {
    lines.push('\nDirectory roles:')
    for (const [dir, role] of Object.entries(projectStructure.directories)) {
      lines.push(`- ${dir}: ${role}`)
    }
  }

  return lines.join('\n')
}

function buildInstructionSection(): string {
  return `---

Based on this analysis, generate a rulegen.config.json that includes:
1. project: accurate name, description, type, language, framework, runtime, packageManager
2. rules.style: match the actual code style (from prettier/eslint/editorconfig/biome)
3. rules.naming: match the actual naming conventions found in code
4. rules.patterns: key patterns and conventions specific to this project
5. structure: describe what each major directory contains
6. instructions.do: best practices this project follows
7. instructions.dont: anti-patterns to avoid based on the codebase
8. instructions.guidelines: project-specific development guidelines

Respond ONLY with valid JSON (no markdown fences, no explanation).
The JSON must match the rulegen.config.json schema with these fields:
{
  "version": "1",
  "project": { "name": "", "description": "", "type": "", "language": "", "framework": "", "runtime": "", "packageManager": "" },
  "rules": {
    "style": { "indentation": "spaces|tabs", "indentSize": 2, "quotes": "single|double", "semicolons": true|false },
    "naming": { "files": "", "functions": "", "constants": "", "types": "" },
    "patterns": {}
  },
  "structure": {},
  "instructions": { "do": [], "dont": [], "guidelines": [] },
  "targets": ["claude", "cursor", "copilot"]
}`
}

/** Build an explain prompt */
export function buildExplainPrompt(config: string): string {
  return `Given this rulegen.config.json:
${config}

Explain WHY each rule was chosen, based on the codebase analysis.
Format as a readable summary with sections for each major area (style, naming, patterns, instructions).
Keep it concise but informative.`
}
