/** Result of scanning a project */
export interface ScanResult {
  project: ScannedProjectInfo
  structure: ScannedStructureInfo
  git: ScannedGitInfo
  dependencies: ScannedDepsInfo
}

/** Detected project information */
export interface ScannedProjectInfo {
  detectedLanguage: string | null
  detectedFramework: string | null
  detectedRuntime: string | null
  detectedPackageManager: string | null
  detectedTestFramework: string | null
  detectedLinter: string | null
  detectedFormatter: string | null
  detectedStyleFramework: string | null
}

/** Detected directory structure */
export interface ScannedStructureInfo {
  rootFiles: string[]
  directories: string[]
  entryPoints: string[]
  configFiles: string[]
  totalFileCount: number
}

/** Detected git information */
export interface ScannedGitInfo {
  isGitRepo: boolean
  defaultBranch: string | null
  hasGitignore: boolean
  usesConventionalCommits: boolean
  hasCI: boolean
  ciPlatform: string | null
}

/** Detected dependency information */
export interface ScannedDepsInfo {
  raw: Record<string, string>
  categorized: {
    ui: string[]
    state: string[]
    styling: string[]
    api: string[]
    database: string[]
    testing: string[]
    build: string[]
    other: string[]
  }
}
