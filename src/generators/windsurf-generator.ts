import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Windsurf (.windsurfrules) */
export class WindsurfGenerator extends BaseGenerator {
  readonly agentName = 'windsurf' as const
  readonly outputPath = '.windsurfrules'
  readonly displayName = 'Windsurf'

  /** Generate .windsurfrules content */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderProjectOverview(config),
      this.renderTechStack(config, scan),
      this.renderRules(config),
      this.renderFileStructure(config),
      this.renderInstructions(config),
      this.renderPatterns(config),
      this.renderOverrides(config),
    )}\n`
  }

  /** Windsurf-specific: Combined rules section */
  private renderRules(config: AiCodingRulesConfig): string {
    const lines: string[] = ['## Rules', '']
    const style = config.rules?.style
    const naming = config.rules?.naming

    if (style) {
      if (style.indentation)
        lines.push(`- Indentation: ${style.indentSize ?? 2} ${style.indentation}`)
      if (style.quotes) lines.push(`- Quotes: ${style.quotes}`)
      if (style.semicolons !== undefined)
        lines.push(`- Semicolons: ${style.semicolons ? 'yes' : 'no'}`)
      if (style.maxLineLength) lines.push(`- Max line length: ${style.maxLineLength}`)
    }

    if (naming) {
      if (naming.files) lines.push(`- File naming: ${naming.files}`)
      if (naming.functions) lines.push(`- Function naming: ${naming.functions}`)
      if (naming.types) lines.push(`- Type naming: ${naming.types}`)
      if (naming.constants) lines.push(`- Constant naming: ${naming.constants}`)
    }

    return lines.join('\n')
  }
}
