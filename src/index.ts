import { Command } from 'commander'
import { aiCommand } from './commands/ai.js'
import { configCommand } from './commands/config.js'
import { doctorCommand } from './commands/doctor.js'
import { generateCommand } from './commands/generate.js'
import { importCommand } from './commands/import.js'
import { initCommand } from './commands/init.js'
import { syncCommand } from './commands/sync.js'
import { CONFIG_FILENAME, fileExists } from './utils/file.js'
import { setQuiet, setVerbose } from './utils/logger.js'

const program = new Command()

program
  .name('rulegen')
  .description('One config to rule them all — generate AI coding rules for every agent.')
  .version('0.3.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.verbose) setVerbose(true)
    if (opts.quiet) setQuiet(true)
    if (opts.verbose && opts.quiet) setQuiet(false)
  })

program
  .command('init')
  .description('Initialize rulegen config by scanning your project')
  .option('--manual', 'Skip auto-detection, enter all values manually')
  .option('-y, --yes', 'Accept all defaults')
  .option('--targets <agents>', 'Comma-separated list of target agents')
  .action(initCommand)

program
  .command('generate')
  .description('Generate AI agent config files from your config')
  .option('--target <agents>', 'Comma-separated list of targets')
  .option('--dry-run', 'Preview without writing files')
  .option('--force', 'Overwrite existing files without confirmation')
  .option('--diff', 'Show diff with existing files')
  .option('--output <path>', 'Custom output directory')
  .action(generateCommand)

program
  .command('import')
  .description('Import existing agent config files into rulegen.config.json')
  .option('--from <agents>', 'Comma-separated list of agents to import from')
  .action(importCommand)

program
  .command('sync')
  .description('Sync generated files with config')
  .option('--watch', 'Watch config for changes and auto-regenerate')
  .action(syncCommand)

program.command('doctor').description('Diagnose config and generated files').action(doctorCommand)

const configCmd = program.command('config').description('Manage global configuration')

configCmd
  .command('set <key> <value>')
  .description('Set a config value (provider, api-key)')
  .action(async (key: string, value: string) => {
    await configCommand('set', { args: [key, value] })
  })

configCmd
  .command('get <key>')
  .description('Get a config value (provider, api-key)')
  .action(async (key: string) => {
    await configCommand('get', { args: [key] })
  })

configCmd
  .command('reset')
  .description('Reset global config to defaults')
  .action(async () => {
    await configCommand('reset', { args: [] })
  })

program
  .command('ai')
  .description('AI-powered rule generation from codebase analysis')
  .option('--provider <name>', 'AI provider (claude, openai, gemini)')
  .option('--dry-run', 'Generate config only, skip agent file creation')
  .option('--explain', 'Show explanation for each generated rule')
  .option('--output <path>', 'Custom output directory')
  .action(aiCommand)

// Default action: no subcommand → init or generate
async function run(): Promise<void> {
  if (process.argv.length <= 2) {
    const hasConfig = await fileExists(`${process.cwd()}/${CONFIG_FILENAME}`)
    if (hasConfig) {
      await generateCommand({ force: true })
    } else {
      await initCommand({ yes: false })
    }
    return
  }
  await program.parseAsync()
}

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n\u274C ${message}\n`)
  process.exit(1)
})
