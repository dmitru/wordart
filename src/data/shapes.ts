import { icons } from 'data/icons'
import { ShapeClipartConf, ShapeIconConf } from 'components/Editor/shape-config'
import animalsShapes from './shapes-animals'
import geoShapes from './shapes-geo'
import geometryShapes from './shapes-geometry'
import { iconsCategories } from 'data/icon-categories'
import { sortBy } from 'lodash'

const defaultEdgesProcessing = {
  amount: 80,
}

// @ts-ignore
const unsortedImageShapes: ShapeClipartConf[] = [
  ...[
    ...geometryShapes.map((s) => ({ ...s, categories: ['geometry'] })),
    ...geoShapes.map((s) => ({ ...s, categories: ['geo'] })),
    ...animalsShapes.map((s) => ({ ...s, categories: ['animals'] })),
    {
      kind: 'clipart:svg',
      title: 'Smile',
      url: '/images/smile.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Desert',
      url: '/images/desert.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Cat',
      url: '/images/cat.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Orange',
      url: '/images/orange.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Banana',
      url: '/images/banana.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Tree 1',
      url: '/images/tree.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Tree 2',
      url: '/images/tree-2.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Tree 3',
      url: '/images/tree-3.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Tree 4',
      url: '/images/tree-4.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Baloons',
      url: '/images/baloons.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Heart 1',
      url: '/images/heart-1.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Cloud 1',
      url: '/images/cloud-1.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Hand',
      url: '/images/hand.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Apple',
      url: '/images/apple.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Bear Face',
      url: '/images/bear-face.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Bear Side',
      url: '/images/bear-side.svg',
    },
    {
      kind: 'clipart:svg',
      title: 'Bear Belly',
      url: '/images/bear-belly.svg',
    },
    {
      kind: 'clipart:raster',
      title: 'Beatles',
      url: '/images/beatles.jpg',
    },
    {
      kind: 'clipart:raster',
      title: 'Number Six',
      url: '/images/number_six.png',
    },
    {
      kind: 'clipart:raster',
      title: 'Darth Vader',
      url: '/images/darth_vader.jpg',
    },
    {
      kind: 'clipart:svg',
      title: 'Flash',
      url: '/images/flash.svg',
      fill: 'red',
    },
    {
      kind: 'clipart:svg',
      title: 'Yin Yang',
      url: '/images/yin-yang.svg',
      fill: 'green',
    },
  ].map(
    (c, index) =>
      ({
        categories: ['other'],
        ...c,
        id: `${c.title.toLocaleLowerCase().replace(' ', '-')}`,
        thumbnailUrl: c.url,
        processedThumbnailUrl: c.url,
        processing: {
          colors: { kind: 'original' },
          edges: defaultEdgesProcessing,
        },
      } as ShapeClipartConf)
  ),
]

const getSortedIconsShapes = (): ShapeIconConf[] => {
  const categoryOrderMap: { [category: string]: number } = {}
  for (const [index, category] of iconsCategories.entries()) {
    categoryOrderMap[category.label] = index
  }

  return sortBy(
    icons,
    (s) => (s.categories ? categoryOrderMap[s.categories[0]] : 999999),
    (s) => s.title
  )
}

const getSortedImageShapes = (): ShapeClipartConf[] => {
  const map: { [category: string]: number } = {
    geometry: 10,
    geo: 200,
  }
  return sortBy(
    unsortedImageShapes,
    (s) => (s.categories ? map[s.categories[0]] || 999999 : 999999),
    (s) => s.title
  )
}

export const imageShapes = getSortedImageShapes()

export const iconShapes = getSortedIconsShapes()
