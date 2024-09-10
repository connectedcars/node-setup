import fs from 'fs'
import util from 'util'

import { updateEslintrc } from './eslintrc'
import { forceLog, log } from './log'
import { updatePackageJson } from './package-json'
import { fixTSConfigJson } from './tsconfig-json'

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

  // TODO: Also handle folders like .vscode
  const files = await readdir(`${templatePath}`, { withFileTypes: true })
  for (const file of files) {
    if (ignoreFiles.includes(file.name) || file.isDirectory()) {
      continue
    }
    log(`  Started copying "${file.name}"`, options)
    const flags = force ? 0 : fs.constants.COPYFILE_EXCL
    await copyFile(`${templatePath}/${file.name}`, `${target}/${file.name}`, flags).catch(e => {
      if (e.code === 'EEXIST') {
        // TODO: Merge with existing files if they already exists
        log(`  Skipped copying "${file.name}" because it already exists`, options)
      } else {
        forceLog(`  Failed copying "${file.name}": ${e.message}`)
      }
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
  const wasChanged = await updatePackageJson(templatePath, target, options)
  log(`Finished updating package.json`, options)

  if (wasChanged) {
    forceLog(`Dependencies in package.json was changed, run "npm install" to get node_modules up to date`)
  } else {
    log(`Dependencies in package.json remained unchanged`)
  }
}

export async function updateTarget(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  log(`Started updating package.json`, options)
  const wasChanged = await updatePackageJson(templatePath, target, { ...options, force: true, onlyDeps: true })
  log(`Finished updating package.json`, options)

  log(`Started updating .eslintrc`, options)
  await updateEslintrc(templatePath, target, options)
  log(`Finished updating .eslintrc`, options)

  if (wasChanged) {
    forceLog(`Dependencies in package.json was changed, run "npm install" to get node_modules up to date`)
  } else {
    log(`Dependencies in package.json remained unchanged`)
  }
}

export async function fixTarget(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  log(`Started updating tsconfig.json`, options)
  await fixTSConfigJson(templatePath, target, options)
  log(`Finished updating tsconfig.json`, options)
}
