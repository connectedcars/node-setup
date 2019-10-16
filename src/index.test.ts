import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import util from 'util'
import childProcess from 'child_process'
import { initTarget } from './index'

const execFile = util.promisify(childProcess.execFile)
const mkdir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)

describe(`setup`, () => {
  it('init', async () => {
    const tmpdir = os.tmpdir() + path.sep + crypto.randomBytes(8).toString('hex')
    await mkdir(tmpdir)
    const npmInitRes = await execFile('npm', ['init', '-y'], {
      cwd: tmpdir
    })
    console.log(npmInitRes.stdout)
    await initTarget('template/', tmpdir)
    const packageJSON = (await readFile(`${tmpdir}/package.json`)).toString('utf8')
    console.log(packageJSON)
    const npmInstallResult = await execFile('npm', ['install'], {
      cwd: tmpdir
    })
    console.log(npmInstallResult.stdout)
  }, 30000)
})
