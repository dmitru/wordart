import { ShapeIconConf } from 'components/Editor/shape-config'

type IconConfig = {
  type: string
  title: string
  name: string
  url: string
  keywords: string[]
  categories: string[]
}

export let icons: ShapeIconConf[] = []

export const loadIconsConfig = async () => {
  const [iconsFaSolid, iconsFaRegular, iconsFaBrands] = await Promise.all([
    fetch('/icons/icons-fa-solid.json').then((res) => res.json()),
    fetch('/icons/icons-fa-regular.json').then((res) => res.json()),
    fetch('/icons/icons-fa-brands.json').then((res) => res.json()),
  ])

  const iconConfigs: IconConfig[] = [
    ...iconsFaSolid,
    ...iconsFaRegular,
    ...iconsFaBrands,
  ]

  icons = iconConfigs
    .filter((i) => i != null)
    .map((icon) =>
      icon
        ? ({
            id: `fa-${icon.type}-${icon.name}`,
            kind: 'icon',
            title: icon.title,
            url: icon.url,
            color: '#4A90E2',
            processedThumbnailUrl: icon.url,
            thumbnailUrl: icon.url,
            keywords: icon.keywords,
            categories: icon.categories,
          } as ShapeIconConf)
        : null
    )
    .filter((x) => x != null) as ShapeIconConf[]
}
