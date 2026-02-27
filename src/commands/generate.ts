import path from 'node:path'
import chalk from 'chalk'
import ora from 'ora'
import { AiderGenerator } from '../generators/aider-generator.js'
import { getGenerators } from '../generators/index.js'
import { scan } from '../scanners/index.js'
import type { AgentTarget } from '../types/config.js'
import { loadConfig, readFileOrNull, writeGeneratedFile } from '../utils/file.js'
import { log } from '../utils/logger.js'
import * as prompt from '../utils/prompt.js'

interface GenerateOptions {
  target?: string
  dryRun?: boolean
  force?: boolean
  diff?: boolean
  output?: string
}

/** Generate command handler */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  const projectRoot = process.cwd()
  const outputDir = options.output ? path.resolve(options.output) : projectRoot

  // Step 1: Load config
  const config = await loadConfig(projectRoot)

  // Step 2: Scan project
  const spinner = ora('Analyzing project...').start()
  const scanResult = await scan(projectRoot)
  spinner.succeed('Project analyzed')

  // Determine targets
  let targets = config.targets
  if (options.target) {
    targets = options.target.split(',').map((t) => t.trim()) as AgentTarget[]
  }

  const generators = getGenerators(targets)
  const startTime = Date.now()
  let generatedCount = 0
  let unchangedCount = 0

  log.blank()

  for (const gen of generators) {
    const content = gen.generate(config, scanResult)
    const filePath = path.join(outputDir, gen.outputPath)

    // Dry run
    if (options.dryRun) {
      log.info(`${chalk.bold(gen.outputPath)} (${chalk.dim('dry run')})`)
      if (options.diff) {
        console.log(chalk.dim('--- preview ---'))
        console.log(content)
        console.log(chalk.dim('--- end ---'))
      }
      generatedCount++
      continue
    }

    // Check existing file
    const existing = await readFileOrNull(filePath)

    if (existing !== null && existing === content) {
      console.log(
        `  ${chalk.yellow('\u23ED\uFE0F ')} ${gen.outputPath.padEnd(42)} ${chalk.dim('(unchanged)')}`,
      )
      unchangedCount++
      continue
    }

    if (existing !== null && !options.force) {
      const overwrite = await prompt.confirm(`${gen.outputPath} already exists. Overwrite?`, true)
      if (!overwrite) {
        unchangedCount++
        continue
      }
    }

    // Write file
    await writeGeneratedFile(outputDir, gen.outputPath, content)

    // Write CONVENTIONS.md for aider
    if (gen instanceof AiderGenerator) {
      const conventions = gen.getConventionsContent()
      await writeGeneratedFile(outputDir, 'CONVENTIONS.md', conventions)
    }

    const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1)
    console.log(
      `  ${chalk.green('\u2705')} ${gen.outputPath.padEnd(42)} ${chalk.dim(`(${sizeKB} KB)`)}`,
    )
    generatedCount++
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  log.blank()
  log.success(
    `Generated ${generatedCount} file${generatedCount !== 1 ? 's' : ''}, ${unchangedCount} unchanged in ${elapsed}s`,
  )
}
