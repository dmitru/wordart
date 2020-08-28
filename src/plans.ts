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
    id: 618592,
    title: '1 Day',
    periodCount: 1,
    periodUnits: 'day',
  },
  {
    kind: 'unlimited',
    id: 600684,
    title: '1 Week',
    periodCount: 1,
    periodUnits: 'week',
  },
  {
    kind: 'unlimited',
    id: 600685,
    title: '1 Month',
    periodCount: 1,
    periodUnits: 'month',
  },
  {
    kind: 'unlimited',
    id: 600686,
    title: '3 Months',
    periodCount: 3,
    periodUnits: 'month',
  },
  {
    kind: 'unlimited',
    id: 600687,
    title: '12 Months',
    periodCount: 1,
    periodUnits: 'year',
  },
]

export const downloadsPricingPlans: DownloadsPricingPlan[] = [
  {
    kind: 'downloads-pack',
    id: 597590,
    title: '3 HQ Downloads',
    downloads: 3,
  },
  {
    kind: 'downloads-pack',
    id: 600538,
    title: '5 HQ Downloads',
    downloads: 5,
  },
  {
    kind: 'downloads-pack',
    id: 600681,
    title: '10 HQ Downloads',
    downloads: 10,
  },
  {
    kind: 'downloads-pack',
    id: 600682,
    title: '25 HQ Downloads',
    downloads: 25,
  },
  {
    kind: 'downloads-pack',
    id: 600683,
    title: '100 HQ Downloads',
    downloads: 100,
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
