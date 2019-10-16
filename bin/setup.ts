#!/usr/bin/env node

import fs from 'fs'
import util from 'util'
import path from 'path'
import { initTarget } from '../src/index'

const fileAccess = util.promisify(fs.access)

async function getTemplatePath() {
  const pathOptions = [`${__dirname}/../template/package.json`, `${__dirname}/../../../template/package.json`]
  for (let templatePath of pathOptions) {
    templatePath = path.dirname(path.normalize(templatePath))
    if (
      await fileAccess(templatePath, fs.constants.R_OK)
        .then(() => true)
        .catch(() => false)
    ) {
      return templatePath
    }
  }
  throw Error(`Failed to find template path`)
}

async function main(argv: string[]) {
  if (argv.length < 3) {
    console.log('setup init')
    process.exit(255)
  }
  const command = argv[2]
  const templatePath = process.env['TEMPLATE_PATH'] ? process.env['TEMPLATE_PATH'] : await getTemplatePath()

  switch (command) {
    case 'init': {
      await initTarget(templatePath, process.cwd(), false)
      break
    }
    case 'init-force': {
      await initTarget(templatePath, process.cwd(), true)
      break
    }
    default: {
      throw new Error(`Unknown command ${command}`)
    }
  }
}

main(process.argv).catch(e => {
  console.error(e)
  process.exit(255)
})
