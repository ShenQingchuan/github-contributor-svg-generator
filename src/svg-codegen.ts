import ora from 'ora'
import { $fetch } from 'ofetch'
import sharp from 'sharp'
import { SVG_STYLESHEETS } from './constants'
import type { ContributorsInfo } from './types'

// @ts-expect-error missing types
import imageDataURI from 'image-data-uri'

function toBuffer(ab: ArrayBuffer) {
  const buf = Buffer.alloc(ab.byteLength)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buf.length; ++i)
    buf[i] = view[i]

  return buf
}
async function round(image: string | ArrayBuffer, radius = 0.5, size = 100) {
  const rect = Buffer.from(
    `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size * radius}" ry="${size * radius}"/></svg>`,
  )

  return await sharp(typeof image === 'string' ? image : toBuffer(image))
    .resize(size, size, { fit: sharp.fit.cover })
    .composite([{
      blend: 'dest-in',
      input: rect,
      density: 72,
    }])
    .png({ quality: 80, compressionLevel: 8 })
    .toBuffer()
}
async function getAvatarDataURI(avatarURL: string) {
  const avatarData = await $fetch(avatarURL, { responseType: 'arrayBuffer' })
  const avatarDataURL = await imageDataURI.encode(
    await round(avatarData, 0.5, 50), 'PNG'
  )
  return avatarDataURL
}
async function getImgSVGElement(params: {
  imgX: number, 
  imgY: number, 
  imgSize: number, 
  avatarURL: string,
}) {
  const { imgX, imgY, imgSize, avatarURL } = params
  try {
    return `<image x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" xlink:href="${avatarURL}" clip-path="url(#avatarClipPath)" />`
  } catch (e) {
    console.error(`Fetch user avatar error: ${e}`)
    throw e
  }
}

const getContributorSVGTitle = (centerX: number, yStart: number) => {
  return `<text class="contributors-title" x="${centerX}" y="${yStart}" text-anchor="middle">Contributors</text>`
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
  const clipPathDefs = '\n  <defs><clipPath id="avatarClipPath" clipPathUnits="objectBoundingBox"><circle cx="0.5" cy=".5" r=".5"/></clipPath></defs>\n'
  return `<svg 
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${imgWidth} ${imgHeight}" width="${imgWidth}" height="${imgHeight}"
>` + clipPathDefs
}

export async function generateContributorsSVGFile(
  params: {
    imgWidth: number,
    blockSize: number,
    lineCount: number,
  }, 
  contributorsMap: Map<string, ContributorsInfo>
) {
  const { imgWidth, blockSize, lineCount } = params
  if (lineCount % 2 !== 0) {
    throw Error('[Generating SVG] line count must be even')
  }
  const generatingSvgSpin = ora('Generating SVG file...').start()

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
`;

  // Convert all contributors' avatar URL to DataURI
  await Promise.all(
    Array.from(contributorsMap.entries())
      .map(async ([userName, contribInfo]) => {
        const avatarDataURI: string = await getAvatarDataURI(contribInfo.avatarURL)
        contributorsMap.get(userName)!.avatarURL = avatarDataURI
      })
  )

  const contributorsIterator = contributorsMap.entries()
  let contributorEntry = contributorsIterator.next()
  let countForLine = 0
  let lineIndex = 0
  while (!contributorEntry.done) {
    const [userName, contributorInfo] = contributorEntry.value
    const imgX = startX + (countForLine * blockSize)
    const imgY = Y_CONTENT_START + MARGIN + (lineIndex * (AVATAR_SIZE + TEXT_FONT_SIZE + MARGIN))
    const imgSVGElement = await getImgSVGElement({
      imgX, imgY,
      imgSize: AVATAR_SIZE,
      avatarURL: contributorInfo.avatarURL,
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

  svgContent = `${getSVGHeader(imgWidth, ((lineIndex + 1) * blockSize) + MARGIN + Y_START)}\n${svgContent}\n</svg>`
  generatingSvgSpin.succeed('Generated SVG content string.')
  return svgContent
}
