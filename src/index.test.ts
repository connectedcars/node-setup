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
const readdir = util.promisify(fs.readdir)

describe(`setup`, () => {
  it('init', async () => {
    // TODO: Check output of each command
    const tmpdir = os.tmpdir() + path.sep + crypto.randomBytes(8).toString('hex')
    await mkdir(tmpdir)
    const npmInitRes = await execFile('npm', ['init', '-y'], {
      cwd: tmpdir
    })
    console.log(npmInitRes.stdout)
    await initTarget('templates/node/', tmpdir)

    const paths = await readdir(tmpdir)
    expect(paths).toContain('.babelrc')
    expect(paths).toContain('.editorconfig')
    expect(paths).toContain('.eslintrc')
    expect(paths).toContain('jest.config.js')
    expect(paths).not.toContain('node_modules')
    expect(paths).toContain('package.json')
    expect(paths).not.toContain('package-lock.json')
    expect(paths).toContain('tsconfig.json')

    const packageJSON = (await readFile(`${tmpdir}/package.json`)).toString('utf8')
    console.log(packageJSON)
    const lsRes = await execFile('ls', ['-la'], {
      cwd: tmpdir
    })
    console.log(lsRes.stdout)
    const npmInstallResult = await execFile('npm', ['install'], {
      cwd: tmpdir
    })
    console.log(npmInstallResult.stdout)
  }, 30000)
})
