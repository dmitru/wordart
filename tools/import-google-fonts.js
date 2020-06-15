const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const opentype = require('opentype.js')
const { createCanvas } = require('canvas')
const http = require('http')
const https = require('https')

/**
 * Downloads file from remote HTTP[S] host and puts its contents to the
 * specified location.
 */
async function download(url, filePath) {
  const proto = !url.charAt(4).localeCompare('s') ? https : http

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath)
    let fileInfo = null

    const request = proto.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`))
        return
      }

      fileInfo = {
        mime: response.headers['content-type'],
        size: parseInt(response.headers['content-length'], 10),
      }

      response.pipe(file)
    })

    // The destination stream is ended by the time it's called
    file.on('finish', () => resolve(fileInfo))

    request.on('error', (err) => {
      fs.unlink(filePath, () => reject(err))
    })

    file.on('error', (err) => {
      fs.unlink(filePath, () => reject(err))
    })

    request.end()
  })
}

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

const fontData = {
  id: 'roboto',
  family: 'Roboto',
  variants: [
    {
      id: '100',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgWxO.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '100',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgWxK.woff2',

      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgWxP.ttf',
      woff: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgWxM.woff',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOkCnqEu92Fr1MmgWxN&skey=5473b731ec7fc9c1&v=v20#Roboto',
    },
    {
      id: '100italic',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOiCnqEu92Fr1Mu51QrIzQ.woff',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '100',

      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOiCnqEu92Fr1Mu51QrIzI.woff2',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOiCnqEu92Fr1Mu51QrIzY.eot',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOiCnqEu92Fr1Mu51QrIzc.ttf',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOiCnqEu92Fr1Mu51QrIzU&skey=8f53aa2e7deadc4a&v=v20#Roboto',
    },
    {
      id: '300',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5vAA.woff',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '300',

      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5vAg.eot',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5vAw.ttf',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOlCnqEu92Fr1MmSU5vAQ&skey=11ce8ad5f54705ca&v=v20#Roboto',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5vBg.woff2',
    },
    {
      id: '300italic',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TjARc-.woff',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '300',

      eot:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TjARc8.eot',
      ttf:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TjARc9.ttf',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TjARc4.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOjCnqEu92Fr1Mu51TjARc_&skey=8f644060176e1f7e&v=v20#Roboto',
    },
    {
      id: 'regular',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5A.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '400',
      woff: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5g.woff',

      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOmCnqEu92Fr1Me5w&skey=a0a0114a1dcab3ac&v=v20#Roboto',
      woff2: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me4A.woff2',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5Q.ttf',
    },
    {
      id: 'italic',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1Mu52xO.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '400',
      woff: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1Mu52xM.woff',

      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1Mu52xK.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOkCnqEu92Fr1Mu52xN&skey=c608c610063635f9&v=v20#Roboto',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1Mu52xP.ttf',
    },
    {
      id: '500',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9vAA.woff',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '500',

      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9vAg.eot',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9vBg.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOlCnqEu92Fr1MmEU9vAQ&skey=ee881451c540fdec&v=v20#Roboto',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9vAw.ttf',
    },
    {
      id: '500italic',
      eot:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51S7ABc8.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '500',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51S7ABc-.woff',

      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51S7ABc4.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOjCnqEu92Fr1Mu51S7ABc_&skey=c985e17098069ce0&v=v20#Roboto',
      ttf:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51S7ABc9.ttf',
    },
    {
      id: '700',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlvAg.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '700',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlvBg.woff2',

      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlvAA.woff',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOlCnqEu92Fr1MmWUlvAQ&skey=c06e7213f788649e&v=v20#Roboto',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlvAw.ttf',
    },
    {
      id: '700italic',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TzBhc-.woff',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '700',

      eot:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TzBhc8.eot',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TzBhc4.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOjCnqEu92Fr1Mu51TzBhc_&skey=dd030d266f3beccc&v=v20#Roboto',
      ttf:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TzBhc9.ttf',
    },
    {
      id: '900',
      eot: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmYUtvAg.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'normal',
      fontWeight: '900',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmYUtvAA.woff',

      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOlCnqEu92Fr1MmYUtvAQ&skey=934406f772f9777d&v=v20#Roboto',
      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmYUtvBg.woff2',
      ttf: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmYUtvAw.ttf',
    },
    {
      id: '900italic',
      eot:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TLBBc8.eot',
      fontFamily: "'Roboto'",
      fontStyle: 'italic',
      fontWeight: '900',
      woff:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TLBBc-.woff',

      woff2:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TLBBc4.woff2',
      svg:
        'https://fonts.gstatic.com/l/font?kit=KFOjCnqEu92Fr1Mu51TLBBc_&skey=b80be3241fe40325&v=v20#Roboto',
      ttf:
        'https://fonts.gstatic.com/s/roboto/v20/KFOjCnqEu92Fr1Mu51TLBBc9.ttf',
    },
  ],
  subsets: [
    'cyrillic',
    'cyrillic-ext',
    'greek',
    'greek-ext',
    'latin',
    'latin-ext',
    'vietnamese',
  ],
  category: 'sans-serif',
  version: 'v20',
  lastModified: '2019-07-24',
  popularity: 1,
  defSubset: 'latin',
  defVariant: 'regular',
  subsetMap: {
    cyrillic: true,
    'cyrillic-ext': true,
    greek: true,
    'greek-ext': true,
    latin: true,
    'latin-ext': true,
    vietnamese: true,
  },
  storeID: 'vietnamese_latin-ext_latin_greek-ext_greek_cyrillic-ext_cyrillic',
}

const fontsOutDir = path.join(__dirname, '..', 'public/fonts/')
const fontImagesOutDir = path.join(__dirname, '..', 'public/images/fonts/')
const fontsConfigOutFile = path.join(__dirname, '..', 'src/data/fonts.ts')

const fetchFontInfoById = async (id, subsets) => {
  const res = await fetch(
    `https://google-webfonts-helper.herokuapp.com/api/fonts/${id}?subsets=${subsets.join(
      ','
    )}`
  )
  const data = await res.json()
  return data
}

const fetchAllFonts = async () => {
  const res = await fetch(
    'https://google-webfonts-helper.herokuapp.com/api/fonts'
  )
  const data = await res.json()
  return data
}

const fontIds = ['pt-sans-caption']

const main = async () => {
  const processedConfigs = []

  const processFont = async (fontData) => {
    console.log(fontData)
    const fontFamily = fontData.family

    // 1. find variants to process // TODO
    const variants = fontData.variants

    const processedStyles = []
    let glyphRanges
    for (const variant of variants) {
      // 2. download TTF font file
      const ttfUrl = variant.ttf || variant.woff
      if (!ttfUrl) {
        throw new Error('No TTF URL')
      }

      const fontId = `${fontFamily}:${variant.id}`

      const fontOutPath = path.join(fontsOutDir, `${fontId}.ttf`)

      await download(ttfUrl, fontOutPath)
      console.log(`Saved ${fontOutPath}`)
      const font = opentype.loadSync(fontOutPath)

      // 3. generate glyph ranges
      if (!glyphRanges) {
        const glyphUnicodes = _.sortBy(
          _.range(font.glyphs.length).map(
            (index) => font.glyphs.get(index).unicode
          )
        ).filter((unicode) => unicode > 0)
        glyphRanges = convertToRanges(glyphUnicodes)
      }

      // 3. generate thumbnail
      const fontPath = font.getPath(fontFamily, 0, 0, 50)
      const bounds = fontPath.getBoundingBox()

      const canvas = createCanvas(bounds.x2 - bounds.x1, bounds.y2 - bounds.y1)
      const ctx = canvas.getContext('2d')
      ctx.translate(-bounds.x1, -bounds.y1)
      fontPath.draw(ctx)

      const imgFilename = `${fontId}.png`
      const out = fs.createWriteStream(path.join(fontImagesOutDir, imgFilename))
      // console.log(`Generating PNG: ${path.join(fontImagesOutDir, imgFilename)}`)
      const stream = canvas.createPNGStream()
      stream.pipe(out)
      await new Promise((resolve) => out.on('finish', () => resolve()))
      console.log(`Saved ${imgFilename}`)

      processedStyles.push({
        fontId,
        title: variant.id,
        thumbnail: `/images/fonts/${imgFilename}`,
        url: ttfUrl,
        fontWeight: variant.fontWeight,
        fontStyle: variant.fontStyle,
      })
    }

    processedConfigs.push({
      popularity: fontData.popularity,
      subsets: fontData.subsets,
      title: fontFamily,
      categories: fontData.categories,
      styles: processedStyles,
      glyphRanges,
    })
  }

  // processFont(fontData)

  const fontsInfo = await fetchAllFonts()
  for (const [index, fontInfo] of fontsInfo.entries()) {
    const { subsets, id } = fontInfo
    console.log(`Processing ${id}, ${index} / ${fontsInfo.length}...`)
    try {
      const fontData = await fetchFontInfoById(id, subsets)
      if (!fontData.subsetMap.latin) {
        continue
      }
      await processFont(fontData)
    } catch (error) {
      if (error) {
        console.error(error)
      }
    }
    // if (index > 10) {
    //   break
    // }
  }

  const exportString = `
  export type FontId = string

  export type FontStyleConfig = {
    fontId: FontId
    title: string
    url: string
    thumbnail: string
    fontStyle: string
    fontWeight: string
  }
  
  export type FontConfig = {
    title: string
    popularity: number
    categories?: string[]
    styles: FontStyleConfig[]
    subsets: string[]
    glyphRanges: number[][]
  }
  
  export const fonts: FontConfig[] = [${processedConfigs
    .map((fc) => {
      return JSON.stringify(fc, null, 2)
    })
    .join(',\n')}]
  `

  const resultFile = path.join(__dirname, '..', 'src/data/fonts.ts')
  console.log(`Writing out data to ${resultFile}`)
  await fs.promises.writeFile(resultFile, exportString)
}

main()
