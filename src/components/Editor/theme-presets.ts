import { ThemePreset } from 'components/Editor/style'
import chroma from 'chroma-js'

type ThemePresetConfig = {
  bgColor: string
  shapeColor: string
  shapeOpacity?: number
  colors: string[]
}
const themePresetConfigs: ThemePresetConfig[] = Object.values({
  t12: {
    bgColor: '#fff',
    shapeColor: 'rgb(0,0,0)',
    shapeOpacity: 0.03,
    colors: ['#333'],
  },
  // From https://vizzlo.com/
  t100: {
    bgColor: '#fff',
    shapeColor: '#FFB99F',
    shapeOpacity: 0.1,
    colors: ['#FBC74D', '#FBAC49', '#F46E3B', '#EF2E2C', '#9E1A1C', '#720F12'],
  },
  t100a: {
    bgColor: '#fff',
    shapeColor: '#83D07F',
    shapeOpacity: 0.1,
    colors: ['#87D048', '#1A9E30', '#0F7228', '#74B52B'],
  },
  t100b: {
    bgColor: '#fff',
    shapeColor: '#C67FD0',
    shapeOpacity: 0.1,
    colors: ['#D4396B', '#BC50C8', '#721A9E', '#710F72'],
  },
  t101: {
    bgColor: '#fff',
    shapeColor: '#7FAADC',
    shapeOpacity: 0.1,
    colors: ['#00355e', '#095885', '#2c7eb0', '#579bce', '#76b6ea'],
  },
  t1: {
    bgColor: '#fff',
    shapeColor: '#fff',
    shapeOpacity: 0.1,
    colors: ['#438D9C', '#E8A664', '#9C6043', '#171717', '#c00'],
  },
  t105: {
    bgColor: '#fff',
    shapeColor: '#A8A8A8',
    shapeOpacity: 0.1,
    colors: ['#ef543b', '#70a5ab', '#c7b181', '#8b7670'],
  },
  t102: {
    bgColor: '#fff',
    shapeColor: '#A8A8A8',
    shapeOpacity: 0.1,
    colors: ['#2C3B59', '#CB9879', '#7F4708', '#53698B'],
  },
  t103: {
    bgColor: '#fff',
    shapeColor: '#A8A8A8',
    shapeOpacity: 0.1,
    colors: ['#72B275', '#B56FAB', '#FFB411', '#F79420', '#558AB5', '#C64242'],
  },
  t11: {
    bgColor: '#999',
    shapeColor: 'rgb(0,0,0)',
    shapeOpacity: 0.1,
    colors: ['#dadada'],
  },
  t104: {
    bgColor: '#F2EED1',
    shapeColor: '#A8A8A8',
    shapeOpacity: 0.1,
    colors: ['#EEA74F', '#BF423E', '#187E8A', '#EE6D58', '#2CABAF', '#5B4659'],
  },
  // t6: {
  //   bgColor: '#fff',
  //   shapeColor: 'rgb(3,49,140)',
  //   shapeOpacity: 0.15,
  //   colors: ['#03318c', '#021f59', '#61a2ca', '#30588c', '#32628c'],
  // },
  td: {
    bgColor: '#71C9CE',
    shapeColor: '#205D61',
    shapeOpacity: 0.1,
    colors: '#EEFEFE #CBF1F5 #E3FDFD'.split(' '),
  },
  tc: {
    bgColor: '#FBDCC4',
    shapeColor: '#F2A07B',
    shapeOpacity: 0.1,
    colors: '#5F1D55 #931C4B #D16838'.split(' '),
  },
  t3: {
    bgColor: '#432F44',
    shapeColor: '#ffffff',
    shapeOpacity: 0.05,
    colors: '#FFD460 #F06769 #E46386'.split(' '),
  },
  ta: {
    bgColor: '#515070',
    shapeColor: 'rgb(255,255,255)',
    shapeOpacity: 0.05,
    colors: '#F6F6F6 #FFBB91 #FF8E6E'.split(' '),
  },
  tb: {
    bgColor: '#381460',
    shapeColor: 'rgb(255,255,255)',
    shapeOpacity: 0.05,
    colors: '#FFBD69 #FC4F81 #F96DB0'.split(' '),
  },
  tf: {
    bgColor: '#0C056D',
    shapeColor: '#590D82',
    shapeOpacity: 0.2,
    colors: '#F25D9C #CD4FC6 #BD7CE3'.split(' '),
  },
  t16: {
    bgColor: '#341c01',
    shapeColor: 'rgb(193,118,46)',
    shapeOpacity: 0.2,
    colors: '#fffff0 #d0aa3a #cea92e #c1762e #aea764 #d59733 #e9e3cd'.split(
      ' '
    ),
  },
  t17: {
    bgColor: '#262626',
    shapeColor: 'rgb(4,117,111)',
    shapeOpacity: 0.2,
    colors: ['#3498db', '#d90000', '#ff2d00', '#ff8c00', '#04756f'],
  },
  t10: {
    bgColor: '#223564',
    shapeColor: 'rgb(0,0,0)',
    shapeOpacity: 0.1,
    colors: ['#f7e4be', '#f0f4bc', '#9a80a4', '#848da6'],
  },
  t106: {
    bgColor: '#262626',
    shapeColor: '#777777',
    shapeOpacity: 0.1,
    colors: ['#739DE6', '#D84D4D', '#CC70CD', '#61B17D', '#E5875C'],
  },
  t21: {
    bgColor: '#262626',
    shapeColor: 'rgb(142,40,0)',
    shapeOpacity: 0.2,
    colors: ['#468966', '#fff0a5', '#ffb03b', '#b64926', '#8e2800'],
  },

  t23: {
    bgColor: '#473b51',
    shapeColor: 'rgb(0,0,0)',
    shapeOpacity: 0.2,
    colors: ['#f7ff4a', '#e3013a', '#f28e2c', '#57adf5'],
  },
  t107: {
    bgColor: '#262626',
    shapeColor: '#777777',
    shapeOpacity: 0.1,
    colors: ['#72B275', '#B56FAB', '#FFDE17', '#F79420', '#558AB5', '#C64242'],
  },
  // end
  t2: {
    bgColor: '#000',
    shapeColor: '#f00',
    shapeOpacity: 0.1,
    colors: '#fff #e55b3f #efba43 #f6ba78 #ea8032 #c6312d #f28791'.split(' '),
  },
  t4: {
    bgColor: '#272822',
    shapeColor: '#000',
    shapeOpacity: 0.15,
    colors: '#66d9ef #a6e22d #fd9720 #a6e22a #a581ff #f92772'.split(' '),
  },
  t5: {
    bgColor: '#353130',
    shapeColor: 'rgb(0,0,128)',
    shapeOpacity: 0.15,
    colors: ['#d6d6d6'],
  },
  t13: {
    bgColor: '#000',
    shapeColor: 'rgb(213,167,83)',
    shapeOpacity: 0.15,
    colors: '#b95c28 #638db2 #f0f0f0 #dbcc58 #1b3c69 #d5a753'.split(' '),
  },
  t14: {
    bgColor: '#000',
    shapeColor: 'rgb(126,66,166)',
    shapeOpacity: 0.2,
    colors: '#ce3440 #7e42a6 #bc0a13 #4362a7 #fff #4ba894 #ca8f57 #bed843'.split(
      ' '
    ),
  },

  t18: {
    bgColor: '#091c2b',
    shapeColor: 'rgb(0,0,0)',
    shapeOpacity: 0.2,
    colors: ['#edecf2', '#c1d4f2', '#6d98ba', '#3669a2', '#8793dd'],
  },

  t7: {
    bgColor: '#222',
    shapeColor: 'rgb(255,0,0)',
    shapeOpacity: 0.15,
    colors: ['#ff530d', '#e82c0c', '#f00', '#e80c7a', '#ff0dff'],
  },
  // t8: {
  //   bgColor: '#edd1a4',
  //   shapeColor: 'rgb(99,62,0)',
  //   shapeOpacity: 0.2,
  //   colors: '#c30000 #c37a00 #650281 #de3333 #de5c5c #7e602c #633e00 #481e53'.split(
  //     ' '
  //   ),
  // },
  t9: {
    bgColor: '#8d8380',
    shapeColor: 'rgb(255,255,255)',
    shapeOpacity: 0.4,
    colors: ['#3a3f42', '#575d51', '#42361d'],
  },
  // t19: {
  //   bgColor: '#fff',
  //   shapeColor: 'rgb(76,14,39)',
  //   shapeOpacity: 0.1,
  //   colors: '#54bfa5 #222 #d6125c #38b3f6 #e9c028 #545006 #3da4de #4c0e27'.split(
  //     ' '
  //   ),
  // },
  // t22: {
  //   bgColor: '#fff',
  //   shapeColor: 'rgb(101,29,50)',
  //   shapeOpacity: 0.1,
  //   colors: ['#509e2f', '#41b6e6', '#abad23', '#005f61', '#651d32'],
  // },
  // t15: {
  //   bgColor: '#fff',
  //   shapeColor: 'rgb(0,0,0)',
  //   shapeOpacity: 0.1,
  //   colors: ['#e23940', '#003777'],
  // },
  // t20: {
  //   bgColor: '#fff',
  //   shapeColor: 'rgb(0,0,0)',
  //   shapeOpacity: 0.1,
  //   colors: ['#9000a8', '#9d4040', '#60a831', '#314ed4', '#31a5d4'],
  // },
})

const createPreset = (conf: ThemePresetConfig, title: string): ThemePreset => {
  let bgItemsColor = chroma(conf.bgColor)

  if (bgItemsColor.luminance() > 0.5) {
    bgItemsColor = bgItemsColor.darken(0.5).saturate(0.2)
  } else {
    bgItemsColor = bgItemsColor.brighten(0.5).desaturate(0.2)
  }

  const bgItemsColorHex = bgItemsColor.hex()
  return {
    title,
    bgDimSmallerItems: 20,
    shapeDimSmallerItems: 20,
    shapeOpacity: (conf.shapeOpacity || 0.2) * 100,
    itemsOpacity: 100,
    bgFill: conf.bgColor,
    shapeFill: conf.shapeColor,
    bgItemsColoring: {
      kind: 'color',
      colors: [bgItemsColorHex],
    },
    shapeItemsColoring: {
      kind: 'color',
      colors: conf.colors,
    },
  }
}

export const themePresets: ThemePreset[] = [
  ...themePresetConfigs.map((c, index) => createPreset(c, `Theme ${index}`)),
]
