type ShapeConfig = {
  title: string
  url: string
  kind: 'clipart:svg' | 'clipart:raster'
}

const shapes = [
  {
    title: 'Africa',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/africa.svg',
  },
  {
    title: 'Australia',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/australia.svg',
  },
  {
    title: 'Earth 3',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/earth-3.svg',
  },
  {
    title: 'Earth 2',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/earth-2.svg',
  },
  {
    title: 'Us',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/us.svg',
  },
  {
    title: 'Earth 1',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/earth-1.svg',
  },
  {
    title: 'Earth 4',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/earth-4.svg',
  },
  {
    title: 'Spain',
    kind: 'clipart:svg',
    url: '/shapes/svg/geo/spain.svg',
  },
]

export default shapes
