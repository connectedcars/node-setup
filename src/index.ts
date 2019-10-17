import fs from 'fs'
import util from 'util'
import { updatePackageJson } from './package-json'

const copyFile = util.promisify(fs.copyFile)
const readdir = util.promisify(fs.readdir)

const templateFilesIgnore = ['package.json', 'package-lock.json']

async function copyTemplateFiles(
  templatePath: string,
  target: string,
  ignoreFiles: string[],
  options: { [key: string]: unknown } = {}
): Promise<void> {
  const force = options.force ? true : false
  const verbose = options.verbose ? true : false

  // TODO: Merge with existing files if they already exists
  // TODO: Also handle folders like .vscode
  const files = await readdir(`${templatePath}`, { withFileTypes: true })
  for (const file of files) {
    if (ignoreFiles.includes(file.name) || file.isDirectory()) {
      continue
    }
    if (verbose) {
      console.log(`  Started copying "${file.name}"`)
    }
    const flags = force ? 0 : fs.constants.COPYFILE_EXCL
    await copyFile(`${templatePath}/${file.name}`, `${target}/${file.name}`, flags).catch(() => {
      // TODO: Check that it's not because of permissions issues
      if (verbose) {
        console.log(`  Skipped copying "${file.name}" because it already exists`)
      }
    })
  }
}

export async function initTarget(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  const verbose = options.verbose ? true : false

  if (verbose) {
    console.log(`Started copying template files`)
  }
  await copyTemplateFiles(templatePath, target, templateFilesIgnore, options)
  if (verbose) {
    console.log(`Finished copying template files`)
  }

  if (verbose) {
    console.log(`Started updating package.json`)
  }
  await updatePackageJson(templatePath, target, options)
  if (verbose) {
    console.log(`Finished updating package.json`)
  }
}
