import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for AGENTS.md (OpenAI multi-agent format) */
export class AgentsGenerator extends BaseGenerator {
  readonly agentName = 'agents' as const
  readonly outputPath = 'AGENTS.md'
  readonly displayName = 'AGENTS.md'

  /** Generate AGENTS.md content */
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
