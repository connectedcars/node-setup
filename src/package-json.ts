import { readJsonFile, writeFileAtomic } from './fsutils'
import { log } from './log'

const templatePackagesIgnore = ['@connectedcars/setup', '@types/node']
const legacyPackages = [
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-nullish-coalescing-operator',
  '@babel/plugin-proposal-numeric-separator',
  '@babel/plugin-proposal-optional-chaining',
  '@babel/plugin-transform-class-properties',
  '@babel/plugin-transform-nullish-coalescing-operator',
  '@babel/plugin-transform-numeric-separator',
  '@babel/plugin-transform-optional-chaining',
  '@typescript-eslint/parser'
]

export interface StringMap {
  [key: string]: string
}
export interface PackageJson {
  dependencies: StringMap
  devDependencies: StringMap
  scripts: StringMap
  files?: string[]
  engines: StringMap
  babel?: StringMap
  jest?: StringMap
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
  const packageJson = (await readJsonFile(filePath)) as PackageJson
  packageJson.dependencies = packageJson.dependencies ? packageJson.dependencies : {}
  packageJson.devDependencies = packageJson.devDependencies ? packageJson.devDependencies : {}
  packageJson.scripts = packageJson.scripts ? packageJson.scripts : {}
  return packageJson
}

function sortDependencies(dependencies: StringMap): StringMap {
  const tempDevDependencies: StringMap = {}
  // eslint-disable-next-line no-restricted-syntax
  for (const name of Object.keys(dependencies).sort((a, b) => a.localeCompare(b))) {
    tempDevDependencies[name] = dependencies[name]
  }
  return tempDevDependencies
}

export async function updatePackageJson(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<boolean> {
  const force = options.force ? true : false
  const onlyDeps = options.onlyDeps ? true : false

  log(`  Started reading files`, options)
  const templatePackageJson = await readPackageJson(`${templatePath}/package.json`)
  const packageJson = await readPackageJson(`${target}/package.json`)
  log(`  Finished reading files`, options)

  // Update devDependencies
  log(`  Started updating "devDependencies"`, options)
  const existingDevDependencies = JSON.stringify(packageJson.devDependencies)
  for (const dependency of Object.keys(templatePackageJson.devDependencies)) {
    if (templatePackagesIgnore.includes(dependency)) {
      continue
    }
    if (force || !packageJson.devDependencies[dependency]) {
      const templateVersion = templatePackageJson.devDependencies[dependency]
      packageJson.devDependencies[dependency] = templateVersion
    }
  }
  // Remove legacy dependencies
  for (const legacyPackage of legacyPackages) {
    delete packageJson.devDependencies[legacyPackage]
  }
  packageJson.devDependencies = sortDependencies(packageJson.devDependencies)
  log(`  Finished updating "devDependencies"`, options)

  if (!onlyDeps) {
    // Update scripts
    log(`  Started updating "scripts"`, options)
    for (const scriptName of Object.keys(templatePackageJson.scripts)) {
      if (force || !packageJson.scripts[scriptName]) {
        packageJson.scripts[scriptName] = templatePackageJson.scripts[scriptName]
      }
    }
    log(`  Finished updating "scripts"`, options)
    // Update engines
    log(`  Started updating "engines"`, options)
    packageJson.engines = templatePackageJson.engines
    log(`  Finished updating "engines"`, options)
    // Remove old configs
    if (force) {
      log(`  Started deleting "babel" and "jest"`, options)
      delete packageJson.babel
      delete packageJson.jest
      log(`  Finished deleting "babel" and "jest"`, options)
    }
    if (!packageJson.files || force) {
      packageJson.files = templatePackageJson.files
    }
  }

  log(`  Started writing "package.json"`, options)
  await writeFileAtomic(`${target}/package.json`, JSON.stringify(packageJson, null, 2))
  log(`  Finished writing "package.json"`, options)

  // Return whether devDependencies were changed
  return existingDevDependencies !== JSON.stringify(packageJson.devDependencies)
}
