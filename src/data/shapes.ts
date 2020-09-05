import { ShapeClipartConf, ShapeIconConf } from 'components/Editor/shape-config'
import { iconsCategories } from 'data/icon-categories'
import { last, sortBy } from 'lodash'

const defaultEdgesProcessing = {
  amount: 98,
}

export let shapes: ShapeClipartConf[] = []
export let shapeCategories: { category: string; title: string }[] = []

export const loadShapesConfig = async () => {
  const [shapesData, shapeCategoriesData] = await Promise.all([
    fetch('/shapes/shapes.json').then((res) => res.json()),
    fetch('/shapes/shape-categories.json').then((res) => res.json()),
  ])

  shapeCategories = shapeCategoriesData.map((row: string) => ({
    category: row[0],
    title: row[1],
  }))

  for (const shape of shapesData) {
    const absoluteUrl =
      shape.url.startsWith('/') || shape.url.startsWith('http')
        ? (shape.url as string)
        : `/shapes/svg/${shape.url}`

    // Fallback title from filename
    const title =
      shape.title ||
      last(absoluteUrl.split('/') as string[])!
        .replace('.svg', '')
        .replace('-', ' ')
        .toLowerCase()

    shapes.push({
      categories: ['other'],
      ...shape,
      title,
      kind: 'clipart:svg',
      id: `${(shape.title || title).replace(' ', '-').toLowerCase()}`,
      url: absoluteUrl,
      thumbnailUrl: absoluteUrl,
      processedThumbnailUrl: absoluteUrl,
      processing: {
        colors: { kind: 'original' },
        edges: defaultEdgesProcessing,
      },
    } as ShapeClipartConf)
  }
}

export const getSortedIconsShapes = (
  icons: ShapeIconConf[]
): ShapeIconConf[] => {
  const categoryOrderMap: { [category: string]: number } = {}

  for (const [index, category] of iconsCategories.entries()) {
    categoryOrderMap[category.label] = index
  }

  const iconsSorted = sortBy(
    icons,
    (s) =>
      s.categories && categoryOrderMap[s.categories[0]] != null
        ? categoryOrderMap[s.categories[0]]
        : 999999,
    (s) => s.title
  )

  return iconsSorted
}

export const getSortedImageShapes = (
  shapes: ShapeClipartConf[]
): ShapeClipartConf[] => {
  const map: { [category: string]: number } = {}

  shapeCategories.forEach((category, index) => {
    map[category.category] = index
  })

  return sortBy(
    shapes,
    (s) => (s.categories ? map[s.categories[0]] ?? 999 : 999),
    (s) => (s.keywords ? (s.keywords.includes('silhouette') ? 0 : 1) : 0)
  )
}
