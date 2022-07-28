import { SVG_STYLESHEETS } from './constants'
import { existsSync, mkdirSync, writeFile } from 'fs'
import ora from 'ora'
import url from 'url'
import path from 'path'
import type { ContributorsInfo } from './types'

const getContributorSVGTitle = (centerX: number, yStart: number) => {
  return `<text class="contributors-title" x="${centerX}" y="${yStart}" text-anchor="middle">Contributors</text>`
}
const getImgSVGElement = (params: {
  imgX: number, 
  imgY: number, 
  imgSize: number, 
  avatarURL: string,
}) => {
  const { imgX, imgY, imgSize, avatarURL } = params
  return `<image x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" xlink:href="${avatarURL}" clip-path="inset(0% round 100%)" />`
}
const getNameTextSVGElement = (params: { textX: number; textY: number; text: string }) => {
  const { textX, textY, text } = params
  return `<text x="${textX}" y="${textY}" text-anchor="middle" class="contributor-name" fill="currentColor">${text}</text>`
}
const getAnchorWrapSVGElement = (userName: string, innerHTML: string) => {
  const githubProfileURL = `https://github.com/${userName}`
  return `<a class="contributor-link" xlink:href="${githubProfileURL}" target="_blank" id="${userName}">\n  ${innerHTML}\n</a>\n`
}
const getSVGHeader = (imgWidth: number, imgHeight: number) => {
  return `<svg 
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${imgWidth} ${imgHeight}" width="${imgWidth}" height="${imgHeight}"
>`
}

export function generateContributorsSVGFile(params: {
  imgWidth: number,
  blockSize: number,
  lineCount: number,
}, contributorsMap: [string, ContributorsInfo][]) {
  const { imgWidth, blockSize, lineCount } = params
  if (lineCount % 2 !== 0) {
    throw Error('[Generating SVG] line count must be even')
  }

  // Hint: These constants may be able to be customized by config params
  const Y_START = 40
  const TITLE_FONT_SIZE = 20
  const TEXT_FONT_SIZE = 14
  const Y_CONTENT_START = Y_START + TITLE_FONT_SIZE
  const MARGIN = 18

  const CENTER = imgWidth / 2
  const AVATAR_SIZE = blockSize * 0.625
  const SPACE = (blockSize - AVATAR_SIZE) / 2
  const startX = CENTER - ((lineCount / 2) * blockSize) + SPACE
  const getTextX = (imgX: number) => imgX + (AVATAR_SIZE / 2)

  let svgContent = `
${SVG_STYLESHEETS}
${getContributorSVGTitle(CENTER, Y_START)}
`

  const contributorsIterator = contributorsMap.entries()
  let contributorEntry = contributorsIterator.next()
  let countForLine = 0
  let lineIndex = 0
  while (!contributorEntry.done) {
    const [_, [userName, contributorInfo]] = contributorEntry.value
    const imgX = startX + (countForLine * blockSize)
    const imgY = Y_CONTENT_START + MARGIN + (lineIndex * (AVATAR_SIZE + TEXT_FONT_SIZE + MARGIN))
    const imgSVGElement = getImgSVGElement({
      imgX, imgY, imgSize: AVATAR_SIZE, avatarURL: contributorInfo.avatarURL,
    })
    const textX = getTextX(imgX)
    const textY = imgY + AVATAR_SIZE + MARGIN
    const nameTextSVGElement = getNameTextSVGElement({
      textX, textY, text: userName,
    })
    const anchorWrapSVGElement = getAnchorWrapSVGElement(userName, `${imgSVGElement}\n${nameTextSVGElement}`)
    svgContent += anchorWrapSVGElement
    
    countForLine += 1
    if (countForLine === lineCount) {
      countForLine = 0
      lineIndex += 1
    }
    contributorEntry = contributorsIterator.next()
  }

  const dirName = url.fileURLToPath(new URL('.', import.meta.url))
  const distDir = path.resolve(dirName, '../dist')
  if (!existsSync(distDir)) {
    mkdirSync(distDir)
  }
  svgContent = `${getSVGHeader(imgWidth, (lineIndex + 1) * blockSize)}\n${svgContent}\n</svg>`
  const svgFilePath = path.join(distDir, 'contributors.svg')
  writeFile(svgFilePath, svgContent, { flag: 'w' }, (err) => {
    if (err) {
      console.log('[Generating SVG] Failed to write SVG content, error: ', err)
    }
  })
  ora().succeed('[Generating SVG] Successfully generated SVG file')
}
