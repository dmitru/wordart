import { UpgradeModalVariant } from 'components/upgrade/UpgradeModal'
import { PricingPlan } from 'plans'
import { ShapeKind } from 'components/Editor/shape-config'

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

type DownloadFormat = 'sd-png' | 'sd-jpeg' | 'hd-png' | 'hd-jpeg' | 'hd-svg'

export const StructuredEvents = {
  // Editor
  // Open new editor
  mkNewEditorSession: (): StructuredEvent => ({
    category: 'editor',
    action: 'open new design',
  }),
  mkSavedEditorSession: (): StructuredEvent => ({
    category: 'editor',
    action: 'open saved design',
  }),
  mkTemplateEditorSession: (templateId: string): StructuredEvent => ({
    category: 'editor',
    action: 'open new from template',
    label: templateId,
  }),
  mkOrderPrintsClick: (): StructuredEvent => ({
    category: 'editor',
    action: 'order prints click',
  }),
  mkSaveByShapeType: (shapeKind: ShapeKind): StructuredEvent => ({
    category: 'editor',
    action: 'save (shape type)',
    label: shapeKind,
  }),
  mkDownloadByFormat: (format: DownloadFormat): StructuredEvent => ({
    category: 'editor',
    action: 'download (format)',
    label: format,
  }),
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
