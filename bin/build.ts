#!/usr/bin/env node
/* eslint-disable no-console */

import yargs from 'yargs'

import { babelBuild, BuildErrorOutput, tscBuildTypings } from '../src/build'

async function main(argv: string[]): Promise<number> {
  const { _: args, ...flags } = await yargs
    .options({
      skipTypings: {
        alias: 's',
        type: 'boolean',
        default: false,
        describe: `Don't generate typings`
      }
    })
    .help()
    .parse(argv.slice(2))

  // TODO: Read root dirs from tsconfig
  const promises: Array<Promise<void>> = []

  promises.push(
    (async () => {
      await babelBuild(
        args.map(a => a.toString()),
        'build/dist'
      )
    })()
  )
  if (!flags.skipTypings) {
    promises.push(
      (async () => {
        await tscBuildTypings()
      })()
    )
  }
  await Promise.all(promises)
  return 0
}

main(process.argv)
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(error => {
    if (error instanceof BuildErrorOutput) {
      if (error.stdout.length === 0 && error.stderr.length === 0) {
        console.error('No stdout or stderr output from process')
      } else {
        if (error.stdout.length > 0) {
          console.error(error.stdout)
        }

        if (error.stderr.length > 0) {
          console.error(error.stderr)
        }
      }
    } else {
      console.error(error)
    }
    process.exit(255)
  })
