import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import util from 'util'
import childProcess from 'child_process'
import { initTarget } from './index'

const copyFile = util.promisify(fs.copyFile)
const execFile = util.promisify(childProcess.execFile)
const mkdir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)
const readdir = util.promisify(fs.readdir)

async function createTemporaryFolder() {
  const tmpDir = os.tmpdir() + path.sep + crypto.randomBytes(8).toString('hex')
  await mkdir(tmpDir)
  return tmpDir
}
async function readTextFile(path: string): Promise<string> {
  const content = await readFile(path, 'utf8')
  return content
}
async function readJsonFile(path: string): Promise<object> {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

describe('setup', () => {
  let folder: string
  let logSpy: jest.SpyInstance
  beforeEach(async () => {
    folder = await createTemporaryFolder()

    // Add dummy files
    await mkdir(`${folder}/src`)
    await copyFile(`templates/node/src/index.ts`, `${folder}/src/index.ts`)
    await copyFile(`templates/node/src/index.test.ts`, `${folder}/src/index.test.ts`)

    logSpy = jest.spyOn(console, 'log')
  })
  afterEach(() => {
    logSpy.mockRestore()
  })

  it('init', async () => {
    // Run `npm init -y` and check result
    await execFile('npm', ['init', '-y'], { cwd: folder })
    expect(await readJsonFile(`${folder}/package.json`)).toMatchObject({
      name: expect.stringMatching(/^[0-9a-f]+$/),
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'ISC'
    })

    // Run `setup init` and check directory
    await initTarget('templates/node/', folder)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC: Dependencies in package.json was changed, run "npm install" to get node_modules up to date$/
      )
    )

    const paths = await readdir(folder)

    // Validate configuration setup
    const templateFiles = ['.babelrc', '.editorconfig', '.eslintrc', 'jest.config.js', 'tsconfig.json']
    for (const file of templateFiles) {
      expect(paths).toContain(file)
      expect(await readTextFile(`${folder}/${file}`)).toEqual(await readTextFile(`templates/node/${file}`))
    }

    // Validate npm setup
    expect(paths).not.toContain('node_modules')
    expect(paths).not.toContain('package-lock.json')
    expect(paths).toContain('package.json')
    expect(await readJsonFile(`${folder}/package.json`)).toMatchObject({
      name: expect.stringMatching(/^[0-9a-f]+$/),
      version: '1.0.0',
      description: '',
      main: 'index.js',
      engines: {
        node: '>=10.15.0'
      },
      scripts: {
        test: 'echo "Error: no test specified" && exit 1',
        build: 'npm run build:types && npm run build:src:js',
        'build:src:js':
          "babel src --out-dir ./build/dist/src --extensions '.ts' --source-maps --ignore '**/*.d.ts','src/**/*.test.ts'",
        'build:types': 'tsc --emitDeclarationOnly',
        lint: "eslint './src/**/*.{ts,tsx}'",
        'lint:fix': "eslint --fix './src/**/*.{ts,tsx}'"
      },
      keywords: [],
      author: '',
      license: 'ISC',
      dependencies: {},
      devDependencies: {
        '@babel/cli': expect.stringMatching(/.+/),
        '@babel/core': expect.stringMatching(/.+/),
        '@babel/plugin-proposal-class-properties': expect.stringMatching(/.+/),
        '@babel/plugin-proposal-numeric-separator': expect.stringMatching(/.+/),
        '@babel/plugin-proposal-optional-chaining': expect.stringMatching(/.+/),
        '@babel/preset-env': expect.stringMatching(/.+/),
        '@babel/preset-typescript': expect.stringMatching(/.+/),
        '@types/jest': expect.stringMatching(/.+/),
        '@typescript-eslint/eslint-plugin': expect.stringMatching(/.+/),
        '@typescript-eslint/parser': expect.stringMatching(/.+/),
        'babel-jest': expect.stringMatching(/.+/),
        eslint: expect.stringMatching(/.+/),
        'eslint-config-prettier': expect.stringMatching(/.+/),
        'eslint-plugin-prettier': expect.stringMatching(/.+/),
        jest: expect.stringMatching(/.+/),
        prettier: expect.stringMatching(/.+/),
        typescript: expect.stringMatching(/.+/)
      }
    })

    // Run `npm install` and check output
    try {
      await execFile('npm', ['install'], { cwd: folder })
    } catch (e) {
      expect(e).toBeFalsy()
    }

    // Setup files for build check
    await mkdir(`${folder}/node_modules/@connectedcars`)
    await mkdir(`${folder}/node_modules/@connectedcars/setup`)
    await copyFile(`.babelrc`, `${folder}/node_modules/@connectedcars/setup/.babelrc`)
    await copyFile(`.eslintrc`, `${folder}/node_modules/@connectedcars/setup/.eslintrc`)
    await copyFile(`jest.config.js`, `${folder}/node_modules/@connectedcars/setup/jest.config.js`)
    await copyFile(`tsconfig.json`, `${folder}/node_modules/@connectedcars/setup/tsconfig.json`)
    // Run `npm run build` and check output
    try {
      await execFile('npm', ['run', 'build'], { cwd: folder })
    } catch (e) {
      expect(e && e.stderr).toBeFalsy()
    }

    // Validate npm setup
    const pathsPostInstall = await readdir(folder)
    expect(pathsPostInstall).toContain('node_modules')
    expect(pathsPostInstall).toContain('package.json')
    expect(pathsPostInstall).toContain('package-lock.json')
  }, 30000)
})
