import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
const fixture=JSON.parse(readFileSync('data/generated/api-fixtures.json','utf8'))
test.beforeEach(async({page})=>{
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname
  const data=path==='/api/vehicles'?fixture.summaries:path==='/api/catalog/meta'?{whatsappNumber:'5511989266321'}:fixture.details.find((m:{slug:string})=>path===`/api/vehicles/${m.slug}`)
  return route.fulfill({status:data?200:404,json:data||{}})
 })
})
test('layout, menu e cores cabem na tela',async({page})=>{
 const width=page.viewportSize()!.width
 for(const path of ['/','/inicio','/veiculos','/veiculos/s10']){
  await page.goto(path)
  await expect(page.getByRole('heading',{level:1})).toBeVisible()
  await page.evaluate(()=>document.fonts.ready)
  if(path==='/veiculos')await expect(page.getByRole('article')).toHaveCount(9)
  if(path==='/veiculos/s10'){
   await expect(page.getByRole('combobox',{name:'Versão',exact:true})).toBeVisible()
   const version=fixture.details.find((m:{slug:string})=>m.slug==='s10').versions.find((v:{slug:string})=>v.slug==='r7f')
   await page.getByRole('combobox',{name:'Versão',exact:true}).selectOption(version.id)
   await page.getByRole('radio',{name:'Cinza Âmbar',exact:true}).check()
   await expect(page.getByAltText('Chevrolet S10, WT MT, Cinza Âmbar')).toBeVisible()
   if(width<=700)expect(await page.locator('fieldset > div').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
   const cta=page.getByRole('link',{name:'Solicitar proposta'})
   await expect(cta).toBeVisible()
   const box=await cta.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width)
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true)
  await page.locator('img').evaluateAll(images=>images.forEach(img=>img.loading='eager'))
  await expect.poll(()=>page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true)
  await page.screenshot({path:`data/reports/mobile-${width}-${path.replaceAll('/','_')}.png`,fullPage:true})
 }
 if(width<=900){
  await page.getByRole('button',{name:'Abrir menu'}).click()
  await expect(page.getByRole('navigation',{name:'Principal'})).toBeVisible()
  await page.getByRole('navigation',{name:'Principal'}).getByRole('link',{name:'Veículos',exact:true}).click()
  await expect(page.getByRole('button',{name:'Abrir menu'})).toBeVisible()
 }
})
