const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const opentype = require('opentype.js')
const { createCanvas } = require('canvas')
const fontsConfig = require('./fonts-config')

const convertToRanges = (pieces) => {
  let ranges = [[pieces[0], pieces[0]]]
  // last index we accessed (so we know which range to update)
  let lastIndex = 0

  for (var i = 1; i < pieces.length; i++) {
    // if the current element is 1 away from the end of whichever range
    // we're currently in
    if (pieces[i] - ranges[lastIndex][1] === 1) {
      // update the end of that range to be this number
      ranges[lastIndex][1] = pieces[i]
    } else {
      // otherwise, add a new range to ranges
      ranges[++lastIndex] = [pieces[i], pieces[i]]
    }
  }
  return ranges
}

async function generateFonts({
  fontsConfig,
  fontBaseUrl,
  fontImageBaseUrl,
  fontsOutDir,
  fontImagesOutDir,
}) {
  const processedConfigs = []

  for (const fontConfig of fontsConfig) {
    const processedStyles = []

    for (const style of fontConfig.styles) {
      console.log(`Processing ${fontConfig.title} ${style.title}...`)
      const fontFilePath = path.join(__dirname, '../public/fonts', style.file)
      const font = opentype.loadSync(fontFilePath)

      const glyphUnicodes = _.sortBy(
        _.range(font.glyphs.length).map(
          (index) => font.glyphs.get(index).unicode
        )
      ).filter((unicode) => unicode > 0)
      const glyphRanges = convertToRanges(glyphUnicodes)

      const fontPath = font.getPath(fontConfig.title, 0, 0, 50)
      const bounds = fontPath.getBoundingBox()

      const canvas = createCanvas(bounds.x2 - bounds.x1, bounds.y2 - bounds.y1)
      const ctx = canvas.getContext('2d')
      ctx.translate(-bounds.x1, -bounds.y1)
      fontPath.draw(ctx)

      const imgFilename = `${fontConfig.title
        .toLowerCase()
        .replace(' ', '-')}:${style.title.toLowerCase().replace(' ', '-')}.png`
      const out = fs.createWriteStream(path.join(fontImagesOutDir, imgFilename))
      // console.log(`Generating PNG: ${path.join(fontImagesOutDir, imgFilename)}`)
      const stream = canvas.createPNGStream()
      stream.pipe(out)
      await new Promise((resolve) => out.on('finish', () => resolve()))

      processedStyles.push({
        fontId: `${fontConfig.title}:${style.title}`,
        title: style.title,
        thumbnail: `/images/fonts/${imgFilename}`,
        url: `/fonts/${style.file}`,
        glyphRanges,
      })
    }

    processedConfigs.push({
      title: fontConfig.title,
      categories: fontConfig.categories,
      styles: processedStyles,
    })
  }

  const exportString = `
  export type FontId = string

  export type FontStyleConfig = {
    fontId: FontId
    glyphRanges: number[][]
    title: string
    url: string
    thumbnail: string
  }

  export type FontConfig = {
    title: string
    categories?: string[]
    styles: FontStyleConfig[]
  }
  
  export const fonts: FontConfig[] = [${processedConfigs
    .map((fc) => {
      return JSON.stringify(fc, null, 2)
    })
    .join(',\n')}]
  `

  const resultFile = path.join(__dirname, '..', 'src/data/fonts.ts')
  console.log(`Writing out data to ${resultFile}`)
  fs.promises.writeFile(resultFile, exportString)
}

async function main() {
  const fontsOutDir = path.join(__dirname, '..', 'public/fonts/')
  const fontImagesOutDir = path.join(__dirname, '..', 'public/images/fonts/')
  const fontsConfigOutFile = path.join(__dirname, '..', 'src/data/fonts.ts')
  await generateFonts({
    fontsConfig,
    fontsConfigOutFile,
    fontsOutDir,
    fontImagesOutDir,
  })
}

main()
