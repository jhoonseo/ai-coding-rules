import { getConfigValue, resetConfig, setConfigValue } from '../utils/config-store.js'
import { log } from '../utils/logger.js'

interface ConfigOptions {
  args: string[]
}

/** Config command handler */
export async function configCommand(subcommand: string, options: ConfigOptions): Promise<void> {
  const args = options.args ?? []

  switch (subcommand) {
    case 'set': {
      if (args.length < 2) {
        log.error('Usage: rulegen config set <key> <value>')
        log.info('Valid keys: provider, api-key')
        return
      }
      const [key, value] = args
      await setConfigValue(key, value)
      if (key === 'api-key') {
        log.success(`Set ${key} (stored securely)`)
      } else {
        log.success(`Set ${key} = ${value}`)
      }
      break
    }

    case 'get': {
      if (args.length < 1) {
        log.error('Usage: rulegen config get <key>')
        log.info('Valid keys: provider, api-key')
        return
      }
      const [key] = args
      const value = await getConfigValue(key)
      if (value) {
        console.log(value)
      } else {
        log.dim(`${key} is not set`)
      }
      break
    }

    case 'reset': {
      await resetConfig()
      log.success('Config reset to defaults')
      break
    }

    default:
      log.error(`Unknown subcommand: ${subcommand}`)
      log.info('Available subcommands: set, get, reset')
  }
}
