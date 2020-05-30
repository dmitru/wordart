import { iconsFaRegular } from 'data/icons-fa-regular'
import { iconsFaSolid } from 'data/icons-fa-solid'
import { ShapeConf } from 'components/Editor/shape-config'

export const svgIcons: ShapeConf[] = [
  iconsFaSolid.find((i) => i.title === 'Square full'),
  ...iconsFaSolid.slice(0, 5),
]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: `i-${100 + index}`,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
          thumbnailUrl: icon.url,
        } as ShapeConf)
      : null
  )
  .filter((x) => x != null) as ShapeConf[]

export const svgIconsOutline: ShapeConf[] = [...iconsFaRegular.slice(0, 5)]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: `io-${1000 + index}`,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
          thumbnailUrl: icon.url,
        } as ShapeConf)
      : null
  )
  .filter((x) => x != null) as ShapeConf[]

// @ts-ignore
export const shapes: ShapeConf[] = [
  ...[
    {
      kind: 'svg',
      title: 'Smile',
      url: '/images/smile.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Desert',
      url: '/images/desert.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Cat',
      url: '/images/cat.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Orange',
      url: '/images/orange.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Banana',
      url: '/images/banana.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Tree 1',
      url: '/images/tree.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Tree 2',
      url: '/images/tree-2.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Tree 3',
      url: '/images/tree-3.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Tree 4',
      url: '/images/tree-4.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Baloons',
      url: '/images/baloons.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Heart 1',
      url: '/images/heart-1.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Cloud 1',
      url: '/images/cloud-1.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Hand',
      url: '/images/hand.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Apple',
      url: '/images/apple.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Bear Face',
      url: '/images/bear-face.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Bear Side',
      url: '/images/bear-side.svg',
      keepSvgColors: true,
    },
    {
      kind: 'svg',
      title: 'Bear Belly',
      url: '/images/bear-belly.svg',
      keepSvgColors: true,
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
  ].map((c, index) => ({ ...c, id: `${index + 1}`, thumbnailUrl: c.url })),
  ...svgIcons,
  ...svgIconsOutline,
]
