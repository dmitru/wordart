const path = require('path')
const fs = require('fs')
const _ = require('lodash')

const categories = ['animals', 'geo']

async function processIcons(dirPath) {
  const dir = await fs.promises.opendir(
    path.join(__dirname, '..', `./public/${dirPath}`)
  )

  const icons = []
  for await (const dirent of dir) {
    const filename = dirent.name
    const fullPath = path.join(dirPath, filename)
    console.log(`Processing: ${fullPath}`)
    icons.push({
      title: _.capitalize(filename.replace('-', ' ').replace('.svg', '')),
      kind: 'svg',
      url: `/${fullPath}`,
    })
  }

  return icons
}

async function main() {
  for (const category of categories) {
    console.log('Processing category ', category)
    const allIcons = await processIcons(`shapes/svg/${category}`)

    const exportString = `
    type ShapeConfig = {
      title: string,
      url: string,
      kind: 'svg' | 'raster',
    }
    
    const shapes = [${allIcons
      .map((icon) => JSON.stringify(icon, null, 2))
      .join(',\n')}];
    
    export default shapes;
    `

    const resultFile = path.join(
      __dirname,
      '..',
      `src/data/shapes-${category}.ts`
    )
    fs.promises.writeFile(resultFile, exportString)
  }
}

main()
