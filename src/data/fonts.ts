import { Font } from 'opentype.js'

export type FontId = string

export type FontStyleConfig = {
  fontId: FontId
  glyphRanges: number[][]
  title: string
  url: string
  thumbnail: string
}

export type FontConfig = {
  title: string
  isCustom?: boolean
  categories?: string[]
  styles: FontStyleConfig[]
}

export const fonts: FontConfig[] = [
  {
    title: 'Calligraffitti',
    categories: ['handwriting'],
    styles: [
      {
        fontId: 'Calligraffitti:regular',
        title: 'regular',
        thumbnail: '/images/fonts/calligraffitti:regular.png',
        url: '/fonts/calligraffitti-v11-latin-regular.ttf',
        glyphRanges: [
          [32, 126],
          [160, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8364, 8364],
          [8722, 8722],
        ],
      },
    ],
  },
  {
    title: 'Euphoria Script',
    categories: ['handwriting'],
    styles: [
      {
        fontId: 'Euphoria Script:regular',
        title: 'regular',
        thumbnail: '/images/fonts/euphoria-script:regular.png',
        url: '/fonts/euphoria-script-v8-latin-ext_latin-regular.ttf',
        glyphRanges: [
          [32, 126],
          [161, 174],
          [176, 255],
          [338, 339],
          [352, 353],
          [376, 376],
          [381, 382],
          [402, 402],
          [710, 710],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8224, 8224],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8364, 8364],
          [8482, 8482],
        ],
      },
    ],
  },
  {
    title: 'Kaushan Script',
    categories: ['handwriting'],
    styles: [
      {
        fontId: 'Kaushan Script:regular',
        title: 'regular',
        thumbnail: '/images/fonts/kaushan-script:regular.png',
        url: '/fonts/kaushan-script-v8-latin-ext_latin-regular.ttf',
        glyphRanges: [
          [13, 13],
          [32, 126],
          [160, 382],
          [399, 399],
          [402, 402],
          [490, 491],
          [506, 511],
          [536, 539],
          [567, 567],
          [601, 601],
          [700, 700],
          [710, 710],
          [730, 730],
          [732, 732],
          [7748, 7749],
          [7808, 7813],
          [7922, 7923],
          [7928, 7929],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8224, 8224],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8308, 8308],
          [8364, 8364],
          [8482, 8482],
          [8722, 8722],
          [8725, 8725],
        ],
      },
    ],
  },
  {
    title: 'Mountains of Christmas',
    categories: ['display'],
    styles: [
      {
        fontId: 'Mountains of Christmas:bold',
        title: 'bold',
        thumbnail: '/images/fonts/mountains-of christmas:bold.png',
        url: '/fonts/mountains-of-christmas-v12-latin-700.ttf',
        glyphRanges: [
          [32, 126],
          [160, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8364, 8364],
          [8722, 8722],
        ],
      },
    ],
  },
  {
    title: 'Akronim',
    categories: ['display'],
    styles: [
      {
        fontId: 'Akronim:regular',
        title: 'regular',
        thumbnail: '/images/fonts/akronim:regular.png',
        url: '/fonts/akronim-v9-latin-regular.ttf',
        glyphRanges: [
          [32, 126],
          [160, 161],
          [163, 165],
          [167, 169],
          [174, 174],
          [180, 180],
          [182, 184],
          [191, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8364, 8364],
          [8482, 8482],
        ],
      },
    ],
  },
  {
    title: 'Monoton',
    categories: ['display'],
    styles: [
      {
        fontId: 'Monoton:regular',
        title: 'regular',
        thumbnail: '/images/fonts/monoton:regular.png',
        url: '/fonts/monoton-v9-latin-regular.ttf',
        glyphRanges: [
          [13, 13],
          [32, 126],
          [160, 172],
          [174, 174],
          [176, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8308, 8308],
          [8364, 8364],
          [8482, 8482],
          [8722, 8722],
        ],
      },
    ],
  },
  {
    title: 'Permanent Marker',
    categories: ['handwriting'],
    styles: [
      {
        fontId: 'Permanent Marker:regular',
        title: 'regular',
        thumbnail: '/images/fonts/permanent-marker:regular.png',
        url: '/fonts/permanent-marker-v9-latin-regular.ttf',
        glyphRanges: [
          [32, 126],
          [160, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8364, 8364],
          [8722, 8722],
        ],
      },
    ],
  },
  {
    title: 'Fredoka One',
    categories: ['display'],
    styles: [
      {
        fontId: 'Fredoka One:regular',
        title: 'regular',
        thumbnail: '/images/fonts/fredoka-one:regular.png',
        url: '/fonts/fredoka-one-v7-latin-regular.ttf',
        glyphRanges: [
          [32, 126],
          [161, 172],
          [174, 174],
          [176, 255],
          [305, 305],
          [338, 339],
          [710, 710],
          [730, 730],
          [732, 732],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8226, 8226],
          [8230, 8230],
          [8249, 8250],
          [8260, 8260],
          [8364, 8364],
          [8482, 8482],
          [8722, 8722],
        ],
      },
    ],
  },
  {
    title: 'Pacifico',
    categories: ['handwriting'],
    styles: [
      {
        fontId: 'Pacifico:regular',
        title: 'regular',
        thumbnail: '/images/fonts/pacifico:regular.png',
        url: '/fonts/pacifico-v16-latin-ext_latin_cyrillic-ext-regular.ttf',
        glyphRanges: [
          [13, 13],
          [32, 126],
          [160, 305],
          [308, 382],
          [399, 399],
          [402, 402],
          [416, 417],
          [431, 432],
          [452, 460],
          [486, 487],
          [490, 491],
          [506, 539],
          [554, 557],
          [560, 563],
          [567, 567],
          [601, 601],
          [700, 700],
          [710, 711],
          [713, 713],
          [728, 733],
          [768, 772],
          [774, 780],
          [783, 783],
          [785, 786],
          [795, 795],
          [803, 804],
          [806, 808],
          [814, 814],
          [817, 817],
          [916, 916],
          [937, 937],
          [956, 956],
          [960, 960],
          [1024, 1119],
          [1122, 1123],
          [1130, 1131],
          [1138, 1141],
          [1162, 1189],
          [1192, 1279],
          [1296, 1299],
          [1306, 1309],
          [1316, 1321],
          [1326, 1327],
          [7808, 7813],
          [7838, 7838],
          [7840, 7929],
          [8211, 8212],
          [8216, 8218],
          [8220, 8222],
          [8224, 8226],
          [8230, 8230],
          [8240, 8240],
          [8249, 8250],
          [8260, 8260],
          [8308, 8308],
          [8353, 8353],
          [8355, 8356],
          [8358, 8359],
          [8361, 8361],
          [8363, 8366],
          [8369, 8370],
          [8372, 8373],
          [8376, 8378],
          [8380, 8381],
          [8470, 8470],
          [8482, 8482],
          [8706, 8706],
          [8719, 8719],
          [8721, 8722],
          [8725, 8725],
          [8729, 8730],
          [8734, 8734],
          [8747, 8747],
          [8776, 8776],
          [8800, 8800],
          [8804, 8805],
          [9674, 9674],
          [64257, 64258],
        ],
      },
    ],
  },
]
