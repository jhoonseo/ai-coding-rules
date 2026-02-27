import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Amp (.amp/rules.md) */
export class AmpGenerator extends BaseGenerator {
  readonly agentName = 'amp' as const
  readonly outputPath = '.amp/rules.md'
  readonly displayName = 'Amp'

  /** Generate .amp/rules.md content */
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
