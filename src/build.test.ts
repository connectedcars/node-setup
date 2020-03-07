import childProcess from 'child_process'
import path from 'path'
import util from 'util'

import { babelBuild } from './build'
import { createTemporaryFolder, readFolderTextFiles } from './common'

const execFile = util.promisify(childProcess.execFile)

describe('build', () => {
  let tmpDir: string
  let logSpy: jest.SpyInstance
  beforeEach(async () => {
    logSpy = jest.spyOn(console, 'log')
    tmpDir = await createTemporaryFolder()
  })
  afterEach(() => {
    logSpy.mockRestore()
  })

  it('should build the same output as babel cli', async () => {
    await execFile('npm', ['run', 'build:js'])
    const tmpBuildOutput = path.join(tmpDir, 'build/dist')
    await babelBuild(['src', 'bin'], tmpBuildOutput)
    const babelFiles = await readFolderTextFiles('build/dist', /\.js$/)
    const buildFiles = await readFolderTextFiles(tmpBuildOutput, /\.js$/)
    expect(buildFiles).toMatchObject(babelFiles)
  })
})
