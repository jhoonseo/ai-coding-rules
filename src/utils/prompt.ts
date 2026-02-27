import inquirer from 'inquirer'

/** Check if running in a non-interactive environment */
function isNonInteractive(): boolean {
  return !process.stdin.isTTY || process.env.CI === 'true'
}

/** Confirm yes/no question */
export async function confirm(message: string, defaultValue = true): Promise<boolean> {
  if (isNonInteractive()) return defaultValue
  const { result } = await inquirer.prompt<{ result: boolean }>([
    { type: 'confirm', name: 'result', message, default: defaultValue },
  ])
  return result
}

/** Select one from a list */
export async function select<T>(
  message: string,
  choices: { name: string; value: T }[],
): Promise<T> {
  if (isNonInteractive()) return choices[0].value
  const { result } = await inquirer.prompt<{ result: T }>([
    { type: 'list', name: 'result', message, choices },
  ])
  return result
}

/** Select multiple from a list */
export async function checkbox<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[],
): Promise<T[]> {
  if (isNonInteractive()) return choices.filter((c) => c.checked).map((c) => c.value)
  const { result } = await inquirer.prompt<{ result: T[] }>([
    { type: 'checkbox', name: 'result', message, choices },
  ])
  return result
}

/** Free text input */
export async function input(message: string, defaultValue?: string): Promise<string> {
  if (isNonInteractive()) return defaultValue ?? ''
  const { result } = await inquirer.prompt<{ result: string }>([
    { type: 'input', name: 'result', message, default: defaultValue },
  ])
  return result
}
