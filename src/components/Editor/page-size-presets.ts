export type SizeUnit = 'in' | 'px' | 'cm' | 'mm'

export type PageSizeSettings = {
  preset: PageSizePreset | null
  custom: PageSize
}

export const getAspect = (pageSizeSettings: PageSizeSettings): number => {
  if (pageSizeSettings.preset) {
    return pageSizeSettings.preset.width / pageSizeSettings.preset.height
  }
  return pageSizeSettings.custom.width / pageSizeSettings.custom.height
}

export type PageSize = {
  width: number
  height: number
  unit: SizeUnit
}

export type PageSizePreset = PageSize & {
  id: string
  title: string
  subtitle?: string
}

export const pageSizePresets: PageSizePreset[] = [
  {
    id: 'square',
    title: 'Square',
    // subtitle: 'Aspect: 1 x 1',
    height: 8192,
    width: 8192,
    unit: 'px',
  },
  {
    id: '10-8-portrait',
    subtitle: '8” x 10”',
    title: 'Frame print, portrait',
    height: 10,
    width: 8,
    unit: 'in',
  },
  {
    id: '8-10-landscape',
    subtitle: '8” x 10”',
    title: 'Frame print, landscape',
    height: 8,
    width: 10,
    unit: 'in',
  },
  {
    id: '11-17',
    subtitle: '11” x 17”',
    title: 'Small poster (A3), portrait',
    height: 17,
    width: 11,
    unit: 'in',
  },
  {
    id: '17-11',
    subtitle: '17” x 11”',
    title: 'Small poster (A3), landscape',
    height: 11,
    width: 17,
    unit: 'in',
  },
  {
    id: '18-24-portrait',
    subtitle: '18” x 24”',
    title: 'Medium poster (B2), portrait',
    height: 24,
    width: 18,
    unit: 'in',
  },
  {
    id: '24-18-landscape',
    subtitle: '18” x 24”',
    title: 'Medium poster (B2), landscape',
    height: 18,
    width: 24,
    unit: 'in',
  },
  {
    id: '36-24-landscape',
    subtitle: '24” x 36”',
    title: 'Large poster (B1), portrait',
    height: 36,
    width: 24,
    unit: 'in',
  },
  {
    id: '24-36',
    subtitle: '36” x 24”',
    title: 'Large poster (B1), landscape',
    height: 24,
    width: 36,
    unit: 'in',
  },
  {
    id: 'a-paper-landscape',
    title: 'A4 Paper, landscape',
    subtitle: '11” x 8.5”',
    width: 210,
    height: 297,
    unit: 'mm',
  },
  {
    id: 'a-paper-portrait',
    title: 'A4 Paper, portrait',
    subtitle: '8.5” x 11”',
    width: 297,
    height: 210,
    unit: 'mm',
  },
]

export const defaultPageSizePreset = pageSizePresets[1]
