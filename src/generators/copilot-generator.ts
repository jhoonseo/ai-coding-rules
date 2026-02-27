import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for GitHub Copilot (.github/copilot-instructions.md) */
export class CopilotGenerator extends BaseGenerator {
  readonly agentName = 'copilot' as const
  readonly outputPath = '.github/copilot-instructions.md'
  readonly displayName = 'GitHub Copilot'

  /** Generate copilot-instructions.md content */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderGeneralGuidelines(config, scan),
      this.renderCodingStandards(config),
      this.renderCodeExamples(config),
      this.renderFileStructure(config),
      this.renderInstructions(config),
      this.renderOverrides(config),
    )}\n`
  }

  /** Copilot-specific: General guidelines header */
  private renderGeneralGuidelines(config: AiCodingRulesConfig, scan: ScanResult): string {
    const lines = [`# ${config.project.name}`, '']
    if (config.project.description) {
      lines.push(config.project.description, '')
    }
    lines.push('## General Guidelines', '')
    lines.push(`- Use ${config.project.language} with strict type checking`)
    if (config.project.framework) lines.push(`- Follow ${config.project.framework} conventions`)
    if (scan.project.detectedTestFramework)
      lines.push(`- Write tests using ${scan.project.detectedTestFramework}`)
    return lines.join('\n')
  }

  /** Copilot-specific: Good/Bad code example pairs */
  private renderCodeExamples(config: AiCodingRulesConfig): string {
    const lang = config.project.language
    const naming = config.rules?.naming
    if (!naming) return ''

    const lines = ['## Code Examples', '']

    if (naming.functions === 'camelCase') {
      lines.push('### Preferred Pattern')
      lines.push(`\`\`\`${lang}`)
      lines.push('// Good: Use camelCase for functions')
      lines.push('export function getUserData() { ... }')
      lines.push('```')
      lines.push('')
      lines.push('### Avoid')
      lines.push(`\`\`\`${lang}`)
      lines.push('// Bad: Non-standard naming')
      lines.push('export function get_user_data() { ... }')
      lines.push('```')
    }

    return lines.join('\n')
  }
}
