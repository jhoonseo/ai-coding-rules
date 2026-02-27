import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const CONFIG_DIR = path.join(os.homedir(), '.rulegen')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

export type AiProvider = 'claude' | 'openai' | 'gemini'

export interface GlobalConfig {
  provider?: AiProvider
  apiKey?: string
}

const PROVIDER_ENV_MAP: Record<AiProvider, string> = {
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
}

const VALID_PROVIDERS: AiProvider[] = ['claude', 'openai', 'gemini']

/** Read the global config file */
export async function readGlobalConfig(): Promise<GlobalConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as GlobalConfig
  } catch {
    return {}
  }
}

/** Write the global config file with restricted permissions */
export async function writeGlobalConfig(config: GlobalConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: 'utf-8',
    mode: 0o600,
  })
}

/** Set a config value */
export async function setConfigValue(key: string, value: string): Promise<void> {
  const config = await readGlobalConfig()

  if (key === 'provider') {
    if (!VALID_PROVIDERS.includes(value as AiProvider)) {
      throw new Error(`Invalid provider: ${value}. Valid providers: ${VALID_PROVIDERS.join(', ')}`)
    }
    config.provider = value as AiProvider
  } else if (key === 'api-key') {
    config.apiKey = value
  } else {
    throw new Error(`Unknown config key: ${key}. Valid keys: provider, api-key`)
  }

  await writeGlobalConfig(config)
}

/** Get a config value */
export async function getConfigValue(key: string): Promise<string | undefined> {
  const config = await readGlobalConfig()

  if (key === 'provider') return config.provider
  if (key === 'api-key') {
    if (config.apiKey) {
      return maskApiKey(config.apiKey)
    }
    return undefined
  }

  throw new Error(`Unknown config key: ${key}. Valid keys: provider, api-key`)
}

/** Reset the global config */
export async function resetConfig(): Promise<void> {
  try {
    await fs.unlink(CONFIG_PATH)
  } catch {
    // file doesn't exist, nothing to reset
  }
}

/** Resolve the API key: env var takes priority over config file */
export async function resolveApiKey(provider?: AiProvider): Promise<string | undefined> {
  const config = await readGlobalConfig()
  const resolvedProvider = provider ?? config.provider ?? 'claude'
  const envVar = PROVIDER_ENV_MAP[resolvedProvider]

  // Environment variable takes priority
  const envKey = process.env[envVar]
  if (envKey) return envKey

  return config.apiKey
}

/** Resolve the provider: explicit arg > config file > default */
export async function resolveProvider(explicit?: string): Promise<AiProvider> {
  if (explicit) {
    if (!VALID_PROVIDERS.includes(explicit as AiProvider)) {
      throw new Error(
        `Invalid provider: ${explicit}. Valid providers: ${VALID_PROVIDERS.join(', ')}`,
      )
    }
    return explicit as AiProvider
  }

  const config = await readGlobalConfig()
  return config.provider ?? 'claude'
}

/** Mask an API key for safe display */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}
