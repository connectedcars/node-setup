import fs from 'fs'
import util from 'util'

import { isFileReadable, readFile, writeFileAtomic } from './fsutils'
import { forceLog, log } from './log'

const copyFile = util.promisify(fs.copyFile)
const unlink = util.promisify(fs.unlink)

export async function updateEslintConfig(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  if (!(await isFileReadable(`${target}/eslint.config.js`))) {
    log(`  Started copying "eslint.config.js"`, options)
    await copyFile(`${templatePath}/eslint.config.js`, `${target}/eslint.config.js`, fs.constants.COPYFILE_EXCL)
      .then(() => {
        log(`  Finished copying "eslint.config.js"`, options)
      })
      .catch(e => {
        const error = e as NodeJS.ErrnoException
        if (error.code === 'EEXIST') {
          log(`  Skipped copying "eslint.config.js" because it already exists`, options)
        } else {
          forceLog(`  Failed copying "eslint.config.js": ${error.message}`)
        }
      })
  }
  if (await isFileReadable(`${target}/.eslintrc`)) {
    log(`  Started deleting ".eslintrc"`, options)
    await unlink(`${target}/.eslintrc`)
    log(`  Finished deleting ".eslintrc"`, options)
  }

  if (await isFileReadable(`${target}/eslint.config.js`)) {
    log(`  Started reading "eslint.config.js"`, options)
    const templateEslintConfigJs = await readFile(`${templatePath}/eslint.config.js`, 'utf8')
    const eslintConfigJs = await readFile(`${target}/eslint.config.js`, 'utf8')
    log(`  Finished reading "eslint.config.js"`, options)

    if (
      eslintConfigJs.trim() === "module.exports = [...require('./node_modules/@connectedcars/setup/eslint.config.js')]"
    ) {
      log(`  Started writing "eslint.config.js"`, options)
      await writeFileAtomic(`${target}/eslint.config.js`, templateEslintConfigJs)
      log(`  Finished writing "eslint.config.js"`, options)
    } else {
      log(`  Skipped writing "eslint.config.js" because it contains custom configuration`, options)
    }
  }
}
