import boxen from 'boxen'
import chalk from 'chalk'
import ora from 'ora'
import { scan } from '../scanners/index.js'
import type { AgentTarget, AiCodingRulesConfig } from '../types/config.js'
import { DEFAULT_CONFIG } from '../types/config.js'
import { CONFIG_FILENAME, fileExists, saveConfig } from '../utils/file.js'
import { log } from '../utils/logger.js'
import * as prompt from '../utils/prompt.js'

interface InitOptions {
  manual?: boolean
  yes?: boolean
  targets?: string
}

const PROJECT_TYPES = [
  { name: 'Web App', value: 'web-app' as const },
  { name: 'API / Backend', value: 'api' as const },
  { name: 'Library', value: 'library' as const },
  { name: 'CLI Tool', value: 'cli' as const },
  { name: 'Mobile App', value: 'mobile' as const },
  { name: 'Monorepo', value: 'monorepo' as const },
  { name: 'Other', value: 'other' as const },
]

const AGENT_CHOICES = [
  { name: 'Claude Code', value: 'claude' as AgentTarget, checked: true },
  { name: 'Cursor', value: 'cursor' as AgentTarget, checked: true },
  { name: 'GitHub Copilot', value: 'copilot' as AgentTarget, checked: false },
  { name: 'Windsurf', value: 'windsurf' as AgentTarget, checked: false },
  { name: 'Aider', value: 'aider' as AgentTarget, checked: false },
  { name: 'Codex', value: 'codex' as AgentTarget, checked: false },
]

/** Init command handler */
export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd()
  const autoYes = options.yes ?? false

  // Check existing config
  const configExists = await fileExists(`${projectRoot}/${CONFIG_FILENAME}`)
  if (configExists && !autoYes) {
    const overwrite = await prompt.confirm(`${CONFIG_FILENAME} already exists. Overwrite?`, false)
    if (!overwrite) {
      log.info('Aborted.')
      return
    }
  }

  let detectedLanguage: string | null = null
  let detectedFramework: string | null = null
  let detectedRuntime: string | null = null
  let detectedPackageManager: string | null = null
  let detectedTestFramework: string | null = null

  // Step 1: Scan project (unless --manual)
  if (!options.manual) {
    const spinner = ora('Scanning your project...').start()
    try {
      const scanResult = await scan(projectRoot)
      spinner.succeed('Project scanned')

      detectedLanguage = scanResult.project.detectedLanguage
      detectedFramework = scanResult.project.detectedFramework
      detectedRuntime = scanResult.project.detectedRuntime
      detectedPackageManager = scanResult.project.detectedPackageManager
      detectedTestFramework = scanResult.project.detectedTestFramework

      // Step 2: Show detection results
      const boxContent = [
        `${chalk.bold('Project:')} ${detectedLanguage ?? 'unknown'}`,
        `${chalk.bold('Framework:')} ${detectedFramework ?? '(none detected)'}`,
        `${chalk.bold('Runtime:')} ${detectedRuntime ?? '(none detected)'}`,
        `${chalk.bold('Package Manager:')} ${detectedPackageManager ?? '(none detected)'}`,
        `${chalk.bold('Testing:')} ${detectedTestFramework ?? '(none detected)'}`,
      ].join('\n')

      console.log(
        boxen(boxContent, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          title: 'Detected Project Info',
          titleAlignment: 'center',
        }),
      )

      // Step 3: Confirm
      if (!autoYes) {
        const correct = await prompt.confirm('Does this look correct?', true)
        if (!correct) {
          options.manual = true
        }
      }
    } catch {
      spinner.fail('Scan failed, falling back to manual mode')
      options.manual = true
    }
  }

  // Manual input for language if needed
  const language =
    !options.manual && detectedLanguage
      ? detectedLanguage
      : await prompt.input('Project language:', 'typescript')

  // Step 4: Project type
  const projectType = autoYes
    ? 'library'
    : await prompt.select('What type of project is this?', PROJECT_TYPES)

  // Project name
  const projectName = autoYes
    ? detectedLanguage
      ? 'my-project'
      : 'my-project'
    : await prompt.input('Project name:', 'my-project')

  // Step 5: Agent selection
  let targets: AgentTarget[]
  if (options.targets) {
    targets = options.targets.split(',').map((t) => t.trim()) as AgentTarget[]
  } else if (autoYes) {
    targets = DEFAULT_CONFIG.targets
  } else {
    targets = await prompt.checkbox('Which AI coding tools do you use?', AGENT_CHOICES)
    if (targets.length === 0) {
      targets = DEFAULT_CONFIG.targets
    }
  }

  // Build config
  const config: AiCodingRulesConfig = {
    version: '1',
    project: {
      name: projectName,
      type: projectType,
      language,
      framework: detectedFramework ?? undefined,
      runtime: detectedRuntime ?? undefined,
      packageManager: detectedPackageManager ?? undefined,
    },
    rules: DEFAULT_CONFIG.rules,
    structure: {},
    instructions: {
      do: [],
      dont: [],
      guidelines: [],
    },
    targets,
  }

  // Step 7: Save config
  await saveConfig(projectRoot, config)

  log.blank()
  log.success(`Created ${CONFIG_FILENAME}`)
  log.blank()
  log.info('Next steps:')
  log.dim('  1. Review and customize your config')
  log.dim("  2. Run 'ai-coding-rules generate' to create agent files")
  log.blank()
}
