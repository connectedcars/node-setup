import childProcess from 'child_process'
import fs from 'fs'
import util from 'util'

import { createTemporaryFolder, readJsonFile, readTextFile } from './common'
import { initTarget } from './index'
import { PackageJson } from './package-json'

const copyFile = util.promisify(fs.copyFile)
const execFile = util.promisify(childProcess.execFile)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

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
          node: '>=20.0.0'
        },
        scripts: {
          test: 'echo "Error: no test specified" && exit 1',
          cov: 'TZ=UTC jest --coverage=true',
          build: 'build src',
          'build:js': expect.stringMatching(/.+/),
          'build:types': 'tsc --noEmit',
          lint: "eslint './src/**/*.{ts,tsx}'",
          'lint:fix': "eslint --fix './src/**/*.{ts,tsx}'",
          'ci-tsc': 'checks tsc',
          'ci-jest': 'checks jest',
          'ci-audit': 'checks audit',
          'ci-eslint': 'checks eslint',
          'ci-auto': 'checks auto --hard-fail'
        },
        keywords: [],
        author: '',
        license: 'ISC',
        dependencies: {},
        devDependencies: {
          '@babel/cli': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/core': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-transform-class-properties': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-transform-nullish-coalescing-operator': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-transform-numeric-separator': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          '@babel/plugin-transform-optional-chaining': expect.stringMatching(/^\d+\.\d+\.\d+$/),
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
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeFalsy()
      }

      try {
        await execFile('npm', ['run', 'build'], { cwd: folder })
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
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
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e && e.stdout).toBeFalsy()
      }

      // Validate npm setup
      const pathsPostInstall = await readdir(folder)
      expect(pathsPostInstall).toContain('node_modules')
      expect(pathsPostInstall).toContain('package.json')
      expect(pathsPostInstall).toContain('package-lock.json')
    }, 120000)

    it('update', async () => {
      await execFile('npm', ['init', '-y'], { cwd: folder })
      try {
        await execFile('npm', ['install', '--save-dev', `file://${process.cwd()}`], {
          cwd: folder
        })
        await execFile('./node_modules/.bin/setup', ['init'], { cwd: folder })
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeFalsy()
      }

      const packageJson = await readJsonFile<PackageJson>(`${folder}/package.json`)
      packageJson.devDependencies['@babel/core'] = '1.3.37'
      packageJson.devDependencies['eslint'] = '1.3.37'
      packageJson.devDependencies['typescript'] = '1.3.37'
      await writeFile(`${folder}/package.json`, JSON.stringify(packageJson, null, 2), 'utf8')

      // Run `setup update -f` and check output
      try {
        await execFile('./node_modules/.bin/setup', ['update', '-f'], { cwd: folder })
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeFalsy()
      }

      const result = await readJsonFile<PackageJson>(`${folder}/package.json`)
      expect(result).toMatchObject({
        devDependencies: {
          '@babel/core': expect.stringMatching(/^\d+\.\d+\.\d+$/),
          eslint: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          typescript: expect.stringMatching(/^\d+\.\d+\.\d+$/)
        }
      })
      expect(result.devDependencies['@babel/core']).not.toEqual('1.3.37')
      expect(result.devDependencies['eslint']).not.toEqual('1.3.37')
      expect(result.devDependencies['typescript']).not.toEqual('1.3.37')
    }, 30000)

    it('should fix tsconfig.json with a manual run', async () => {
      await execFile('npm', ['init', '-y'], { cwd: folder })
      await execFile('npm', ['install', '--save-dev', `file://${process.cwd()}`], {
        cwd: folder
      })
      await execFile('./node_modules/.bin/setup', ['init'], { cwd: folder })

      const tsconfig = await readFile(`${folder}/tsconfig.json`, 'utf8')
      await writeFile(
        `${folder}/tsconfig.json`,
        // eslint-disable-next-line no-restricted-syntax
        tsconfig.replace('"rootDir": "./"', '"rootDirs": ["src", "bin"]'),
        'utf8'
      )

      // Run `setup update -f` and check output
      await execFile('./node_modules/.bin/setup', ['fix'], { cwd: folder })

      const result = await readFile(`${folder}/tsconfig.json`, 'utf8')
      expect(result).toMatch(/"rootDir": ".\/"/)
      expect(result).not.toMatch(/"rootDirs":/)
    }, 30000)

    it('should run fix on new installs', async () => {
      const tmpFolder = await createTemporaryFolder()
      await execFile('npm', ['init', '-y'], { cwd: tmpFolder })

      // Write broken tsconfig file
      const tsConfig = {
        extends: './node_modules/@connectedcars/setup/tsconfig',
        // All paths need to reset or they would be pointing to ./node_modules/@connectedcars/setup
        compilerOptions: {
          outDir: 'build/dist',
          rootDirs: ['src', 'bin']
        },
        exclude: ['build', 'node_modules', 'coverage']
      }
      await writeFile(`${tmpFolder}/tsconfig.json`, JSON.stringify(tsConfig), 'utf8')

      // Install package using postinstall hock to fix tsconfig.json
      await execFile('npm', ['install', '--save-dev', `file://${process.cwd()}`], {
        cwd: tmpFolder
      })
      const result = await readFile(`${tmpFolder}/tsconfig.json`, 'utf8')
      expect(result).toMatch(/"rootDir": ".\/"/)
      expect(result).not.toMatch(/"rootDirs":/)
    }, 30000)
  })
})
