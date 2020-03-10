#!/usr/bin/env node

import args from 'args'

import { babelBuild, tscBuildTypings } from '../src/build'

async function main(argv: string[]): Promise<number> {
  args.options([
    {
      name: 'skip-typings',
      description: `Don't generate typings`
    }
  ])
  const flags = args.parse(argv)

  // TODO: Read root dirs from tsconfig

  const promises: Array<Promise<void>> = []
  promises.push(
    (async () => {
      await babelBuild(args.sub, 'build/dist')
    })()
  )
  if (!flags['skipTypings']) {
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
    console.error(e)
  })
