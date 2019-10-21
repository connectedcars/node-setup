import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import util from 'util'
import { Stream } from 'stream'

const readFile = util.promisify(fs.readFile)

interface CreateWriteStreamOptions {
  encoding?: string
  flags?: string
  mode?: number
}

export async function writeFileAtomic(
  filePath: string,
  data: Buffer | string | Stream,
  options?: CreateWriteStreamOptions
): Promise<void> {
  const basePath = path.dirname(filePath)
  const fileName = path.basename(filePath)
  const tmpFile = `${basePath}/.${fileName}.${crypto.randomBytes(4).toString('hex')}.tmp`

  const output = fs.createWriteStream(tmpFile, options)

  return new Promise((resolve, reject) => {
    output.on('error', e => {
      reject(e)
    })
    output.on('close', () => {
      fs.rename(tmpFile, filePath, e => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
    })

    if (data instanceof Stream) {
      data.pipe(output)
    } else {
      output.write(data)
      output.end()
    }
  })
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  const buffer = await readFile(filePath)
  return JSON.parse(buffer.toString('utf8'))
}
