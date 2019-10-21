#!/usr/bin/env node

import args from 'args'
import fs from 'fs'
import util from 'util'
import path from 'path'
import { initTarget } from '../src/index'

const readdir = util.promisify(fs.readdir)
const fileAccess = util.promisify(fs.access)

const DEFAULT_TEMPLATE = 'node'

async function getTemplatesPath() {
  const pathOptions = [
    `${__dirname}/../../../templates/${DEFAULT_TEMPLATE}/package.json`,
    `${__dirname}/../templates/${DEFAULT_TEMPLATE}/package.json`
  ]
  for (let templatePath of pathOptions) {
    templatePath = path.normalize(`${path.dirname(templatePath)}/..`)
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

async function main() {
  const templatesPath = process.env['TEMPLATES_PATH'] ? process.env['TEMPLATES_PATH'] : await getTemplatesPath()
  const templates = await readdir(templatesPath, 'utf8')

  args.options([
    {
      name: 'force',
      description: 'Whether to override/remove existing configuration'
    },
    {
      name: 'template',
      description: 'Which template to use',
      defaultValue: DEFAULT_TEMPLATE,
      init: (value: string) => {
        if (!templates.includes(value)) {
          console.log(`Invalid template argument: "${value}"`)
          process.exit(255)
        }
        return value
      }
    },
    {
      name: 'verbose',
      description: 'Whether to enable verbose logging'
    }
  ])

  const commands: {
    [key: string]: {
      desc: string
      fn: (name: string, sub: string[], options: { [key: string]: any }) => void
    }
  } = {
    init: {
      desc: 'Initiates the project',
      fn: async (name: string, sub: string[], options: { [key: string]: any }) => {
        await initTarget(`${templatesPath}/${options.template}`, process.cwd(), options)
      }
    }
  }
  for (const cmd in commands) {
    const { desc, fn } = commands[cmd]
    args.command(cmd, desc, fn)
  }

  args.parse(process.argv)

  if (args.sub.length === 0 || !commands[args.sub[0]]) {
    console.log(`Unknown command: "${args.sub[0] || ''}"`)
    process.exit(255)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(255)
})
