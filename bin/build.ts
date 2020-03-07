#!/usr/bin/env node

import childProcess from 'child_process'
import util from 'util'

import { babelBuild } from '../src/build'

const execFile = util.promisify(childProcess.execFile)

async function main(argv: string[]): Promise<number> {
  const babelBuildPromise = babelBuild(argv.slice(2), 'build/dist')
  const tscPromise = await execFile('tsc', ['--emitDeclarationOnly'])
  const results = await Promise.all([tscPromise, babelBuildPromise])
  console.log(results[0].stdout)
  console.log(results[0].stderr)
  return 0
}

main(process.argv)
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(e => {
    console.error(e)
  })
