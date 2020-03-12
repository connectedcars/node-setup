import childProcess from 'child_process'
import path from 'path'
import util from 'util'

import { babelBuild } from './build'
import { createTemporaryFolder, readFolderTextFiles } from './common'

const execFile = util.promisify(childProcess.execFile)

describe('build', () => {
  let tmpDir: string
  let logSpy: jest.SpyInstance

  beforeAll(async () => {
    await execFile('npm', ['run', 'build:js'])
  }, 10000)

  beforeEach(async () => {
    logSpy = jest.spyOn(console, 'log')
    tmpDir = await createTemporaryFolder()
  })
  afterEach(() => {
    logSpy.mockRestore()
  })

  it('should build the same output as babel cli', async () => {
    const tmpBuildOutput = path.join(tmpDir, 'build/dist')
    await babelBuild(['src', 'bin'], tmpBuildOutput)
    const babelFiles = await readFolderTextFiles('build/dist', /\.js$/)
    const buildFiles = await readFolderTextFiles(tmpBuildOutput, /\.js$/)
    expect(buildFiles).toMatchObject(babelFiles)
  }, 10000)

  it('should not rebuild anything', async () => {
    const tmpBuildOutput = path.join(tmpDir, 'build/dist')
    const firstRun = await babelBuild(['src', 'bin'], tmpBuildOutput)
    expect(firstRun.filter(b => b.state !== 'new')).toEqual([])
    const buildFilesBefore = await readFolderTextFiles(tmpBuildOutput, /\.js$/)
    const secondRun = await babelBuild(['src', 'bin'], tmpBuildOutput)
    expect(secondRun.filter(b => b.state !== 'same')).toEqual([])
    const buildFilesAfter = await readFolderTextFiles(tmpBuildOutput, /\.js$/)
    expect(buildFilesBefore).toMatchObject(buildFilesAfter)
  }, 10000)
})
