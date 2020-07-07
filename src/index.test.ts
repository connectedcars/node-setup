import childProcess from 'child_process'
import fs from 'fs'
import util from 'util'

import { createTemporaryFolder, readJsonFile, readTextFile } from './common'
import { initTarget } from './index'

const copyFile = util.promisify(fs.copyFile)
const execFile = util.promisify(childProcess.execFile)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)

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

  describe('initTarget', () => {
    it('should add the relevant dependencies to folder', async () => {
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
          cov: 'TZ=UTC jest --coverage=true',
          build: 'build src',
          'build:js': expect.stringMatching(/.+/),
          'build:types': 'tsc --noEmit',
          lint: "eslint './src/**/*.{ts,tsx}'",
          'lint:fix': "eslint --fix './src/**/*.{ts,tsx}'",
          'ci-jest': 'TZ=UTC jest --silent --no-color --json 2> /dev/null; res=$?; echo; exit $res',
          'ci-audit': 'npm audit --json || true',
          'ci-eslint': "eslint --format json './src/**/*.{ts,tsx}' || true"
        },
        keywords: [],
        author: '',
        license: 'ISC',
        dependencies: {},
        devDependencies: {
          '@babel/cli': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/core': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-proposal-class-properties': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-proposal-numeric-separator': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-proposal-optional-chaining': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/preset-env': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/preset-typescript': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@types/jest': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@typescript-eslint/eslint-plugin': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@typescript-eslint/parser': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          'babel-jest': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          eslint: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          'eslint-config-prettier': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          'eslint-plugin-prettier': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          jest: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          prettier: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          typescript: expect.stringMatching(/^\d+\.\d+\.\d+$/)
        }
      })
    })
  })

  describe('setup', () => {
    it('init', async () => {
      // Run `npm init -y` and check result
      await execFile('npm', ['init', '-y'], { cwd: folder })
      // Run `npm install` and check output
      try {
        await execFile('npm', ['install', '--save-dev', `file://${process.cwd()}`], {
          cwd: folder
        })
        await execFile('./node_modules/.bin/setup', ['init'], { cwd: folder })
        await execFile('npm', ['install'], { cwd: folder })
      } catch (e) {
        expect(e).toBeFalsy()
      }

      try {
        await execFile('npm', ['run', 'build'], { cwd: folder })
      } catch (e) {
        expect(e && e.stderr).toBeFalsy()
      }

      // Validate both declaration and js files are generated
      const builtSrcFiles = await readdir(`${folder}/build/dist/src`)
      expect(builtSrcFiles).toContain('index.d.ts')
      expect(builtSrcFiles).toContain('index.js')
      expect(builtSrcFiles).toContain('index.js.map')

      // Run `npm run lint` and check output
      try {
        await execFile('npm', ['run', 'lint'], { cwd: folder })
      } catch (e) {
        expect(e && e.stdout).toBeFalsy()
      }

      // Validate npm setup
      const pathsPostInstall = await readdir(folder)
      expect(pathsPostInstall).toContain('node_modules')
      expect(pathsPostInstall).toContain('package.json')
      expect(pathsPostInstall).toContain('package-lock.json')
    }, 120000)
  })
})
