import * as babel from '@babel/core'
import childProcess from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import util from 'util'

const execFile = util.promisify(childProcess.execFile)

export interface BuildEntry {
  inFile: string
  outFile: string
  file: string
  mode: number
  mtime: Date
  state: string
}

export async function babelBuild(rootDirs: string[], outDir: string): Promise<BuildEntry[]> {
  const buildList: BuildEntry[] = []
  for (const rootDir of rootDirs) {
    const fullOutDir = path.resolve(outDir, rootDir)
    const fullRootDir = path.resolve(rootDir)
    const dirs: string[] = [fullRootDir]
    while (dirs.length > 0) {
      const dir = dirs.shift() as string
      for (const file of await fs.readdir(dir)) {
        const inFile = path.resolve(dir, file)
        const inStat = await fs.stat(inFile)
        if (inStat.isDirectory()) {
          dirs.push(inFile)
        } else if (inStat.isFile()) {
          if (!file.match(/\.[tj]sx?$/) || file.match(/\.(?:test|d)\.[tj]s$/)) {
            continue
          }
          const relative = path.relative(fullRootDir, inFile)
          const outFile = path.join(fullOutDir, relative).replace(/ts(x?)$/, 'js$1')
          const entry: BuildEntry = {
            inFile,
            outFile,
            file: `${path.join(rootDir, relative)}`,
            mode: inStat.mode,
            mtime: inStat.mtime,
            state: ''
          }
          try {
            const outStat = await fs.stat(outFile)
            if (inStat.mtime.getTime() === outStat.mtime.getTime() && inStat.mode === outStat.mode) {
              entry.state = 'same'
            } else {
              entry.state = 'updated'
            }
          } catch {
            entry.state = 'new'
          }
          buildList.push(entry)
        }
      }
    }
  }
  for (const build of buildList) {
    if (build.state === 'same') {
      continue
    }
    const result = await babel.transformFileAsync(build.inFile, {
      sourceFileName: path.join(
        path.relative(path.dirname(build.outFile), path.dirname(build.inFile)),
        path.basename(build.inFile)
      ),
      ignore: ['**/*.d.ts', 'src/**/*.test.ts'],
      sourceMaps: true,
      caller: {
        name: '@babel/cli'
      }
    })
    if (!result) {
      // File ignored
      continue
    }
    const mapFile = build.outFile + '.map'
    result.code = `${result.code}\n//# sourceMappingURL=${path.basename(mapFile)}`
    if (result.map) {
      result.map.file = path.basename(build.outFile)
    }
    await fs.mkdir(path.dirname(build.outFile), { recursive: true })
    await fs.writeFile(mapFile, JSON.stringify(result.map))
    const tmpOutFile = build.outFile + '.tmp'
    await fs.writeFile(tmpOutFile, result.code)
    await fs.chmod(tmpOutFile, build.mode)
    await fs.utimes(tmpOutFile, build.mtime, build.mtime)
    await fs.rename(tmpOutFile, build.outFile)
  }
  return buildList
}

interface ExecFileError extends Error {
  killed: boolean
  code: number
  signal: null | string
  cmd: string
  stdout: string
  stderr: string
}

export async function tscBuildTypings(): Promise<void> {
  try {
    await execFile('tsc', ['--emitDeclarationOnly'])
  } catch (error) {
    const execError = error as ExecFileError
    throw new BuildErrorOutput(execError.stdout, execError.stderr, execError)
  }
}

export class BuildErrorOutput extends Error {
  public readonly stdout: string
  public readonly stderr: string
  public readonly error: Error

  public constructor(stdout: string, stderr: string, error: Error) {
    super(stdout)

    this.stdout = stdout
    this.stderr = stderr
    this.error = error
  }
}
