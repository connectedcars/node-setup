import fs from 'fs'
import util from 'util'
import childProcess from 'child_process'
import semver from 'semver'

const execFile = util.promisify(childProcess.execFile)
const copyFile = util.promisify(fs.copyFile)
const readFile = util.promisify(fs.readFile)

// TODO: look into making this an ignore list

const templateFiles = ['.eslintrc', '.babelrc', 'tsconfig.json']
const templatePackages = [
  '@babel/cli',
  '@babel/core',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-numeric-separator',
  '@babel/preset-env',
  '@babel/preset-typescript',
  '@types/node',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'eslint',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  'typescript',
  'prettier'
]

// TODO: implement
// const templateScripts = ['test', 'build', 'build:src:js', 'build:types', 'lint', 'lint:fix']

interface PackageJson {
  devDependencies: {
    [key: string]: string | undefined
  }
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const buffer = await readFile(filePath)
  return JSON.parse(buffer.toString('utf8'))
}

export async function processCommand(
  command: string,
  templatePath: string,
  target: string,
  force = false
): Promise<void> {
  switch (command) {
    case 'init': {
      console.log(`Copy template files:`)
      for (const templateFile of templateFiles) {
        const flags = force ? 0 : fs.constants.COPYFILE_EXCL
        await copyFile(`${templatePath}/${templateFile}`, `${target}/${templateFile}`, flags).catch(() => {
          console.log(`skipping ${templateFile}`)
        })
      }

      // TODO: Use lock file to do this smarter
      console.log(`Check package.json dependencies`)
      const templatePackageJson = (await readJsonFile(`${templatePath}/package.json`)) as PackageJson
      const packageJson = (await readJsonFile(`${target}/package.json`)) as PackageJson

      const missingPackages = []
      for (const dependency of templatePackages) {
        const templateVersion = templatePackageJson.devDependencies
          ? templatePackageJson.devDependencies[dependency]
          : null
        if (templateVersion) {
          const packageVersion = packageJson.devDependencies ? packageJson.devDependencies[dependency] : null
          if (!packageVersion) {
            missingPackages.push(dependency)
            continue
          }
          const cleanPackageVersionSemVer = semver.coerce(packageVersion)
          if (!cleanPackageVersionSemVer) {
            throw new Error(`version string broken: ${dependency}`)
          }
          const cleanPackageVersion = semver.valid(cleanPackageVersionSemVer)
          if (!cleanPackageVersion) {
            throw new Error(`version string broken: ${dependency}`)
          }
          if (!semver.satisfies(cleanPackageVersion, templateVersion)) {
            throw new Error(`${dependency} is outdated`)
          }
        }
      }
      // TODO: replace package.json with the dependencies instead and run npm install
      const npmResult = await execFile('npm', ['install', '--save-dev', ...missingPackages], {
        cwd: target
      })
      console.log(npmResult.stdout)
      if (npmResult.stderr) {
        console.error(npmResult.stderr)
      }
      // TODO: Inject default scripts from template

      break
    }
    default: {
      throw new Error(`Unknown command ${command}`)
    }
  }
}
