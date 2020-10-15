import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { Stream } from 'stream'
import util from 'util'

export const readFile = util.promisify(fs.readFile)

const access = util.promisify(fs.access)

export async function isFileReadable(filePath: string): Promise<boolean> {
  const res = await access(filePath, fs.constants.R_OK)
    .then(() => true)
    .catch(e => false)
  return res
}

export async function writeFileAtomic(
  filePath: string,
  data: Buffer | string | Stream,
  options?: Parameters<typeof fs.createWriteStream>[1]
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
