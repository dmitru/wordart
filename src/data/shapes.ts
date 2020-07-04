import { iconsFaRegular } from 'data/icons-fa-regular'
import { iconsFaSolid } from 'data/icons-fa-solid'
import {
  ShapeConf,
  ShapeSvgConf,
  ShapeImageConf,
} from 'components/Editor/shape-config'
import animalsShapes from './shapes-animals'
import geoShapes from './shapes-geo'
import geometryShapes from './shapes-geometry'

const defaultEdgesProcessing = {
  amount: 80,
}

export const svgIcons: ShapeSvgConf[] = [...iconsFaSolid.slice(0, 10000)]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: `fa-${index}`,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
          thumbnailUrl: icon.url,
          processedThumbnailUrl: icon.url,
          processing: {
            colors: { kind: 'original' },
            edges: defaultEdgesProcessing,
          },
          categories: ['icon', 'solid'],
        } as ShapeSvgConf)
      : null
  )
  .filter((x) => x != null) as ShapeSvgConf[]

export const svgIconsOutline: ShapeSvgConf[] = [
  ...iconsFaRegular.slice(0, 10000),
]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: `fa-outline-${index}`,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
          thumbnailUrl: icon.url,
          processedThumbnailUrl: icon.url,
          processing: {
            colors: { kind: 'original' },
            edges: defaultEdgesProcessing,
          },
          categories: ['icon', 'outline'],
        } as ShapeSvgConf)
      : null
  )
  .filter((x) => x != null) as ShapeSvgConf[]

// @ts-ignore
export const imageShapes: ShapeImageConf[] = [
  ...[
    ...geometryShapes.map((s) => ({ ...s, categories: ['geometry'] })),
    ...geoShapes.map((s) => ({ ...s, categories: ['geo'] })),
    ...animalsShapes.map((s) => ({ ...s, categories: ['animals'] })),
    {
      kind: 'svg',
      title: 'Smile',
      url: '/images/smile.svg',
    },
    {
      kind: 'svg',
      title: 'Desert',
      url: '/images/desert.svg',
    },
    {
      kind: 'svg',
      title: 'Cat',
      url: '/images/cat.svg',
    },
    {
      kind: 'svg',
      title: 'Orange',
      url: '/images/orange.svg',
    },
    {
      kind: 'svg',
      title: 'Banana',
      url: '/images/banana.svg',
    },
    {
      kind: 'svg',
      title: 'Tree 1',
      url: '/images/tree.svg',
    },
    {
      kind: 'svg',
      title: 'Tree 2',
      url: '/images/tree-2.svg',
    },
    {
      kind: 'svg',
      title: 'Tree 3',
      url: '/images/tree-3.svg',
    },
    {
      kind: 'svg',
      title: 'Tree 4',
      url: '/images/tree-4.svg',
    },
    {
      kind: 'svg',
      title: 'Baloons',
      url: '/images/baloons.svg',
    },
    {
      kind: 'svg',
      title: 'Heart 1',
      url: '/images/heart-1.svg',
    },
    {
      kind: 'svg',
      title: 'Cloud 1',
      url: '/images/cloud-1.svg',
    },
    {
      kind: 'svg',
      title: 'Hand',
      url: '/images/hand.svg',
    },
    {
      kind: 'svg',
      title: 'Apple',
      url: '/images/apple.svg',
    },
    {
      kind: 'svg',
      title: 'Bear Face',
      url: '/images/bear-face.svg',
    },
    {
      kind: 'svg',
      title: 'Bear Side',
      url: '/images/bear-side.svg',
    },
    {
      kind: 'svg',
      title: 'Bear Belly',
      url: '/images/bear-belly.svg',
    },
    {
      kind: 'raster',
      title: 'Beatles',
      url: '/images/beatles.jpg',
    },
    {
      kind: 'raster',
      title: 'Number Six',
      url: '/images/number_six.png',
    },
    {
      kind: 'raster',
      title: 'Darth Vader',
      url: '/images/darth_vader.jpg',
    },
    {
      kind: 'svg',
      title: 'Flash',
      url: '/images/flash.svg',
      fill: 'red',
    },
    {
      kind: 'svg',
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
      } as ShapeImageConf)
  ),
]

export const iconShapes = [...svgIcons, ...svgIconsOutline]
