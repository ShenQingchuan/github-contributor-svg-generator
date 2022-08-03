import url from 'url'
import path from 'path'
import ora from "ora"
import fetch from 'node-fetch'
import { Resvg } from '@resvg/resvg-js'
import { TinyPNG } from 'tinypng'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

export async function generatePNG(
  params: {
    identifier: string,
    svgString: string,
    tinyPNGAPIKey: string,
  },
) {
  const { identifier, svgString, tinyPNGAPIKey } = params
  const pngSpin = ora('Generating PNG image...').start()
  const resvg = new Resvg(svgString)
  pngSpin.text = 'Resolving all avatars...'
  pngSpin.render()
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
  pngSpin.succeed('Resolving all avatars done')
  pngSpin.start('Generating PNG file')
  const pngData = resvg.render().asPng()
  const dirName = url.fileURLToPath(new URL('.', import.meta.url))
  const distDir = path.resolve(dirName, '../dist')
  const pngFilePath = path.join(distDir, `${identifier}.png`)
  const finalDir = pngFilePath.split('/').slice(0, -1).join('/')
  if (!existsSync(finalDir)) {
    mkdirSync(finalDir)
  }
  
  pngSpin.start('Compressing PNG...')
  const tinypngClient = new TinyPNG(tinyPNGAPIKey)
  const compressed = await tinypngClient.compress(pngData)
  pngSpin.info('Compressing PNG done')
  
  writeFileSync(pngFilePath, compressed.data)
  pngSpin.succeed('Generating PNG file done.')
}