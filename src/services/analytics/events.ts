import { UpgradeModalVariant } from 'components/upgrade/UpgradeModal'
import { PricingPlan } from 'plans'

export type StructuredEvent = {
  category: string
  action?: string
  label?: string
  property?: string
  value?: number
}

export const mkStructuredEvent = (
  category: string,
  action?: string,
  label?: string,
  property?: string,
  value?: number
): StructuredEvent => ({
  category,
  action,
  label,
  property,
  value,
})

export const CustomDimensionsIndices = {}

export const CustomMetricIndices = {
  screenWidth: 1,
  screenHeight: 2,
}

export const StructuredEvents = {
  //
  // Upgrade flow
  mkShowUpgradeWindow: (
    contentVariant: UpgradeModalVariant
  ): StructuredEvent => ({
    category: 'orders',
    action: 'show upgrade modal (content variant)',
    label: contentVariant,
  }),
  //
  // Show payment modal
  mkShowPaymentModal: (plan: PricingPlan): StructuredEvent => ({
    category: 'orders',
    action: 'show payment modal (plan)',
    label: `${plan.title} ${plan.id}`,
  }),
  mkShowPaymentModalContentVariant: (
    contentVariant: UpgradeModalVariant
  ): StructuredEvent => ({
    category: 'orders',
    action: 'show payment modal (content variant)',
    label: contentVariant,
  }),
  mkPayForProUpgradePaypal: (plan: PricingPlan): StructuredEvent => ({
    category: 'orders',
    action: 'payment (plan)',
    label: `${plan.title} ${plan.id}`,
  }),
  // Errors
  mkWasmModuleLoadError: (): StructuredEvent => ({
    category: 'wasm-errors',
  }),
}
