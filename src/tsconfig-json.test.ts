import { createTemporaryFolder } from './common'
import { readFile, writeFileAtomic } from './fsutils'
import { fixTSConfigJson } from './tsconfig-json'

describe('tsconfig.json', () => {
  it('should not throw when calling fixTSConfigJson on an empty folder', async () => {
    const tmpFolder = await createTemporaryFolder()
    await expect(fixTSConfigJson('', tmpFolder)).resolves.not.toThrow()
  })

  it('should fix tsconfig.json when calling fixTSConfigJson', async () => {
    const tmpFolder = await createTemporaryFolder()
    await writeFileAtomic(
      `${tmpFolder}/tsconfig.json`,
      JSON.stringify({
        extends: './node_modules/@connectedcars/setup/tsconfig',
        // All paths need to reset or they would be pointing to ./node_modules/@connectedcars/setup
        compilerOptions: {
          outDir: 'build/dist',
          rootDirs: ['src']
        },
        exclude: ['build', 'node_modules', 'coverage']
      })
    )
    await fixTSConfigJson('', tmpFolder)
    const changed = (await readFile(`${tmpFolder}/tsconfig.json`)).toString('utf8')
    expect(changed).toMatch(/rootDir/)
    expect(changed).not.toMatch(/rootDirs/)
  })
})
