import { BaseImporter, type ImportedConfig } from './base-importer.js'

/** Importer for .cursorrules */
export class CursorImporter extends BaseImporter {
  readonly agentName = 'cursor' as const
  readonly filePath = '.cursorrules'
  readonly displayName = 'Cursor'

  /** Parse .cursorrules content */
  parse(content: string): ImportedConfig {
    const result = this.parseMarkdown(content)

    // Cursor files often start with "You are an expert <lang> developer"
    const expertMatch = content.match(/You are an expert (\w+) developer working on ([^,.\n]+)/)
    if (expertMatch) {
      result.language = expertMatch[1]
      result.projectName = expertMatch[2]
    }

    // Parse inline "When generating code, never:" blocks
    const neverMatch = content.match(/When generating code, never:\n((?:- .+\n?)+)/)
    if (neverMatch) {
      const items = neverMatch[1].match(/^- (.+)$/gm) ?? []
      for (const item of items) {
        const text = item.slice(2).trim()
        if (!result.dontRules.includes(text)) result.dontRules.push(text)
      }
    }

    return result
  }
}
