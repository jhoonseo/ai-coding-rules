import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Gemini CLI (GEMINI.md) */
export class GeminiGenerator extends BaseGenerator {
  readonly agentName = 'gemini' as const
  readonly outputPath = 'GEMINI.md'
  readonly displayName = 'Gemini CLI'

  /** Generate GEMINI.md content */
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
