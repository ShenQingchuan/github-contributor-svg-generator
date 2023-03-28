import url from 'node:url';
import path from 'node:path';
import { optimize } from 'svgo'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { SVG_DIST_DIR_NAME } from './constants';

export function saveSVG(svgString: string, identifier: string) {
  const dirName = url.fileURLToPath(new URL('.', import.meta.url))
  const distDir = path.join(dirName, `../${SVG_DIST_DIR_NAME}`)
  if (!existsSync(distDir)) {
    mkdirSync(distDir)
  }
  const optimizedSvgString = optimize(svgString).data
  writeFileSync(
    path.join(distDir, `${identifier}.svg`),
    optimizedSvgString,
    { encoding: 'utf-8' }
  )
}
