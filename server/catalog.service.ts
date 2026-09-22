import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { prisma } from './db.js'
import type { CatalogQuery } from './catalog.dto.js'
const include = { versions: { where: { active: true }, orderBy: { sortOrder: 'asc' as const }, include: { colors: { where: { available: true }, include: { color: true } }, configurations: true, sourceDocument: true, discount: true } }, images: true } satisfies Prisma.VehicleModelInclude
type Model = Prisma.VehicleModelGetPayload<{ include: typeof include }>
function serialize(model: Model) {
  const fallback = model.images.find(i => i.status === 'READY' && !i.paintColorId)?.localPath || '/assets/vehicles/unavailable.svg'
  const versions = model.versions.map(v => ({
    id: v.id, slug: v.slug, name: v.displayName, modelCode: v.modelCode, configurationCode: v.configurationCode, optionalCode: v.optionalCode,
    publicPriceNational: v.publicPriceNational.toFixed(2), publicPriceZfm: v.publicPriceZfm?.toFixed(2) ?? null,
    features: v.rawContent.split(/\s*[/;]\s*/).filter(Boolean), rawContent: v.rawContent,
    technical: { Motorização: v.engine, Transmissão: v.transmission, Combustível: v.fuel, Lugares: v.seatCount?.toString() ?? null },
    source: { fileName: v.sourceDocument.fileName, sha256: v.sourceDocument.sha256, page: v.sourcePage, listNumber: v.listNumber, effectiveDate: v.effectiveDate.toISOString().slice(0,10) },
    observations: v.observations, configurations: v.configurations.map(c => ({ modelCode: c.modelCode, optionalCode: c.optionalCode, configurationCode: c.configurationCode })),
    discount: v.discount?.active ? { rate: v.discount.rate.toFixed(6), sourceFileName: v.discount.sourceFileName, sourceSheet: v.discount.sourceSheet, sourceCell: v.discount.sourceCell, sourceTitle: v.discount.sourceTitle, sourceSha256: v.discount.sourceSha256 } : null,
    colors: v.colors.map(a => {
      const image = model.images.find(i => i.status === 'READY' && i.paintColorId === a.paintColorId && i.vehicleVersionId === v.id)
      const versionReference = model.images.find(i => i.status === 'READY' && i.vehicleVersionId === v.id && !i.paintColorId)?.localPath
      const configuredPrice = v.publicPriceNational.add(a.additionalPriceNational)
      const discountAmount = v.discount?.active ? configuredPrice.mul(v.discount.rate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) : null
      return { id: a.color.id, slug: a.color.slug, name: a.color.name, hex: a.color.hexApproximation || '#a2a5ab', paintType: a.color.paintType,
        additional: a.additionalPriceNational.toFixed(2), additionalZfm: a.additionalPriceZfm?.toFixed(2) ?? null,
        finalPrice: v.publicPriceNational.add(a.additionalPriceNational).toFixed(2), allowedOptionalCodes: a.allowedOptionalCodes,
        discountAmount: discountAmount?.toFixed(2) ?? null, corporatePrice: discountAmount ? configuredPrice.sub(discountAmount).toFixed(2) : null,
        image: image?.localPath || versionReference || fallback, imageStatus: image ? 'READY' : 'MISSING' }
    }),
  }))
  const offers = versions.flatMap(v => v.discount ? v.colors.filter(c => c.corporatePrice !== null).map(c => ({ versionName: v.name, versionId: v.id, colorName: c.name, publicPrice: c.finalPrice, discountRate: v.discount!.rate, discountAmount: c.discountAmount!, corporatePrice: c.corporatePrice! })) : [])
  const offer = offers.length ? offers.reduce((best, current) => new Prisma.Decimal(current.corporatePrice).lt(best.corporatePrice) ? current : best) : null
  return { id: model.id, slug: model.slug, name: model.displayName, modelYear: model.modelYear, category: model.category, order: model.sortOrder, offer,
    featured: ['onix','tracker','montana','spin'].includes(model.slug), image: fallback,
    minPrice: versions.length ? versions.reduce((min,v) => new Prisma.Decimal(v.publicPriceNational).lt(min) ? v.publicPriceNational : min,versions[0].publicPriceNational) : null,
    versionCount: versions.length, versions }
}
@Injectable()
export class CatalogService {
  async vehicles(query: CatalogQuery) {
    if (query.minPrice && query.maxPrice && new Prisma.Decimal(query.minPrice).gt(query.maxPrice)) throw new BadRequestException('Faixa de preço inválida')
    const versionWhere: Prisma.VehicleVersionWhereInput = { active: true, ...(query.transmission ? { OR: [{ transmission: { startsWith: `Transmissão ${query.transmission}`, mode: 'insensitive' } }, { transmission: { startsWith: `Câmbio ${query.transmission === 'manual' ? 'manual' : 'automático'}`, mode: 'insensitive' } }] } : {}), ...(query.fuel ? { fuel: { contains: query.fuel, mode: 'insensitive' } } : {}), ...((query.minPrice || query.maxPrice) ? { publicPriceNational: { gte: query.minPrice, lte: query.maxPrice } } : {}) }
    const models = await prisma.vehicleModel.findMany({ where: { active: true, category: query.category, slug: query.family, modelYear: query.year, ...(query.search ? { displayName: { contains: query.search, mode: 'insensitive' } } : {}), versions: { some: versionWhere } }, include: { ...include, versions: { ...include.versions, where: versionWhere } }, orderBy: { sortOrder: 'asc' } })
    return models.map(model => { const { versions: _versions, ...summary } = serialize(model); return summary })
  }
  async model(slug: string) {
    const model = await prisma.vehicleModel.findFirst({ where: { slug, active: true }, include })
    if (!model) throw new NotFoundException('Veículo não encontrado')
    return serialize(model)
  }
  async version(id: string) {
    const version = await prisma.vehicleVersion.findFirst({ where: { id, active: true, model: { active: true } }, select: { model: { select: { slug: true } } } })
    if (!version) throw new NotFoundException('Versão não encontrada')
    return (await this.model(version.model.slug)).versions.find(v => v.id === id)!
  }
  async meta() {
    const [models, versions, latest] = await Promise.all([prisma.vehicleModel.count({ where: { active: true } }),prisma.vehicleVersion.count({ where: { active: true } }),prisma.importRun.findFirst({ where: { status: 'SUCCESS' }, orderBy: { finishedAt: 'desc' } })])
    return { models, versions, importedAt: latest?.finishedAt ?? null, sourceSha256: latest?.sourceSha256 ?? null, region: 'NATIONAL', whatsappNumber: /^55\d{10,11}$/.test(process.env.WHATSAPP_NUMBER || '') ? process.env.WHATSAPP_NUMBER : null }
  }
}
