const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const fontsConfig = require('./wordart-fonts-config')

async function scrape({
  fontsConfig,
  fontBaseUrl,
  fontImageBaseUrl,
  fontsOutDir,
  fontImagesOutDir,
}) {
  for (const fontConfig of fontsConfig) {
  }
}

async function main() {
  const fontsOutDir = path.join(__dirname, '..', 'public/fonts/wordart')
  const fontImagesOutDir = path.join(
    __dirname,
    '..',
    'public/images/fonts/wordart'
  )
  await scrapeWordartFonts({
    fontsConfig,
    fontBaseUrl: `https://wordart.com/static/creator/fonts/`,
    fontImageBaseUrl: `https://wordart.com/static/creator/images/fonts/`,
    fontsOutDir,
    fontImagesOutDir,
  })
}

main()
