import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { SVG_DIST_DIR_NAME } from './constants'

const distDir = path.resolve(process.cwd(), SVG_DIST_DIR_NAME)

export function checkContribsPersistence(contribUserNames: string[], identifier: string) {
  if (!existsSync(distDir)) {
    mkdirSync(distDir)
  }
  const distDataFilePath = path.join(distDir, `${identifier}.json`)
  if (!existsSync(distDataFilePath)) {
    return
  }

  try {
    const persistenceDataJsonStr = String(readFileSync(distDataFilePath))
    if (JSON.stringify(contribUserNames) === persistenceDataJsonStr) {
      console.log('\nThere are no new contributors.\n')
      process.exit()
    }
  } catch (err) {
    console.log(`\nError: check contribs persistence failed ! ${err}`)
    process.exit()
  }
}

export function saveContribsPersistence(contribUserNames: string[], identifier: string) {
  const distDataFilePath = path.join(distDir, `${identifier}.json`)
  writeFileSync(
    distDataFilePath,
    JSON.stringify(contribUserNames)
  )
}