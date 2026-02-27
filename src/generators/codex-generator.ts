import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for OpenAI Codex (codex.md) */
export class CodexGenerator extends BaseGenerator {
  readonly agentName = 'codex' as const
  readonly outputPath = 'codex.md'
  readonly displayName = 'Codex'

  /** Generate codex.md with Instructions at the top */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderCodexInstructions(config),
      this.renderProjectSetup(config, scan),
      this.renderCodingStandards(config),
      this.renderFileStructure(config),
      this.renderPatterns(config),
      this.renderOverrides(config),
    )}\n`
  }

  /** Codex-specific: Instructions section at top */
  private renderCodexInstructions(config: AiCodingRulesConfig): string {
    const lines = ['## Instructions', '']
    lines.push(`You are working on ${config.project.name}.`)
    if (config.project.description) {
      lines.push(`${config.project.description}`)
    }

    const doRules = config.instructions?.do ?? []
    const dontRules = config.instructions?.dont ?? []

    if (doRules.length > 0) {
      lines.push('')
      for (const rule of doRules) {
        lines.push(`- ${rule}`)
      }
    }

    if (dontRules.length > 0) {
      lines.push('')
      lines.push('Do NOT:')
      for (const rule of dontRules) {
        lines.push(`- ${rule}`)
      }
    }

    return lines.join('\n')
  }

  /** Codex-specific: Project setup section */
  private renderProjectSetup(config: AiCodingRulesConfig, scan: ScanResult): string {
    const pm = config.project.packageManager ?? scan.project.detectedPackageManager ?? 'npm'
    const run = pm === 'yarn' ? 'yarn' : `${pm} run`
    const lines = ['## Project Setup', '']
    lines.push(`- Language: ${config.project.language}`)
    if (config.project.framework) lines.push(`- Framework: ${config.project.framework}`)
    if (config.project.runtime) lines.push(`- Runtime: ${config.project.runtime}`)
    lines.push(`- Package Manager: ${pm}`)
    lines.push('')
    lines.push('### Commands')
    lines.push(`- Build: \`${run} build\``)
    lines.push(`- Test: \`${run} test\``)
    lines.push(`- Lint: \`${run} lint\``)
    return lines.join('\n')
  }
}
