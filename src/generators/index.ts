import type { AgentTarget } from '../types/config.js'
import { AgentsGenerator } from './agents-generator.js'
import { AiderGenerator } from './aider-generator.js'
import { AmpGenerator } from './amp-generator.js'
import type { BaseGenerator } from './base-generator.js'
import { ClaudeGenerator } from './claude-generator.js'
import { ClineGenerator } from './cline-generator.js'
import { CodexGenerator } from './codex-generator.js'
import { CodyGenerator } from './cody-generator.js'
import { ContinueGenerator } from './continue-generator.js'
import { CopilotGenerator } from './copilot-generator.js'
import { CursorGenerator } from './cursor-generator.js'
import { GeminiGenerator } from './gemini-generator.js'
import { GooseGenerator } from './goose-generator.js'
import { JunieGenerator } from './junie-generator.js'
import { OpenCodeGenerator } from './opencode-generator.js'
import { RooCodeGenerator } from './roocode-generator.js'
import { WindsurfGenerator } from './windsurf-generator.js'

const generators: Record<AgentTarget, BaseGenerator> = {
  claude: new ClaudeGenerator(),
  cursor: new CursorGenerator(),
  copilot: new CopilotGenerator(),
  windsurf: new WindsurfGenerator(),
  aider: new AiderGenerator(),
  codex: new CodexGenerator(),
  gemini: new GeminiGenerator(),
  cline: new ClineGenerator(),
  opencode: new OpenCodeGenerator(),
  roocode: new RooCodeGenerator(),
  junie: new JunieGenerator(),
  continue: new ContinueGenerator(),
  cody: new CodyGenerator(),
  agents: new AgentsGenerator(),
  goose: new GooseGenerator(),
  amp: new AmpGenerator(),
}

/** Get a generator for a specific agent */
export function getGenerator(target: AgentTarget): BaseGenerator {
  return generators[target]
}

/** Get generators for multiple targets */
export function getGenerators(targets: AgentTarget[]): BaseGenerator[] {
  return targets.map((t) => generators[t])
}
