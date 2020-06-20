export type DownloadsPricingPlan = {
  id: number
  title: string
  kind: 'downloads-pack'
  downloads: number
}

export type PricingPlan = DownloadsPricingPlan

export const plans: PricingPlan[] = [
  {
    kind: 'downloads-pack',
    id: 597590,
    title: '1 HD Download',
    downloads: 1,
  },
]

export type PricingPlanWithPrice = PricingPlan & { price?: LocalizedPrice }
export type LocalizedPrice = {
  originalPrice: { gross: number; net: number; tax: number }
  price: { gross: number; net: number; tax: number }
  currency: Currency
}

export type Currency = string
