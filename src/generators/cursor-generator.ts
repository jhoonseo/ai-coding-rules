import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Cursor (.cursorrules) */
export class CursorGenerator extends BaseGenerator {
  readonly agentName = 'cursor' as const
  readonly outputPath = '.cursorrules'
  readonly displayName = 'Cursor'

  /** Generate .cursorrules content optimized for Cursor */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderRoleIntro(config),
      this.renderTechStack(config, scan),
      this.renderGenerationRules(config),
      this.renderFilePatterns(config),
      this.renderProjectContext(config),
      this.renderOverrides(config),
    )}\n`
  }

  /** Cursor-specific: "You are an expert..." intro */
  private renderRoleIntro(config: AiCodingRulesConfig): string {
    const desc = config.project.description ? `, a ${config.project.description}` : ''
    return `You are an expert ${config.project.language} developer working on ${config.project.name}${desc}.`
  }

  /** Cursor-specific: "When generating code, always/never" pattern */
  private renderGenerationRules(config: AiCodingRulesConfig): string {
    const lines: string[] = ['## Code Generation Rules', '']
    const doRules = config.instructions?.do ?? []
    const dontRules = config.instructions?.dont ?? []
    const style = config.rules?.style

    if (doRules.length > 0 || style) {
      lines.push('When generating code, always:')
      if (style?.quotes) lines.push(`- Use ${style.quotes} quotes`)
      if (style?.semicolons !== undefined)
        lines.push(`- ${style.semicolons ? 'Include' : 'Omit'} semicolons`)
      if (style?.indentation)
        lines.push(`- Use ${style.indentSize ?? 2} ${style.indentation} for indentation`)
      for (const rule of doRules) {
        lines.push(`- ${rule}`)
      }
    }

    if (dontRules.length > 0) {
      lines.push('', 'When generating code, never:')
      for (const rule of dontRules) {
        lines.push(`- ${rule}`)
      }
    }

    return lines.join('\n')
  }

  /** Cursor-specific: File creation patterns */
  private renderFilePatterns(config: AiCodingRulesConfig): string {
    const naming = config.rules?.naming
    if (!naming) return ''
    const lines = ['## File Patterns', '']
    if (naming.files) lines.push(`- Name files using ${naming.files}`)
    if (naming.components) lines.push(`- Name components using ${naming.components}`)
    if (naming.functions) lines.push(`- Name functions using ${naming.functions}`)
    if (naming.constants) lines.push(`- Name constants using ${naming.constants}`)
    if (naming.types) lines.push(`- Name types using ${naming.types}`)
    return lines.join('\n')
  }

  /** Cursor-specific: Project context with structure */
  private renderProjectContext(config: AiCodingRulesConfig): string {
    const structure = config.structure ?? {}
    const entries = Object.entries(structure)
    if (entries.length === 0) return ''
    const lines = ['## Project Context', '']
    for (const [dir, desc] of entries) {
      lines.push(`- ${dir}: ${desc}`)
    }
    return lines.join('\n')
  }
}
