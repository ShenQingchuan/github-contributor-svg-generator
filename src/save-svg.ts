import path from 'node:path';
// import { optimize } from 'svgo'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { SVG_DIST_DIR_NAME } from './constants';

export function saveSVG(svgString: string, identifier: string) {
  const distDir = path.join(process.cwd(), SVG_DIST_DIR_NAME)
  if (!existsSync(distDir)) {
    mkdirSync(distDir)
  }
  const optimizedSvgString = svgString.replace('\n', '').replace(/\s+/g, ' ')
  // const optimizedSvgString = optimize(svgString).data
  const distFilePath = path.join(distDir, `${identifier}.svg`)
  console.log(`Write SVG file to ${distFilePath}`)
  writeFileSync(
    distFilePath,
    optimizedSvgString,
    { encoding: 'utf-8' }
  )
}
