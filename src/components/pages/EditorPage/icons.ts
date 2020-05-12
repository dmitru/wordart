import { icons } from 'data/shapes'
import { iconsFaRegular } from 'data/shapes-fa-regular'
import { ShapeConfig } from 'components/pages/EditorPage/style'

export const svgIcons: ShapeConfig[] = [
  icons.find((i) => i.title === 'Square full'),
  ...icons.slice(0, 30),
]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: 100 + index,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
        } as ShapeConfig)
      : null
  )
  .filter((x) => x != null) as ShapeConfig[]

export const svgIconsOutline: ShapeConfig[] = [...iconsFaRegular.slice(0, 30)]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: 1000 + index,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
        } as ShapeConfig)
      : null
  )
  .filter((x) => x != null) as ShapeConfig[]

export const shapes: ShapeConfig[] = [
  {
    id: 1,
    kind: 'svg',
    title: 'Cat',
    url: '/images/cat.svg',
    keepSvgColors: true,
  },
  {
    id: -1,
    kind: 'svg',
    title: 'Apple',
    url: '/images/apple.svg',
    keepSvgColors: true,
  },
  {
    id: -2,
    kind: 'svg',
    title: 'Bear Face',
    url: '/images/bear-face.svg',
    keepSvgColors: true,
  },
  {
    id: -3,
    kind: 'svg',
    title: 'Bear Side',
    url: '/images/bear-side.svg',
    keepSvgColors: true,
  },
  {
    id: -4,
    kind: 'svg',
    title: 'Bear Belly',
    url: '/images/bear-belly.svg',
    keepSvgColors: true,
  },
  {
    id: 2,
    kind: 'img',
    title: 'Cat',
    url: '/images/cat.png',
  },
  {
    id: 3,
    kind: 'img',
    title: 'Beatles',
    url: '/images/beatles.jpg',
  },
  {
    id: 4,
    kind: 'img',
    title: 'Number Six',
    url: '/images/number_six.png',
  },
  {
    id: 5,
    kind: 'img',
    title: 'Darth Vader',
    url: '/images/darth_vader.jpg',
  },
  {
    id: 6,
    kind: 'svg',
    title: 'Flash',
    url: '/images/flash.svg',
    fill: 'red',
  },
  {
    id: 7,
    kind: 'svg',
    title: 'Yin Yang',
    url: '/images/yin-yang.svg',
    fill: 'green',
  },
  ...svgIcons,
  ...svgIconsOutline,
]
