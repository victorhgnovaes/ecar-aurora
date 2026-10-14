import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calculatePrice, resolveCondition, billingStates } from '#conditions'

const source = JSON.parse(readFileSync('data/conditions/chevrolet-aurora-2026-10.json','utf8')) as {rows:[string,number,string,string,string][];stateRates:Record<string,string>}
test('61 condições das 12 famílias: código + MY diferencia percentuais',()=>{
 assert.equal(source.rows.length,61)
 assert.equal(new Set(source.rows.map(row=>row[0])).size,12)
 const rate=(code:string,my:number)=>source.rows.find(row=>row[3]===code&&row[1]===my)![4]
 assert.equal(rate('156PKR6A',2026),'15.0');assert.equal(rate('156PKR6A',2027),'10.0')
 assert.equal(rate('5B752R6N',2026),'19.0');assert.equal(rate('5B752R6N',2027),'14.0')
 assert.equal(rate('5B76DR8D',2026),'18.0');assert.equal(rate('5B76DR8D',2027),'17.0')
 assert.equal(rate('3KCRJPEA',2024),'37.5');assert.equal(rate('3KCRJPEA',2025),'30.0')
 assert.equal(rate('1A48HA2A',2027),'1.9');assert.equal(rate('1A69HA4A',2027),'2.2')
})
test('Spark: UF obrigatória; exceções substituem condições PEA e PEB, sem acumular',()=>{
 for(const rate of ['0.148000','0.146000']){
  const condition={rate,stateRates:source.stateRates,requiresBillingState:true}
  assert.equal(resolveCondition(condition),null);assert.equal(resolveCondition(condition,'XX'),null)
  for(const uf of billingStates){
   const expected=['MA','AC'].includes(uf)?'0.098000':['DF','SE','RO','AP','PB'].includes(uf)?'0.113000':rate
   assert.equal(resolveCondition(condition,uf),expected)
  }
  assert.equal(calculatePrice('154990',resolveCondition(condition,'MA')!).corporatePrice,'139800.98')
  assert.equal(calculatePrice('154990',resolveCondition(condition,'DF')!).corporatePrice,'137476.13')
 }
})
test('cálculo arredonda preço final HALF_UP, usa somente Condição e não desconta duas vezes',()=>{
 assert.deepEqual(calculatePrice('100000','0.21'),{corporatePrice:'79000.00',discountAmount:'21000.00'})
 assert.deepEqual(calculatePrice('0.05','0.1'),{corporatePrice:'0.05',discountAmount:'0.00'})
 assert.equal(calculatePrice('100000','0.019').corporatePrice,'98100.00')
 assert.equal(calculatePrice('102890','0.21').corporatePrice,'81283.10')
 assert.equal(resolveCondition({rate:'0.1',pendingReason:'MY divergente'},'SP'),null)
 assert.equal(resolveCondition(null),null)
 const configured={rate:'0.1',requiresConfiguration:true,configurationRates:{'1AAE4PEA':'0.1','5AAE4PEA':null}}
 assert.equal(resolveCondition(configured),null);assert.equal(resolveCondition(configured,undefined,'1AAE4PEA'),'0.1');assert.equal(resolveCondition(configured,undefined,'5AAE4PEA'),null)
})
