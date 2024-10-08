import * as babel from '@babel/core'
import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'
import util from 'util'

const readdirAsync = util.promisify(fs.readdir)
const statAsync = util.promisify(fs.stat)
const writeFileAsync = util.promisify(fs.writeFile)
const chmodAsync = util.promisify(fs.chmod)
const mkdirAsync = util.promisify(fs.mkdir)
const utimes = util.promisify(fs.utimes)
const rename = util.promisify(fs.rename)
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
      for (const file of await readdirAsync(dir)) {
        const inFile = path.resolve(dir, file)
        const inStat = await statAsync(inFile)
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
            const outStat = await statAsync(outFile)
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
    await mkdirAsync(path.dirname(build.outFile), { recursive: true })
    await writeFileAsync(mapFile, JSON.stringify(result.map))
    const tmpOutFile = build.outFile + '.tmp'
    await writeFileAsync(tmpOutFile, result.code)
    await chmodAsync(tmpOutFile, build.mode)
    await utimes(tmpOutFile, build.mtime, build.mtime)
    await rename(tmpOutFile, build.outFile)
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
  } catch (e) {
    const execError = e as ExecFileError
    throw new BuildErrorOutput(execError.stdout, execError)
  }
}

export class BuildErrorOutput extends Error {
  public error: Error
  public constructor(message: string, e: Error) {
    super(message)
    this.error = e
  }
}
