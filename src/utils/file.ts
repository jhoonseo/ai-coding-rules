import fs from 'node:fs/promises'
import path from 'node:path'
import type { AiCodingRulesConfig } from '../types/config.js'
import { configSchema } from '../types/config.js'
import { ConfigNotFoundError, ConfigValidationError } from './errors.js'

/** Config file name constant */
export const CONFIG_FILENAME = 'ai-coding-rules.config.json'

/** Load and validate config from project root */
export async function loadConfig(projectRoot: string): Promise<AiCodingRulesConfig> {
  const configPath = path.join(projectRoot, CONFIG_FILENAME)

  let raw: string
  try {
    raw = await fs.readFile(configPath, 'utf-8')
  } catch {
    throw new ConfigNotFoundError(configPath)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ConfigValidationError(`Invalid JSON in ${CONFIG_FILENAME}`)
  }

  try {
    return configSchema.parse(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ConfigValidationError(message)
  }
}

/** Save config to project root */
export async function saveConfig(projectRoot: string, config: AiCodingRulesConfig): Promise<void> {
  const configPath = path.join(projectRoot, CONFIG_FILENAME)
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
}

/** Write a generated file, creating directories as needed */
export async function writeGeneratedFile(
  projectRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(projectRoot, relativePath)
  const dir = path.dirname(fullPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
}

/** Check if a file exists */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/** Read a file, returning null if not found */
export async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}
