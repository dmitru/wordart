import { groupBy, sortBy } from 'lodash'

export type FontId = string

export type FontStyleConfig = {
  fontId: FontId
  isCustom?: boolean
  title: string
  url: string
  thumbnail: string
  fontStyle: string
  fontWeight: string
}

export type FontConfig = {
  isPopular?: boolean
  title: string
  isCustom?: boolean
  popularity: number
  categories?: string[]
  styles: FontStyleConfig[]
  subsets: string[]
}

export let fonts: FontConfig[] = []
export let popularFonts: FontConfig[] = []

const getPopularFonts = (fonts: FontConfig[]): FontConfig[] => {
  const result: FontConfig[] = []
  const fontsByCategory = groupBy(fonts, (f) => (f.categories || [])[0])

  const categoriesSorted = [
    ['handwriting', 15],
    ['display', 20],
    ['monospace', 5],
    ['serif', 10],
    ['sans-serif', 10],
  ] as [string, number][]

  for (const [category, count] of categoriesSorted) {
    const fontsInCategory = fontsByCategory[category] || []
    const fontsInCategorySorted = sortBy(fontsInCategory, 'popularity')
    if (fontsInCategorySorted.length > 0) {
      result.push(...fontsInCategorySorted.slice(0, count))
    }
  }
  return result
}

export const loadFontsConfig = async () => {
  const fontsData = await fetch('/fonts/config.json').then((res) => res.json())
  fonts.push(...fontsData)
  popularFonts = getPopularFonts(fonts)
  for (const font of popularFonts) {
    font.isPopular = true
  }
}
