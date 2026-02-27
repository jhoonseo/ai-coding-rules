import ora from 'ora'
import { callAi } from '../ai/client.js'
import { buildExplainPrompt, buildPrompt } from '../ai/prompt-builder.js'
import { buildRetryPrompt, parseAiResponse } from '../ai/response-parser.js'
import { analyzeCode } from '../analyzers/index.js'
import { scan } from '../scanners/index.js'
import type { AiCodingRulesConfig } from '../types/config.js'
import { resolveApiKey, resolveProvider } from '../utils/config-store.js'
import { fileExists, loadConfig, saveConfig } from '../utils/file.js'
import { log } from '../utils/logger.js'
import * as prompt from '../utils/prompt.js'
import { generateCommand } from './generate.js'

interface AiOptions {
  provider?: string
  dryRun?: boolean
  explain?: boolean
  output?: string
}

/** AI command handler */
export async function aiCommand(options: AiOptions): Promise<void> {
  const projectRoot = process.cwd()

  // Step 1: Resolve provider and API key
  const provider = await resolveProvider(options.provider)
  const apiKey = await resolveApiKey(provider)

  if (!apiKey) {
    log.error(`No API key found for ${provider}.`)
    log.info(`Run 'rulegen config set api-key YOUR_KEY' or set ${getEnvVarName(provider)} env var`)
    process.exitCode = 1
    return
  }

  // Step 2: Analyze codebase
  const spinner = ora('Analyzing your codebase...').start()

  let scanResult: Awaited<ReturnType<typeof scan>>
  let analysis: Awaited<ReturnType<typeof analyzeCode>>

  try {
    ;[scanResult, analysis] = await Promise.all([scan(projectRoot), analyzeCode(projectRoot)])
    spinner.succeed('Codebase analyzed')
  } catch (err) {
    spinner.fail('Analysis failed')
    const message = err instanceof Error ? err.message : String(err)
    log.error(message)
    process.exitCode = 1
    return
  }

  // Step 3: Build prompt
  const aiPrompt = buildPrompt(scanResult, analysis)

  // Step 4: Call AI
  const aiSpinner = ora(`AI is generating rules (${provider})...`).start()

  let config: AiCodingRulesConfig
  try {
    const response = await callAi({ provider, apiKey, prompt: aiPrompt })

    try {
      config = parseAiResponse(response.text)
    } catch (parseError) {
      // Retry once with fix prompt
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      const retryPrompt = buildRetryPrompt(response.text, errorMsg)
      const retryResponse = await callAi({ provider, apiKey, prompt: retryPrompt })
      config = parseAiResponse(retryResponse.text)
    }

    aiSpinner.succeed('AI generated rules')
  } catch (err) {
    aiSpinner.fail('AI generation failed')
    const message = err instanceof Error ? err.message : String(err)
    log.error(message)
    process.exitCode = 1
    return
  }

  // Step 5: Check for existing config
  const configPath = `${projectRoot}/rulegen.config.json`
  if (await fileExists(configPath)) {
    const existing = await loadConfig(projectRoot)
    const merge = await prompt.confirm(
      'rulegen.config.json already exists. Merge AI results?',
      true,
    )
    if (merge) {
      config = mergeConfigs(existing, config)
    }
  }

  // Step 6: Save config
  await saveConfig(projectRoot, config)
  log.success('Generated rulegen.config.json with AI-powered rules')

  // Step 7: Explain mode
  if (options.explain) {
    const explainSpinner = ora('Generating explanation...').start()
    try {
      const explainPrompt = buildExplainPrompt(JSON.stringify(config, null, 2))
      const explainResponse = await callAi({ provider, apiKey, prompt: explainPrompt })
      explainSpinner.succeed('Explanation generated')
      log.blank()
      console.log(explainResponse.text)
      log.blank()
    } catch {
      explainSpinner.fail('Explanation generation failed')
    }
  }

  // Step 8: Generate agent files (unless dry-run)
  if (!options.dryRun) {
    await generateCommand({ force: true, output: options.output })
    log.success(`Created ${config.targets.length} agent config files`)
    log.info("Run 'rulegen doctor' to verify")
  } else {
    log.info('Dry run: skipping agent file generation')
    log.dim("Run 'rulegen generate' to create agent files")
  }
}

function getEnvVarName(provider: string): string {
  const map: Record<string, string> = {
    claude: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
  }
  return map[provider] ?? 'API_KEY'
}

/** Merge AI config into existing config, preferring existing values for project info */
function mergeConfigs(
  existing: AiCodingRulesConfig,
  aiGenerated: AiCodingRulesConfig,
): AiCodingRulesConfig {
  return {
    ...aiGenerated,
    version: existing.version,
    project: {
      ...aiGenerated.project,
      ...existing.project,
    },
    rules: {
      style: { ...aiGenerated.rules?.style, ...existing.rules?.style },
      naming: { ...aiGenerated.rules?.naming, ...existing.rules?.naming },
      patterns: { ...aiGenerated.rules?.patterns, ...existing.rules?.patterns },
    },
    structure: { ...aiGenerated.structure, ...existing.structure },
    instructions: {
      do: dedupe([...(existing.instructions?.do ?? []), ...(aiGenerated.instructions?.do ?? [])]),
      dont: dedupe([
        ...(existing.instructions?.dont ?? []),
        ...(aiGenerated.instructions?.dont ?? []),
      ]),
      guidelines: dedupe([
        ...(existing.instructions?.guidelines ?? []),
        ...(aiGenerated.instructions?.guidelines ?? []),
      ]),
    },
    targets: existing.targets,
    overrides: existing.overrides,
  }
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}
