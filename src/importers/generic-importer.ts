import type { AgentTarget } from '../types/config.js'
import { BaseImporter, type ImportedConfig } from './base-importer.js'

/** Generic importer that uses the base markdown parser */
export class GenericImporter extends BaseImporter {
  readonly agentName: AgentTarget
  readonly filePath: string
  readonly displayName: string

  constructor(agentName: AgentTarget, filePath: string) {
    super()
    this.agentName = agentName
    this.filePath = filePath
    this.displayName = agentName
  }

  /** Parse using the generic markdown parser */
  parse(content: string): ImportedConfig {
    return this.parseMarkdown(content)
  }
}
