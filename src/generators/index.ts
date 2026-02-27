import type { AgentTarget } from '../types/config.js'
import { AiderGenerator } from './aider-generator.js'
import type { BaseGenerator } from './base-generator.js'
import { ClaudeGenerator } from './claude-generator.js'
import { CodexGenerator } from './codex-generator.js'
import { CopilotGenerator } from './copilot-generator.js'
import { CursorGenerator } from './cursor-generator.js'
import { WindsurfGenerator } from './windsurf-generator.js'

const generators: Record<AgentTarget, BaseGenerator> = {
  claude: new ClaudeGenerator(),
  cursor: new CursorGenerator(),
  copilot: new CopilotGenerator(),
  windsurf: new WindsurfGenerator(),
  aider: new AiderGenerator(),
  codex: new CodexGenerator(),
}

/** Get a generator for a specific agent */
export function getGenerator(target: AgentTarget): BaseGenerator {
  return generators[target]
}

/** Get generators for multiple targets */
export function getGenerators(targets: AgentTarget[]): BaseGenerator[] {
  return targets.map((t) => generators[t])
}
