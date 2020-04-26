const path = require('path')
const fs = require('fs')
const _ = require('lodash')

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
  const solidIcons = await processIcons('shapes/svg/fontawesome/solid/')

  const allIcons = [...solidIcons]

  const exportString = `
  export type IconConfig = {
    title: string,
    url: string
  }
  
  export const icons = [${allIcons
    .map((icon) => JSON.stringify(icon, null, 2))
    .join(',\n')}]
  `

  const resultFile = path.join(__dirname, '..', 'src/data/shapes.ts')
  fs.promises.writeFile(resultFile, exportString)
}

main()
