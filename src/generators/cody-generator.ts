import type { AiCodingRulesConfig } from '../types/config.js'
import type { ScanResult } from '../types/scanner.js'
import { BaseGenerator } from './base-generator.js'

/** Generator for Sourcegraph Cody (.vscode/cody.json) */
export class CodyGenerator extends BaseGenerator {
  readonly agentName = 'cody' as const
  readonly outputPath = '.vscode/cody.json'
  readonly displayName = 'Sourcegraph Cody'

  /** Generate .vscode/cody.json content */
  generate(config: AiCodingRulesConfig, scan: ScanResult): string {
    const instructions = this.buildInstructions(config, scan)
    const output = JSON.stringify({ instructions }, null, 2)
    return `${output}\n`
  }

  /** Build a single instructions string from config sections */
  private buildInstructions(config: AiCodingRulesConfig, _scan: ScanResult): string {
    const parts: string[] = []

    parts.push(`Project: ${config.project.name}`)
    if (config.project.description) parts.push(config.project.description)
    parts.push(`Language: ${config.project.language}`)
    if (config.project.framework) parts.push(`Framework: ${config.project.framework}`)
    if (config.project.runtime) parts.push(`Runtime: ${config.project.runtime}`)

    const style = config.rules?.style
    if (style) {
      if (style.indentation)
        parts.push(`Use ${style.indentSize ?? 2} ${style.indentation} for indentation.`)
      if (style.quotes) parts.push(`Use ${style.quotes} quotes.`)
      if (style.semicolons !== undefined)
        parts.push(style.semicolons ? 'Use semicolons.' : 'No semicolons.')
    }

    const naming = config.rules?.naming
    if (naming) {
      if (naming.files) parts.push(`File naming: ${naming.files}.`)
      if (naming.functions) parts.push(`Function naming: ${naming.functions}.`)
      if (naming.types) parts.push(`Type naming: ${naming.types}.`)
    }

    const entries = Object.entries(config.structure ?? {})
    if (entries.length > 0) {
      parts.push(`Project structure: ${entries.map(([d, desc]) => `${d} (${desc})`).join(', ')}.`)
    }

    const doRules = config.instructions?.do ?? []
    for (const rule of doRules) parts.push(rule)

    const dontRules = config.instructions?.dont ?? []
    if (dontRules.length > 0) {
      parts.push(`Do NOT: ${dontRules.join('; ')}.`)
    }

    const guidelines = config.instructions?.guidelines ?? []
    for (const g of guidelines) parts.push(g)

    const overrides = this.getOverrides(config)
    if (overrides?.extraInstructions) {
      for (const item of overrides.extraInstructions) parts.push(item)
    }

    return parts.join(' ')
  }
}
