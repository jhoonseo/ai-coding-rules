import chalk from 'chalk'

let quietMode = false
let verboseMode = false

/** Set quiet mode (suppress success/info) */
export function setQuiet(value: boolean): void {
  quietMode = value
}

/** Set verbose mode (extra debug output) */
export function setVerbose(value: boolean): void {
  verboseMode = value
}

/** Unified logger with colored output */
export const log = {
  success: (msg: string) => {
    if (!quietMode) console.log(chalk.green('\u2705 ') + msg)
  },
  warn: (msg: string) => {
    console.log(chalk.yellow('\u26A0\uFE0F  ') + msg)
  },
  error: (msg: string) => {
    console.log(chalk.red('\u274C ') + msg)
  },
  info: (msg: string) => {
    if (!quietMode) console.log(chalk.blue('\u2139\uFE0F  ') + msg)
  },
  dim: (msg: string) => {
    if (!quietMode) console.log(chalk.dim(msg))
  },
  blank: () => {
    if (!quietMode) console.log()
  },
  verbose: (msg: string) => {
    if (verboseMode) console.log(chalk.gray(`  [verbose] ${msg}`))
  },
}
