import path from 'node:path'
import chalk from 'chalk'
import ora from 'ora'
import { getGenerators } from '../generators/index.js'
import { scan } from '../scanners/index.js'
import { CONFIG_FILENAME, fileExists, loadConfig, readFileOrNull } from '../utils/file.js'
import { log } from '../utils/logger.js'

/** Doctor command handler */
export async function doctorCommand(): Promise<void> {
  const projectRoot = process.cwd()
  const spinner = ora('Running diagnostics...').start()

  let passed = 0
  let warnings = 0
  let errors = 0

  const pass = (msg: string) => {
    passed++
    console.log(chalk.green(`  \u2705 ${msg}`))
  }
  const warn = (msg: string) => {
    warnings++
    console.log(chalk.yellow(`  \u26A0\uFE0F  ${msg}`))
  }
  const fail = (msg: string) => {
    errors++
    console.log(chalk.red(`  \u274C ${msg}`))
  }
  const info = (msg: string) => {
    console.log(chalk.blue(`  \u2139\uFE0F  ${msg}`))
  }

  spinner.stop()
  log.blank()

  // --- Config Section ---
  console.log(chalk.bold('  Config'))
  const configPath = path.join(projectRoot, CONFIG_FILENAME)
  const configExists = await fileExists(configPath)

  if (!configExists) {
    fail(`${CONFIG_FILENAME} not found`)
    log.blank()
    log.dim(`  Run 'ai-coding-rules init' to create a config file.`)
    return
  }
  pass(`${CONFIG_FILENAME} exists`)

  let config: Awaited<ReturnType<typeof loadConfig>> | undefined
  try {
    config = await loadConfig(projectRoot)
    pass('Config schema is valid')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    fail(`Config validation failed: ${msg}`)
    return
  }

  // Validate targets
  const validTargets = ['claude', 'cursor', 'copilot', 'windsurf', 'aider', 'codex']
  const invalidTargets = config.targets.filter((t) => !validTargets.includes(t))
  if (invalidTargets.length > 0) {
    warn(`Unknown targets: ${invalidTargets.join(', ')}`)
  } else {
    pass('All target agents are supported')
  }

  log.blank()

  // --- Generated Files Section ---
  console.log(chalk.bold('  Generated Files'))

  const generators = getGenerators(config.targets)
  const scanResult = await scan(projectRoot)
  const fixes: string[] = []

  for (const gen of generators) {
    const filePath = path.join(projectRoot, gen.outputPath)
    const exists = await fileExists(filePath)

    if (!exists) {
      fail(`${gen.outputPath} is missing`)
      fixes.push(`Run 'ai-coding-rules generate --target ${gen.agentName}' to create missing file`)
      continue
    }

    // Check if in sync
    const current = await readFileOrNull(filePath)
    const expected = gen.generate(config, scanResult)

    if (current === expected) {
      pass(`${gen.outputPath} exists and is in sync`)
    } else {
      warn(`${gen.outputPath} exists but is outdated`)
      fixes.push(`Run 'ai-coding-rules generate' to update ${gen.outputPath}`)
    }
  }

  log.blank()

  // --- Project Section ---
  console.log(chalk.bold('  Project'))

  if (await fileExists(path.join(projectRoot, 'package.json'))) {
    pass('package.json found')
  } else if (await fileExists(path.join(projectRoot, 'requirements.txt'))) {
    pass('requirements.txt found')
  } else if (await fileExists(path.join(projectRoot, 'go.mod'))) {
    pass('go.mod found')
  } else {
    info('No standard project file detected')
  }

  if (scanResult.git.isGitRepo) {
    pass('Git repository detected')
  } else {
    info('Not a git repository')
  }

  if (scanResult.git.usesConventionalCommits) {
    info('Using conventional commits')
  }

  log.blank()

  // --- Summary ---
  console.log(chalk.bold('  Summary'))
  const parts: string[] = []
  if (passed > 0) parts.push(chalk.green(`${passed} passed`))
  if (warnings > 0) parts.push(chalk.yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`))
  if (errors > 0) parts.push(chalk.red(`${errors} error${errors > 1 ? 's' : ''}`))
  console.log(`  ${parts.join(', ')}`)

  if (fixes.length > 0) {
    log.blank()
    console.log(chalk.bold('  Fixes:'))
    for (const fix of fixes) {
      console.log(chalk.dim(`  \u2192 ${fix}`))
    }
  }

  log.blank()
}
