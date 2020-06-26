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

const popularFonts: string[] = ['Lobster', 'Roboto']

export const loadFontsConfig = async () => {
  const fontsData = await fetch('/fonts/config.json').then((res) => res.json())
  fonts.push(...fontsData)
  for (const font of fonts) {
    if (popularFonts.includes(font.title)) {
      font.isPopular = true
    }
  }
}
