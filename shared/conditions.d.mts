export interface Condition {
  rate: string
  stateRates?: Record<string, string>
  requiresBillingState?: boolean
  pendingReason?: string | null
  configurationRates?: Record<string,string | null>
  requiresConfiguration?: boolean
}
export const billingStates: string[]
export function resolveCondition(discount: Condition | null, billingState?: string, factoryCode?: string): string | null
export function calculatePrice(price: string, rate: string): { discountAmount: string; corporatePrice: string }
