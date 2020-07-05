const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const YAML = require('YAML')

const iconsMeta = YAML.parse(
  fs.readFileSync(path.join(__dirname, './fa-icons/icons.yml'), 'utf8')
)
const categoriesMeta = YAML.parse(
  fs.readFileSync(path.join(__dirname, './fa-icons/categories.yml'), 'utf8')
)

const iconToCategories = {}
for (const { icons, label } of Object.values(categoriesMeta)) {
  console.log('icons = ', icons)
  for (const icon of icons) {
    if (!iconToCategories[icon]) {
      iconToCategories[icon] = []
    }
    iconToCategories[icon].push(label)
  }
}

console.log('iconToCategories', iconToCategories)

async function processIcons(dirPath, type) {
  console.log(path.join(__dirname, '..', `./public/${dirPath}`))
  const dir = await fs.promises.opendir(
    path.join(__dirname, '..', `./public/${dirPath}`)
  )

  const icons = []
  for await (const dirent of dir) {
    const filename = dirent.name
    const iconName = filename.replace('.svg', '')

    const iconInfo = iconsMeta[iconName]
    if (!iconInfo) {
      console.log(`MISSING config for ${iconName}`)
      continue
    }

    const fullPath = path.join(dirPath, filename)
    console.log(`Processing: ${fullPath}`)

    icons.push({
      name: iconName,
      type,
      title: iconInfo.label,
      keywords: iconInfo.search.terms,
      categories: iconToCategories[iconName] || [],
      url: `/${fullPath}`,
    })
  }

  return icons
}

async function process(kind) {
  const solidIcons = await processIcons(`shapes/svg/fontawesome/${kind}`, kind)

  const allIcons = [...solidIcons]

  const exportString = `
  export type IconConfig = {
    type: string
    title: string
    name: string
    url: string
    keywords: string[]
    categories: string[]
  }
  
  export const icons: IconConfig[] = [${allIcons
    .map((icon) => JSON.stringify(icon, null, 2))
    .join(',\n')}]
    `

  const resultFile = path.join(__dirname, '..', `src/data/icons-fa-${kind}.ts`)
  await fs.promises.writeFile(resultFile, exportString)
}

const kinds = ['solid', 'regular', 'brands']
async function main() {
  for (kind of kinds) {
    await process(kind)
  }

  const resultFile = path.join(__dirname, '..', `src/data/icon-categories.ts`)
  await fs.promises.writeFile(
    resultFile,
    `
  export const iconsCategories: {label: string, count: number}[] = [
    ${Object.values(categoriesMeta)
      .map((c) => `{label: '${c.label}', count: ${c.icons.length}}`)
      .join(', ')}
  ]
  `
  )
}

main(0)
