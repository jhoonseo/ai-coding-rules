import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Claude Code (CLAUDE.md) */
export class ClaudeGenerator extends BaseGenerator {
  readonly agentName = 'claude' as const
  readonly outputPath = 'CLAUDE.md'
  readonly displayName = 'Claude Code'

  /** Generate CLAUDE.md content optimized for Claude Code */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderProjectOverview(config),
      this.renderBuildCommands(config, scan),
      this.renderTechStack(config, scan),
      this.renderCodingStandards(config),
      this.renderFileStructure(config),
      this.renderPatterns(config),
      this.renderInstructions(config),
      this.renderOverrides(config),
    )}\n`
  }

  /** Claude-specific: Build commands at the top */
  private renderBuildCommands(config: AiCodingRulesConfig, scan: ScanResult): string {
    const pm = config.project.packageManager ?? scan.project.detectedPackageManager ?? 'npm'
    const run = pm === 'yarn' ? 'yarn' : `${pm} run`
    const lines = ['## Build & Test Commands', '']
    lines.push(`- Build: \`${run} build\``)
    lines.push(`- Test: \`${run} test\``)
    lines.push(`- Lint: \`${run} lint\``)
    lines.push(`- Type check: \`${run} typecheck\``)
    lines.push(`- Dev: \`${run} dev\``)
    return lines.join('\n')
  }
}
