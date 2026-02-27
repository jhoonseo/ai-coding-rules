import { Command } from 'commander'
import { doctorCommand } from './commands/doctor.js'
import { generateCommand } from './commands/generate.js'
import { initCommand } from './commands/init.js'
import { syncCommand } from './commands/sync.js'
import { setQuiet, setVerbose } from './utils/logger.js'

const program = new Command()

program
  .name('rulegen')
  .description('One config to rule them all — generate AI coding rules for every agent.')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.verbose) setVerbose(true)
    if (opts.quiet) setQuiet(true)
    // --verbose overrides --quiet
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
  .option('--output-dir <path>', 'Custom output directory')
  .action(generateCommand)

program
  .command('sync')
  .description('Sync generated files with config')
  .option('--watch', 'Watch config for changes and auto-regenerate')
  .action(syncCommand)

program.command('doctor').description('Diagnose config and generated files').action(doctorCommand)

// Global error handling
program.parseAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n\u274C ${message}\n`)
  process.exit(1)
})
