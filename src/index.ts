import fs from 'fs'
import util from 'util'
import { writeFileAtomic, readJsonFile } from './fsutils'

const copyFile = util.promisify(fs.copyFile)
const readdir = util.promisify(fs.readdir)

const templateFilesIgnore = ['package.json', 'package-lock.json']
const templatePackagesIgnore = ['@connectedcars/setup', '@types/node']

interface PackageJson {
  dependencies: {
    [key: string]: string
  }
  devDependencies: {
    [key: string]: string
  }
  scripts: {
    [key: string]: string
  }
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
  force = false
): Promise<void> {
  for (const file in await readdir(`${templatePath}`)) {
    if (!ignoreFiles.includes(file)) {
      continue
    }
    const flags = force ? 0 : fs.constants.COPYFILE_EXCL
    await copyFile(`${templatePath}/${file}`, `${target}/${file}`, flags).catch(() => {
      // TODO: Check that it's not because of permissions issues
      console.log(`skipping '${file}' because it already exists`)
    })
  }
}

export async function initTarget(templatePath: string, target: string, force = false): Promise<void> {
  console.log(`Copy template files:`)
  await copyTemplateFiles(templatePath, target, templateFilesIgnore, force)

  console.log(`Fix package.json`)
  const templatePackageJson = await readPackageJson(`${templatePath}/package.json`)
  const packageJson = await readPackageJson(`${target}/package.json`)
  for (const dependency of Object.keys(templatePackageJson.devDependencies)) {
    if (templatePackagesIgnore.includes(dependency)) {
      continue
    }
    if (force || !packageJson.devDependencies[dependency]) {
      const templateVersion = templatePackageJson.devDependencies[dependency]
      packageJson.devDependencies[dependency] = templateVersion
    }
  }
  for (const scriptName of Object.keys(templatePackageJson.scripts)) {
    if (force || !packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = templatePackageJson.scripts[scriptName]
    }
  }

  // TODO: Do minimal sorting when writing out package.json:
  // * https://github.com/npm/cli/blob/4c65cd952bc8627811735bea76b9b110cc4fc80e/lib/install/update-package-json.js
  // * https://github.com/domenic/sorted-object/blob/master/lib/sorted-object.js
  // * https://github.com/substack/json-stable-stringify
  await writeFileAtomic(`${target}/package.json`, JSON.stringify(packageJson, null, 2))
}
