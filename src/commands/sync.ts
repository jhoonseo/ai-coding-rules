import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { CONFIG_FILENAME } from '../utils/file.js'
import { log } from '../utils/logger.js'
import { generateCommand } from './generate.js'

interface SyncOptions {
  watch?: boolean
}

/** Sync command handler */
export async function syncCommand(options: SyncOptions): Promise<void> {
  // One-time sync (same as generate --force)
  await generateCommand({ force: true })

  if (!options.watch) return

  // Watch mode
  const configPath = path.join(process.cwd(), CONFIG_FILENAME)

  log.blank()
  log.info(`Watching ${CONFIG_FILENAME} for changes...`)
  log.dim('  Press Ctrl+C to stop.')
  log.blank()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  fs.watch(configPath, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false })
      console.log(`${chalk.dim(`[${time}]`)} Config changed, regenerating...`)
      try {
        await generateCommand({ force: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log.error(`Regeneration failed: ${msg}`)
      }
    }, 300)
  })
}
