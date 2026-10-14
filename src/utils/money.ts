import Decimal from 'decimal.js'
export function finalPrice(base: string, additional: string) { return new Decimal(base).plus(additional).toFixed(2) }
export { calculatePrice as discountedPrice } from '#conditions'
export function formatPercent(rate: string) { return `${new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(new Decimal(rate).mul(100).toNumber())}%` }
export function formatMoney(value: string | null) { return value === null ? 'Consulte a Ecar' : new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL' }).format(new Decimal(value).toNumber()) }
