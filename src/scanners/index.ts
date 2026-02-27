import fg from 'fast-glob'
import type { ScannedStructureInfo, ScanResult } from '../types/scanner.js'
import { scanDeps } from './deps-scanner.js'
import { scanGit } from './git-scanner.js'
import { scanProject } from './project-scanner.js'

const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'target',
  '.turbo',
  '.cache',
  'coverage',
]

const CONFIG_EXTENSIONS = [
  '*.config.*',
  '*.json',
  '*.yml',
  '*.yaml',
  '*.toml',
  '*.md',
  'Makefile',
  'Dockerfile',
  'docker-compose*',
  '.env*',
  '.*rc',
  '.*ignore',
]

/** Scan directory structure */
async function scanStructure(projectRoot: string): Promise<ScannedStructureInfo> {
  const ignorePatterns = IGNORE_DIRS.map((d) => `**/${d}/**`)

  // Get root-level files
  const rootFiles = await fg(CONFIG_EXTENSIONS, {
    cwd: projectRoot,
    dot: true,
    deep: 1,
    ignore: ignorePatterns,
    onlyFiles: true,
  })

  // Get 1-depth directories
  const directories = await fg(['*'], {
    cwd: projectRoot,
    onlyDirectories: true,
    deep: 1,
    ignore: IGNORE_DIRS,
  })

  // Find entry points
  const entryPoints = await fg(
    ['src/index.*', 'src/main.*', 'src/app.*', 'index.*', 'main.*', 'app.*'],
    {
      cwd: projectRoot,
      deep: 2,
      ignore: ignorePatterns,
    },
  )

  // Find config files
  const configFiles = await fg(['*.config.*', '.*rc', '*.json', '*.yml', '*.yaml'], {
    cwd: projectRoot,
    dot: true,
    deep: 1,
    ignore: ignorePatterns,
  })

  // Total file count
  const allFiles = await fg(['**/*'], {
    cwd: projectRoot,
    ignore: ignorePatterns,
    onlyFiles: true,
  })

  return {
    rootFiles: rootFiles.sort(),
    directories: directories.sort(),
    entryPoints: entryPoints.sort(),
    configFiles: configFiles.sort(),
    totalFileCount: allFiles.length,
  }
}

/** Scan a project and return all detected information */
export async function scan(projectRoot: string): Promise<ScanResult> {
  const [project, structure, git, dependencies] = await Promise.all([
    scanProject(projectRoot),
    scanStructure(projectRoot),
    scanGit(projectRoot),
    scanDeps(projectRoot),
  ])
  return { project, structure, git, dependencies }
}
