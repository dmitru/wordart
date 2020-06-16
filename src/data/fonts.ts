export type FontId = string

export type FontStyleConfig = {
  fontId: FontId
  title: string
  url: string
  thumbnail: string
  fontStyle: string
  fontWeight: string
}

export type FontConfig = {
  title: string
  isCustom?: boolean
  popularity: number
  categories?: string[]
  styles: FontStyleConfig[]
  subsets: string[]
}

export let fonts: FontConfig[] = []

export const loadFontsConfig = async () => {
  const fontsData = await fetch('/fonts/config.json').then((res) => res.json())
  fonts.push(...fontsData)
}
