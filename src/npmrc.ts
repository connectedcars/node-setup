import fs from 'node:fs/promises'
import path from 'node:path'

import { writeFileAtomic } from './fsutils'

export type NpmRc = string[]

export async function readNpmRc(path: string): Promise<NpmRc | null> {
  try {
    return Buffer.from(await fs.readFile(path, 'utf8'))
      .toString('utf8')
      .split('\n')
  } catch {
    return null
  }
}

async function createNpmRc(templatePath: string, targetPath: string): Promise<void> {
  // TODO: copy instead
  const templateNpmRc = await readNpmRc(`${templatePath}/.npmrc`)

  if (!templateNpmRc) {
    throw new Error(`Failed to find template .npmrc path at '${templatePath}'`)
  }

  await writeFileAtomic(targetPath, templateNpmRc.join('\n'))
}

async function updateNpmRc(targetPath: string): Promise<void> {
  const npmrc = await readNpmRc(targetPath)

  if (!npmrc) {
    throw new Error(`Failed to find template .npmrc path at '${targetPath}'`)
  }

  let hasMinReleaseAge = false
  let hasMinReleaseAgeExclude = false
  let hasEngineStrict = false
  const mergedLines = []

  for (const line of npmrc) {
    const minReleageAgeMatch = line.match(/^min-release-age=(\d+)/)

    if (minReleageAgeMatch) {
      if (hasMinReleaseAge) {
        continue
      }

      hasMinReleaseAge = true

      if (Number(minReleageAgeMatch[1]) < 7) {
        mergedLines.push('min-release-age=7')
      } else {
        mergedLines.push(line)
      }

      continue
    }

    const minReleageAgeExcludeMatch = line.match(/^min-release-age-exclude\[\]=(.+)/)

    if (minReleageAgeExcludeMatch) {
      if (minReleageAgeExcludeMatch[1] === '@connectedcars/*') {
        hasMinReleaseAgeExclude = true
      }
    }

    const engineStrictMatch = line.match(/^engine-strict=(\w+)/)

    if (engineStrictMatch) {
      if (engineStrictMatch[1] === 'true') {
        hasEngineStrict = true
      } else {
        continue
      }
    }

    mergedLines.push(line)
  }

  if (!hasMinReleaseAge) {
    mergedLines.push('min-release-age=7')
  }

  if (!hasMinReleaseAgeExclude) {
    mergedLines.push('min-release-age-exclude[]=@connectedcars/*')
  }

  if (!hasEngineStrict) {
    mergedLines.push('engine-strict=true')
  }

  await writeFileAtomic(targetPath, mergedLines.join('\n'))
}

export async function createOrUpdateNpmRc(templatePath: string, targetPath: string): Promise<void> {
  const targetNpmRc = path.join(targetPath, '.npmrc')
  const npmrc = await readNpmRc(targetNpmRc)

  if (!npmrc) {
    await createNpmRc(templatePath, targetNpmRc)
  } else {
    await updateNpmRc(targetNpmRc)
  }
}
