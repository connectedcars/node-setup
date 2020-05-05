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
    const tmpBuildOutput = path.join(tmpDir, 'build')
    await babelBuild(['src', 'bin'], tmpBuildOutput)
    const buildFiles = await readFolderTextFiles(tmpBuildOutput, /\.js$/)

    const babelArgs = ['--extensions', '.ts', '--source-maps', '--ignore', '**/*.d.ts,src/**/*.test.ts']
    const tmpBabelOutput = path.join(tmpDir, 'babel')

    await execFile('babel', ['src', '--out-dir', `${tmpBabelOutput}/src`, ...babelArgs])
    await execFile('babel', ['bin', '--out-dir', `${tmpBabelOutput}/bin`, ...babelArgs])
    const babelFiles = await readFolderTextFiles(tmpBabelOutput, /\.js$/)
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
