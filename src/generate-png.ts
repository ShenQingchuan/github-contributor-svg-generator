import url from 'url'
import path from 'path'
import ora from "ora"
import fetch from 'node-fetch'
import { Resvg } from '@resvg/resvg-js'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

export async function generatePNG(
  params: {
    identifier: string,
    svgString: string,
  },
) {
  const { identifier, svgString } = params
  const generatePNGSpin = ora('Generating PNG image...').start()
  const resvg = new Resvg(svgString, {
    font: {
      loadSystemFonts: true
    }
  })
  generatePNGSpin.text = 'Resolving all avatars...'
  generatePNGSpin.render()
  const resolved = await Promise.all(
    resvg.imagesToResolve().map(async url => {
      const img = await fetch(url)
      const buffer = await img.arrayBuffer()
      return {
        url,
        mime: 'image/png',
        buffer: Buffer.from(buffer),
      }
    })
  )
  for (const result of resolved) {
    const { url, buffer } = result
    resvg.resolveImage(url, buffer)
  }
  generatePNGSpin.succeed('Resolving all avatars done')
  generatePNGSpin.start('Generating PNG file')
  const pngData = resvg.render().asPng()
  const dirName = url.fileURLToPath(new URL('.', import.meta.url))
  const distDir = path.resolve(dirName, '../dist')
  const pngFilePath = path.join(distDir, `${identifier}.png`)
  const finalDir = pngFilePath.split('/').slice(0, -1).join('/')
  console.log('finalDir', finalDir)
  if (!existsSync(finalDir)) {
    mkdirSync(finalDir)
  }
  writeFileSync(pngFilePath, pngData)
  generatePNGSpin.succeed('Generating PNG file done.')
}