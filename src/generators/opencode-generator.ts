import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for OpenCode (.opencode/rules.md) */
export class OpenCodeGenerator extends BaseGenerator {
  readonly agentName = 'opencode' as const
  readonly outputPath = '.opencode/rules.md'
  readonly displayName = 'OpenCode'

  /** Generate .opencode/rules.md content */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    return `${this.joinSections(
      this.watermark(),
      this.renderProjectOverview(config),
      this.renderTechStack(config, scan),
      this.renderCodingStandards(config),
      this.renderFileStructure(config),
      this.renderPatterns(config),
      this.renderInstructions(config),
      this.renderOverrides(config),
    )}\n`
  }
}
