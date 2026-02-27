import fs from 'node:fs/promises'
import path from 'node:path'

export interface ParsedConfigs {
  eslint?: { rules: string[]; extends: string[] }
  prettier?: Record<string, unknown>
  tsconfig?: { strict: boolean; target: string; paths: boolean }
  biome?: Record<string, unknown>
  editorconfig?: Record<string, unknown>
}

/** Read and parse JSON file safely */
async function readJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Read a file safely */
async function readText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

/** Parse ESLint config (.eslintrc.json or eslint.config.js) */
async function parseEslint(projectRoot: string): Promise<ParsedConfigs['eslint'] | undefined> {
  const candidates = ['.eslintrc.json', '.eslintrc', '.eslintrc.js', '.eslintrc.cjs']

  for (const candidate of candidates) {
    const data = await readJson(path.join(projectRoot, candidate))
    if (data) {
      const rules = data.rules ? Object.keys(data.rules as Record<string, unknown>) : []
      const ext = Array.isArray(data.extends)
        ? (data.extends as string[])
        : typeof data.extends === 'string'
          ? [data.extends]
          : []
      return { rules, extends: ext }
    }
  }

  return undefined
}

/** Parse Prettier config */
async function parsePrettier(projectRoot: string): Promise<Record<string, unknown> | undefined> {
  const candidates = ['.prettierrc', '.prettierrc.json']

  for (const candidate of candidates) {
    const data = await readJson(path.join(projectRoot, candidate))
    if (data) return data
  }

  return undefined
}

/** Parse TSConfig */
async function parseTsconfig(projectRoot: string): Promise<ParsedConfigs['tsconfig'] | undefined> {
  const data = await readJson(path.join(projectRoot, 'tsconfig.json'))
  if (!data) return undefined

  const compilerOptions = (data.compilerOptions ?? {}) as Record<string, unknown>
  return {
    strict: compilerOptions.strict === true,
    target: (compilerOptions.target as string) ?? 'unknown',
    paths: !!compilerOptions.paths,
  }
}

/** Parse Biome config */
async function parseBiome(projectRoot: string): Promise<Record<string, unknown> | undefined> {
  const data = await readJson(path.join(projectRoot, 'biome.json'))
  if (data) return data

  return (await readJson(path.join(projectRoot, 'biome.jsonc'))) ?? undefined
}

/** Parse EditorConfig */
async function parseEditorconfig(
  projectRoot: string,
): Promise<Record<string, unknown> | undefined> {
  const raw = await readText(path.join(projectRoot, '.editorconfig'))
  if (!raw) return undefined

  const result: Record<string, unknown> = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      result[key] = value
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/** Parse all config files in a project */
export async function parseConfigFiles(projectRoot: string): Promise<ParsedConfigs> {
  const [eslint, prettier, tsconfig, biome, editorconfig] = await Promise.all([
    parseEslint(projectRoot),
    parsePrettier(projectRoot),
    parseTsconfig(projectRoot),
    parseBiome(projectRoot),
    parseEditorconfig(projectRoot),
  ])

  return { eslint, prettier, tsconfig, biome, editorconfig }
}
