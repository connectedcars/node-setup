import fs from 'fs'
import util from 'util'
import { writeFileAtomic, readJsonFile } from './fsutils'

const copyFile = util.promisify(fs.copyFile)
const readdir = util.promisify(fs.readdir)

const templateFilesIgnore = ['package.json', 'package-lock.json']
const templatePackagesIgnore = ['@connectedcars/setup', '@types/node']

interface StringMap {
  [key: string]: string
}
interface PackageJson {
  dependencies: StringMap
  devDependencies: StringMap
  scripts: StringMap
  engines: StringMap
  babel?: {}
  jest?: {}
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
  const packageJson = (await readJsonFile(filePath)) as PackageJson
  packageJson.dependencies = packageJson.dependencies ? packageJson.dependencies : {}
  packageJson.devDependencies = packageJson.devDependencies ? packageJson.devDependencies : {}
  packageJson.scripts = packageJson.scripts ? packageJson.scripts : {}
  return packageJson
}

export async function copyTemplateFiles(
  templatePath: string,
  target: string,
  ignoreFiles: string[],
  options: { [key: string]: unknown } = {}
): Promise<void> {
  const force = options.force ? true : false
  const verbose = options.verbose ? true : false

  // TODO: Merge with existing files if they already exists
  // TODO: Also handle folders like .vscode
  const files = await readdir(`${templatePath}`, { withFileTypes: true })
  for (const file of files) {
    if (ignoreFiles.includes(file.name) || file.isDirectory()) {
      continue
    }
    if (verbose) {
      console.log(`  Started copying "${file.name}"`)
    }
    const flags = force ? 0 : fs.constants.COPYFILE_EXCL
    await copyFile(`${templatePath}/${file.name}`, `${target}/${file.name}`, flags).catch(() => {
      // TODO: Check that it's not because of permissions issues
      if (verbose) {
        console.log(`  Skipped copying "${file.name}" because it already exists`)
      }
    })
  }
}

function sortDependencies(dependencies: StringMap): StringMap {
  const tempDevDependencies: StringMap = {}
  Object.keys(dependencies)
    .sort()
    .forEach(name => {
      tempDevDependencies[name] = dependencies[name]
    })
  return tempDevDependencies
}

export async function initTarget(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  const force = options.force ? true : false
  const verbose = options.verbose ? true : false

  if (verbose) {
    console.log(`Started copying template files`)
  }
  await copyTemplateFiles(templatePath, target, templateFilesIgnore, options)
  if (verbose) {
    console.log(`Finished copying template files`)
  }

  if (verbose) {
    console.log(`Started updating package.json`)
  }
  const templatePackageJson = await readPackageJson(`${templatePath}/package.json`)
  const packageJson = await readPackageJson(`${target}/package.json`)

  // Update devDependencies
  for (const dependency of Object.keys(templatePackageJson.devDependencies)) {
    if (templatePackagesIgnore.includes(dependency)) {
      continue
    }
    if (force || !packageJson.devDependencies[dependency]) {
      const templateVersion = templatePackageJson.devDependencies[dependency]
      packageJson.devDependencies[dependency] = templateVersion
    }
  }
  packageJson.devDependencies = sortDependencies(packageJson.devDependencies)
  // Update scripts
  for (const scriptName of Object.keys(templatePackageJson.scripts)) {
    if (force || !packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = templatePackageJson.scripts[scriptName]
    }
  }
  // Update engines
  packageJson.engines = templatePackageJson.engines
  // Remove old configs
  if (force) {
    delete packageJson.babel
    delete packageJson.jest
  }

  await writeFileAtomic(`${target}/package.json`, JSON.stringify(packageJson, null, 2))
  if (verbose) {
    console.log(`Finished updating package.json`)
  }
}
