import type { AiCodingRulesConfig } from '../types/config.js'
import { configSchema } from '../types/config.js'

/** Extract JSON from AI response text */
function extractJson(text: string): string {
  // Try to extract JSON from markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return text.trim()
}

/** Parse and validate AI response into a config object */
export function parseAiResponse(text: string): AiCodingRulesConfig {
  const jsonStr = extractJson(text)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('AI response is not valid JSON. The response could not be parsed.')
  }

  // Ensure required fields exist with defaults
  const obj = parsed as Record<string, unknown>
  if (!obj.version) obj.version = '1'
  if (!obj.targets) obj.targets = ['claude', 'cursor', 'copilot']

  // Validate with Zod schema
  try {
    return configSchema.parse(obj)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`AI response does not match config schema: ${message}`)
  }
}

/** Build a retry prompt when JSON parsing fails */
export function buildRetryPrompt(originalResponse: string, error: string): string {
  return `Your previous response was not valid JSON. Error: ${error}

Original response:
${originalResponse.slice(0, 500)}

Please fix the JSON and respond ONLY with valid JSON (no markdown fences, no explanation).
The JSON must have at minimum: { "version": "1", "project": { "name": "", "type": "", "language": "" }, "targets": ["claude"] }`
}
