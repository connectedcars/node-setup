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
}
