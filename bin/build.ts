#!/usr/bin/env node

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
  .catch(e => {
    if (e instanceof BuildErrorOutput) {
      console.error(e.message)
    } else {
      console.error(e)
    }
    process.exit(255)
  })
