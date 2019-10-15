#!/usr/bin/env node

import fs from "fs"
import util from "util"
import path from "path"
import { processCommand } from "../src/index"

const fileAccess = util.promisify(fs.access)

async function main(argv: string[]) {
  if (argv.length < 3) {
    console.log('setup init')
    process.exit(255)
  }
  let command = argv[2]
  let force = false
  let templatePath = process.env['TEMPLATE_PATH'] ? process.env['TEMPLATE_PATH'] : await getTemplatePath()
  await processCommand(command, templatePath, process.cwd(), force)
}

async function getTemplatePath() {
  let pathOptions = [`${__dirname}/../template/package.json`, `${__dirname}/../../../template/package.json`]
  for (let templatePath of pathOptions) {
    templatePath = path.dirname(path.normalize(templatePath))
    if (await fileAccess(templatePath, fs.constants.R_OK).then(() => true).catch(e => false)) {
      return templatePath
    }
  }
  throw Error(`Failed to find template path`)
}

main(process.argv).catch((e) => {
  console.error(e)
  process.exit(255)
})
