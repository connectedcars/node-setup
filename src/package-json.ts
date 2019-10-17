import { writeFileAtomic, readJsonFile } from './fsutils'

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

function sortDependencies(dependencies: StringMap): StringMap {
  const tempDevDependencies: StringMap = {}
  for (const name of Object.keys(dependencies).sort()) {
    tempDevDependencies[name] = dependencies[name]
  }
  return tempDevDependencies
}

export async function updatePackageJson(
  templatePath: string,
  target: string,
  options: { [key: string]: unknown } = {}
): Promise<void> {
  const force = options.force ? true : false
  const verbose = options.verbose ? true : false

  if (verbose) {
    console.log(`  Started reading files`)
  }
  const templatePackageJson = await readPackageJson(`${templatePath}/package.json`)
  const packageJson = await readPackageJson(`${target}/package.json`)
  if (verbose) {
    console.log(`  Finished reading files`)
  }

  // Update devDependencies
  if (verbose) {
    console.log(`  Started updating "devDependencies"`)
  }
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
  if (verbose) {
    console.log(`  Finished updating "devDependencies"`)
  }
  // Update scripts
  if (verbose) {
    console.log(`  Started updating "scripts"`)
  }
  for (const scriptName of Object.keys(templatePackageJson.scripts)) {
    if (force || !packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = templatePackageJson.scripts[scriptName]
    }
  }
  if (verbose) {
    console.log(`  Finished updating "scripts"`)
  }
  // Update engines
  if (verbose) {
    console.log(`  Started updating "engines"`)
  }
  packageJson.engines = templatePackageJson.engines
  if (verbose) {
    console.log(`  Finished updating "engines"`)
  }
  // Remove old configs
  if (force) {
    if (verbose) {
      console.log(`  Started deleting "babel" and "jest"`)
    }
    delete packageJson.babel
    delete packageJson.jest
    if (verbose) {
      console.log(`  Finished deleting "babel" and "jest"`)
    }
  }

  if (verbose) {
    console.log(`  Started updating "package.json"`)
  }
  await writeFileAtomic(`${target}/package.json`, JSON.stringify(packageJson, null, 2))
  if (verbose) {
    console.log(`  Finished updating "package.json"`)
  }
}
