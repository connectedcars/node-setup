import { isFileReadable, readFile, writeFileAtomic } from './fsutils'
import { log } from './log'

interface StringMap {
  [key: string]: string
}
interface TsconfigJson {
  extends: string
  compilerOptions: StringMap
  exclude?: string[]
}

async function readTsconfigJson(filePath: string): Promise<TsconfigJson> {
  const contents = await readFile(filePath)
  const tsconfigJson = JSON.parse(contents.toString('utf8').replace(/(^|\s)\/\/.+($|\n)/g, '')) as TsconfigJson
  tsconfigJson.compilerOptions = tsconfigJson.compilerOptions ? tsconfigJson.compilerOptions : {}
  return tsconfigJson
}

export async function fixTSConfigJson(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  if (!(await isFileReadable(`${target}/tsconfig.json`))) {
    return
  }
  log(`  Started reading files`, options)
  const tsconfigJson = await readTsconfigJson(`${target}/tsconfig.json`)
  log(`  Finished reading files`, options)

  // Update paths
  log(`  Started updating paths`, options)
  if (tsconfigJson.compilerOptions.rootDirs) {
    delete tsconfigJson.compilerOptions.rootDirs
  }
  if (!tsconfigJson.compilerOptions.rootDir) {
    tsconfigJson.compilerOptions.rootDir = './'
  }
  log(`  Finished updating paths`, options)

  log(`  Started writing "tsconfig.json"`, options)
  const contents = JSON.stringify(tsconfigJson, null, 2)
  await writeFileAtomic(
    `${target}/tsconfig.json`,
    contents.replace(
      '"compilerOptions":',
      '// All paths need to reset or they would be pointing to ./node_modules/@connectedcars/setup\n  "compilerOptions":'
    )
  )
  log(`  Finished writing "tsconfig.json"`, options)
}
