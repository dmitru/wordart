export type DownloadsPricingPlan = {
  id: number
  title: string
  kind: 'downloads-pack'
  downloads: number
}

export type UnlimitedPricingPlan = {
  id: number
  title: string
  kind: 'unlimited'
  periodCount: number
  periodUnits: string
}

export type PricingPlan = DownloadsPricingPlan | UnlimitedPricingPlan

export const unlimitedPricingPlans: UnlimitedPricingPlan[] = [
  {
    kind: 'unlimited',
    id: 600684,
    title: '1 Week',
    periodCount: 1,
    periodUnits: 'Week',
  },
  {
    kind: 'unlimited',
    id: 600685,
    title: '1 Month',
    periodCount: 1,
    periodUnits: 'Month',
  },
  {
    kind: 'unlimited',
    id: 600686,
    title: '3 Months',
    periodCount: 3,
    periodUnits: 'Month2',
  },
  {
    kind: 'unlimited',
    id: 600687,
    title: '1 Year',
    periodCount: 1,
    periodUnits: 'Year',
  },
]

export const downloadsPricingPlans: DownloadsPricingPlan[] = [
  {
    kind: 'downloads-pack',
    id: 597590,
    title: '1 HD Download',
    downloads: 1,
  },
  {
    kind: 'downloads-pack',
    id: 600538,
    title: '5 HD Downloads',
    downloads: 1,
  },
  {
    kind: 'downloads-pack',
    id: 600681,
    title: '10 HD Downloads',
    downloads: 1,
  },
  {
    kind: 'downloads-pack',
    id: 600682,
    title: '25 HD Downloads',
    downloads: 1,
  },
  {
    kind: 'downloads-pack',
    id: 600683,
    title: '100 HD Downloads',
    downloads: 1,
  },
]

export const plans: PricingPlan[] = [
  ...downloadsPricingPlans,
  ...unlimitedPricingPlans,
]

export type LocalizedPrice = {
  originalPrice: { gross: number; net: number; tax: number }
  price: { gross: number; net: number; tax: number }
  currency: Currency
}

export type Currency = string
