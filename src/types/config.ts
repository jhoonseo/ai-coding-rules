import { z } from 'zod/v4'

/** Naming convention options */
export const namingConventionSchema = z.enum([
  'camelCase',
  'PascalCase',
  'kebab-case',
  'snake_case',
  'UPPER_SNAKE_CASE',
])
export type NamingConvention = z.infer<typeof namingConventionSchema>

/** Code style rules */
export const styleRulesSchema = z.object({
  indentation: z.enum(['spaces', 'tabs']).optional(),
  indentSize: z.number().int().min(1).max(8).optional(),
  quotes: z.enum(['single', 'double']).optional(),
  semicolons: z.boolean().optional(),
  maxLineLength: z.number().int().min(40).max(200).optional(),
  trailingComma: z.enum(['all', 'es5', 'none']).optional(),
})
export type StyleRules = z.infer<typeof styleRulesSchema>

/** Naming rules */
export const namingRulesSchema = z.object({
  files: namingConventionSchema.optional(),
  components: namingConventionSchema.optional(),
  functions: namingConventionSchema.optional(),
  constants: namingConventionSchema.optional(),
  types: namingConventionSchema.optional(),
  cssClasses: namingConventionSchema.optional(),
})
export type NamingRules = z.infer<typeof namingRulesSchema>

/** Rules section */
export const rulesConfigSchema = z.object({
  style: styleRulesSchema.optional(),
  naming: namingRulesSchema.optional(),
  patterns: z.record(z.string(), z.string()).optional(),
})
export type RulesConfig = z.infer<typeof rulesConfigSchema>

/** Project configuration */
export const projectConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['web-app', 'api', 'library', 'cli', 'mobile', 'monorepo', 'other']),
  language: z.string().min(1),
  framework: z.string().optional(),
  runtime: z.string().optional(),
  packageManager: z.string().optional(),
})
export type ProjectConfig = z.infer<typeof projectConfigSchema>

/** Instructions section */
export const instructionsConfigSchema = z.object({
  do: z.array(z.string()).optional(),
  dont: z.array(z.string()).optional(),
  guidelines: z.array(z.string()).optional(),
})
export type InstructionsConfig = z.infer<typeof instructionsConfigSchema>

/** Supported AI agent targets */
export const agentTargetSchema = z.enum([
  'claude',
  'cursor',
  'copilot',
  'windsurf',
  'aider',
  'codex',
])
export type AgentTarget = z.infer<typeof agentTargetSchema>

/** Per-agent override */
export const agentOverrideSchema = z.object({
  extraInstructions: z.array(z.string()).optional(),
  excludeSections: z.array(z.string()).optional(),
})
export type AgentOverride = z.infer<typeof agentOverrideSchema>

/** Full config schema */
export const configSchema = z.object({
  $schema: z.string().optional(),
  version: z.literal('1'),
  project: projectConfigSchema,
  rules: rulesConfigSchema.optional().default({}),
  structure: z.record(z.string(), z.string()).optional().default({}),
  instructions: instructionsConfigSchema.optional().default({}),
  targets: z.array(agentTargetSchema).min(1),
  overrides: z.record(agentTargetSchema, agentOverrideSchema.optional()).optional(),
})
export type AiCodingRulesConfig = z.infer<typeof configSchema>

/** Default config values */
export const DEFAULT_CONFIG = {
  version: '1' as const,
  targets: ['claude', 'cursor', 'copilot'] as AgentTarget[],
  rules: {
    style: {
      indentation: 'spaces' as const,
      indentSize: 2,
      quotes: 'single' as const,
      semicolons: false,
    },
    naming: {
      files: 'kebab-case' as NamingConvention,
      functions: 'camelCase' as NamingConvention,
      types: 'PascalCase' as NamingConvention,
      constants: 'UPPER_SNAKE_CASE' as NamingConvention,
    },
  },
}
