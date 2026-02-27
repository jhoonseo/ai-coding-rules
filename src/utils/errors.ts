/** Thrown when config file is not found */
export class ConfigNotFoundError extends Error {
  constructor(path: string) {
    super(`Config file not found: ${path}`)
    this.name = 'ConfigNotFoundError'
  }
}

/** Thrown when config validation fails */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Config validation failed: ${message}`)
    this.name = 'ConfigValidationError'
  }
}

/** Thrown when project scanning fails */
export class ScanError extends Error {
  constructor(message: string) {
    super(`Scan failed: ${message}`)
    this.name = 'ScanError'
  }
}

/** Thrown when file generation fails */
export class GenerateError extends Error {
  constructor(message: string) {
    super(`Generation failed: ${message}`)
    this.name = 'GenerateError'
  }
}
