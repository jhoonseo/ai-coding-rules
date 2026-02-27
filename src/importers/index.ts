import fs from 'node:fs/promises'
import path from 'node:path'
import type { AgentTarget } from '../types/config.js'
import type { BaseImporter, ImportedConfig } from './base-importer.js'
import { ClaudeImporter } from './claude-importer.js'
import { CursorImporter } from './cursor-importer.js'
import { GenericImporter } from './generic-importer.js'

/** All known agent file paths for auto-detection */
const AGENT_FILE_MAP: Record<string, AgentTarget> = {
  'CLAUDE.md': 'claude',
  '.cursorrules': 'cursor',
  '.github/copilot-instructions.md': 'copilot',
  '.windsurfrules': 'windsurf',
  '.aider.conf.yml': 'aider',
  'codex.md': 'codex',
  'GEMINI.md': 'gemini',
  '.clinerules/project.md': 'cline',
  '.opencode/rules.md': 'opencode',
  '.roo/rules.md': 'roocode',
  '.junie/guidelines.md': 'junie',
  '.continue/rules.md': 'continue',
  '.vscode/cody.json': 'cody',
  'AGENTS.md': 'agents',
  '.goose/config.yaml': 'goose',
  '.amp/rules.md': 'amp',
}

/** Specialized importers for specific agents */
const importers: Partial<Record<AgentTarget, BaseImporter>> = {
  claude: new ClaudeImporter(),
  cursor: new CursorImporter(),
}

/** Get importer for an agent (falls back to generic) */
export function getImporter(agent: AgentTarget, filePath: string): BaseImporter {
  return importers[agent] ?? new GenericImporter(agent, filePath)
}

/** Auto-detect agent files in a project directory */
export async function detectAgentFiles(
  projectRoot: string,
): Promise<{ agent: AgentTarget; filePath: string; content: string }[]> {
  const found: { agent: AgentTarget; filePath: string; content: string }[] = []

  for (const [relativePath, agent] of Object.entries(AGENT_FILE_MAP)) {
    const fullPath = path.join(projectRoot, relativePath)
    try {
      const content = await fs.readFile(fullPath, 'utf-8')
      found.push({ agent, filePath: relativePath, content })
    } catch {
      // File doesn't exist, skip
    }
  }

  return found
}

/** Merge multiple imported configs into one */
export function mergeImports(imports: ImportedConfig[]): ImportedConfig {
  const merged: ImportedConfig = {
    doRules: [],
    dontRules: [],
    guidelines: [],
    structure: {},
    patterns: {},
  }

  for (const imp of imports) {
    if (imp.projectName && !merged.projectName) merged.projectName = imp.projectName
    if (imp.description && !merged.description) merged.description = imp.description
    if (imp.language && !merged.language) merged.language = imp.language
    if (imp.framework && !merged.framework) merged.framework = imp.framework
    if (imp.runtime && !merged.runtime) merged.runtime = imp.runtime
    if (imp.packageManager && !merged.packageManager) merged.packageManager = imp.packageManager

    for (const r of imp.doRules) {
      if (!merged.doRules.includes(r)) merged.doRules.push(r)
    }
    for (const r of imp.dontRules) {
      if (!merged.dontRules.includes(r)) merged.dontRules.push(r)
    }
    for (const r of imp.guidelines) {
      if (!merged.guidelines.includes(r)) merged.guidelines.push(r)
    }
    Object.assign(merged.structure, imp.structure)
    Object.assign(merged.patterns, imp.patterns)
  }

  return merged
}
