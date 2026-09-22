import 'reflect-metadata'
import 'dotenv/config'
import { Controller, Get, Module, Param, ParseUUIDPipe, Query, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { CatalogService } from './catalog.service.js'
import { CatalogQuery, SlugParam } from './catalog.dto.js'
import { prisma } from './db.js'
@Controller('api')
class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('vehicles') vehicles(@Query() query: CatalogQuery) { return this.catalog.vehicles(query) }
  @Get('vehicles/:slug') model(@Param() params: SlugParam) { return this.catalog.model(params.slug) }
  @Get('vehicles/:slug/versions') async versions(@Param() params: SlugParam) { return (await this.catalog.model(params.slug)).versions }
  @Get('versions/:id') version(@Param('id', new ParseUUIDPipe()) id: string) { return this.catalog.version(id) }
  @Get('versions/:id/colors') async colors(@Param('id', new ParseUUIDPipe()) id: string) { return (await this.catalog.version(id)).colors }
  @Get('versions/:id/specifications') async specifications(@Param('id', new ParseUUIDPipe()) id: string) { const v = await this.catalog.version(id); return { technical: v.technical, rawContent: v.rawContent, features: v.features, source: v.source } }
  @Get('catalog/meta') meta() { return this.catalog.meta() }
}
@Module({ controllers: [CatalogController], providers: [CatalogService] })
class AppModule {}
const app = await NestFactory.create(AppModule, { logger: ['error','warn','log'] })
if (process.env.TRUST_PROXY === '1') app.getHttpAdapter().getInstance().set('trust proxy', 1)
app.use(helmet())
app.use(rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }))
const origins = (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').split(',').map(s => s.trim())
app.enableCors({ origin: origins, methods: ['GET'], credentials: false })
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
app.enableShutdownHooks()
await prisma.$connect()
await app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1')
