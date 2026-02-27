import ora from 'ora'
import { detectAgentFiles, getImporter, mergeImports } from '../importers/index.js'
import type { AgentTarget, AiCodingRulesConfig } from '../types/config.js'
import { DEFAULT_CONFIG } from '../types/config.js'
import { CONFIG_FILENAME, fileExists, saveConfig } from '../utils/file.js'
import { log } from '../utils/logger.js'
import * as prompt from '../utils/prompt.js'

interface ImportOptions {
  from?: string
}

/** Import command handler */
export async function importCommand(options: ImportOptions): Promise<void> {
  const projectRoot = process.cwd()

  const spinner = ora('Scanning for agent config files...').start()
  let detected = await detectAgentFiles(projectRoot)
  spinner.succeed('Scan complete')

  // Filter by --from option
  if (options.from) {
    const requested = options.from.split(',').map((t) => t.trim()) as AgentTarget[]
    detected = detected.filter((d) => requested.includes(d.agent))
  }

  if (detected.length === 0) {
    log.warn('No agent config files found.')
    log.dim("  Run 'rulegen init' to create a config from scratch.")
    return
  }

  log.blank()
  log.info(`Found ${detected.length} agent file(s):`)
  for (const d of detected) {
    log.dim(`  - ${d.filePath} (${d.agent})`)
  }
  log.blank()

  // Parse all detected files
  const imports = detected.map((d) => {
    const importer = getImporter(d.agent, d.filePath)
    return importer.parse(d.content)
  })

  const merged = mergeImports(imports)

  // Check if config already exists
  const configPath = `${projectRoot}/${CONFIG_FILENAME}`
  if (await fileExists(configPath)) {
    const overwrite = await prompt.confirm(`${CONFIG_FILENAME} already exists. Overwrite?`, false)
    if (!overwrite) {
      log.info('Aborted.')
      return
    }
  }

  // Build config
  const config: AiCodingRulesConfig = {
    version: '1',
    project: {
      name: merged.projectName ?? 'my-project',
      type: 'other',
      language: merged.language ?? 'typescript',
      framework: merged.framework ?? undefined,
      runtime: merged.runtime ?? undefined,
      packageManager: merged.packageManager ?? undefined,
    },
    rules: {
      ...DEFAULT_CONFIG.rules,
      patterns: Object.keys(merged.patterns).length > 0 ? merged.patterns : undefined,
    },
    structure: Object.keys(merged.structure).length > 0 ? merged.structure : {},
    instructions: {
      do: merged.doRules.length > 0 ? merged.doRules : [],
      dont: merged.dontRules.length > 0 ? merged.dontRules : [],
      guidelines: merged.guidelines.length > 0 ? merged.guidelines : [],
    },
    targets: detected.map((d) => d.agent),
  }

  await saveConfig(projectRoot, config)

  log.blank()
  log.success(`Created ${CONFIG_FILENAME} from ${detected.length} agent file(s)`)
  log.dim("  Review and customize, then run 'rulegen generate' to regenerate.")
  log.blank()
}
