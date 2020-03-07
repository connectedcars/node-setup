#!/usr/bin/env node

import { babelBuild } from '../src/build'

async function main(argv: string[]): Promise<number> {
  await babelBuild(argv.slice(2), 'build/dist')
  return 0
}

main(process.argv)
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(e => {
    console.error(e)
  })
