import Decimal from 'decimal.js'

export const billingStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

// A UF condition replaces the national condition. Commission never enters pricing.
export function resolveCondition(discount, billingState, factoryCode) {
  if (!discount) return null
  if (discount.pendingReason) return null
  if (discount.requiresConfiguration) return discount.configurationRates?.[factoryCode] ?? null
  if (discount.requiresBillingState && !billingStates.includes(billingState)) return null
  return discount.stateRates?.[billingState] ?? discount.rate
}

export function calculatePrice(price, rate) {
  const base = new Decimal(price)
  const final = base.mul(new Decimal(1).sub(rate)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  return { discountAmount: base.sub(final).toFixed(2), corporatePrice: final.toFixed(2) }
}
