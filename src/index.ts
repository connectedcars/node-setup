import fs from 'fs'
import util from 'util'
import log from './log'
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

  // TODO: Merge with existing files if they already exists
  // TODO: Also handle folders like .vscode
  const files = await readdir(`${templatePath}`, { withFileTypes: true })
  for (const file of files) {
    if (ignoreFiles.includes(file.name) || file.isDirectory()) {
      continue
    }
    log(`  Started copying "${file.name}"`, options)
    const flags = force ? 0 : fs.constants.COPYFILE_EXCL
    await copyFile(`${templatePath}/${file.name}`, `${target}/${file.name}`, flags).catch(() => {
      // TODO: Check that it's not because of permissions issues
      log(`  Skipped copying "${file.name}" because it already exists`, options)
    })
  }
}

export async function initTarget(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  log(`Started copying template files`, options)
  await copyTemplateFiles(templatePath, target, templateFilesIgnore, options)
  log(`Finished copying template files`, options)

  log(`Started updating package.json`, options)
  await updatePackageJson(templatePath, target, options)
  log(`Finished updating package.json`, options)

  // TODO: Tell user to run npm install
}
