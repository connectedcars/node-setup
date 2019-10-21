function getTime(): string {
  const d = new Date().toISOString()
  return d.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})\.\d{3}Z$/, '$1 $2 UTC')
}

function outputLog(msg: string): void {
  console.log(`${getTime()}: ${msg}`)
}

export default function log(msg: string, options: { [key: string]: unknown } = {}): void {
  const verbose = options.verbose ? true : false

  if (verbose) {
    outputLog(msg)
  }
}

export function forceLog(msg: string): void {
  outputLog(msg)
}
