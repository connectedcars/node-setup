import fs from 'fs'
import util from 'util'

import { isFileReadable } from './fsutils'
import { forceLog, log } from './log'

const copyFile = util.promisify(fs.copyFile)
const unlink = util.promisify(fs.unlink)

export async function updateEslintrc(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  if (!(await isFileReadable(`${target}/.eslintrc`))) {
    return
  }

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

  log(`  Started deleting ".eslintrc"`, options)
  await unlink(`${target}/.eslintrc`)
  log(`  Finished deleting ".eslintrc"`, options)
}
