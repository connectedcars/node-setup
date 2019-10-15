import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import util from 'util'
import childProcess from 'child_process'
import { processCommand } from './index'

const execFile = util.promisify(childProcess.execFile)
const mkdir = util.promisify(fs.mkdir)

describe(`setup`, () => {
  it('init', async () => {
    const tmpdir = os.tmpdir() + path.sep + crypto.randomBytes(8).toString('hex')
    await mkdir(tmpdir)
    const npmResult = await execFile('npm', ['init', '-y'], {
      cwd: tmpdir
    })
    console.log(npmResult.stdout)
    await processCommand('init', 'template/', tmpdir)
  }, 30000)
})
