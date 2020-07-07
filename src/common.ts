import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'

const readFile = util.promisify(fs.readFile)
const mkdir = util.promisify(fs.mkdir)
const readdirAsync = util.promisify(fs.readdir)
const statAsync = util.promisify(fs.stat)

export async function createTemporaryFolder(): Promise<string> {
  const tmpDir = os.tmpdir() + path.sep + crypto.randomBytes(8).toString('hex')
  await mkdir(tmpDir)
  return tmpDir
}

export async function readTextFile(path: string): Promise<string> {
  const content = await readFile(path, 'utf8')
  return content
}

export async function readJsonFile(path: string): Promise<any> {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

interface FolderTextFiles {
  [key: string]: {
    data: string
    mode: number
  }
}

export async function readFolderTextFiles(rootPath: string, filter?: RegExp): Promise<FolderTextFiles> {
  const folderFiles: FolderTextFiles = {}
  const dirs: string[] = [rootPath]
  while (dirs.length > 0) {
    const dir = dirs.shift() as string
    for (const file of await readdirAsync(dir)) {
      const filePath = path.resolve(dir, file)
      const fileStat = await statAsync(filePath)
      if (fileStat.isDirectory()) {
        dirs.push(filePath)
      } else if (fileStat.isFile()) {
        const relativeFilePath = path.relative(rootPath, filePath)
        if (filter && !relativeFilePath.match(filter)) {
          continue
        }
        folderFiles[relativeFilePath] = {
          data: await readTextFile(filePath),
          mode: fileStat.mode
        }
      }
    }
  }
  return folderFiles
}
