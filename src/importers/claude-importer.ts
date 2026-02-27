import { BaseImporter, type ImportedConfig } from './base-importer.js'

/** Importer for CLAUDE.md */
export class ClaudeImporter extends BaseImporter {
  readonly agentName = 'claude' as const
  readonly filePath = 'CLAUDE.md'
  readonly displayName = 'Claude Code'

  /** Parse CLAUDE.md content */
  parse(content: string): ImportedConfig {
    return this.parseMarkdown(content)
  }
}
