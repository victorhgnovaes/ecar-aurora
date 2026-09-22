import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure'},
 projects:[{name:'1440x900',use:{viewport:{width:1440,height:900}}},{name:'1280x800',use:{viewport:{width:1280,height:800}}},{name:'1024x768',use:{viewport:{width:1024,height:768}}},{name:'768x1024',use:{viewport:{width:768,height:1024}}},{name:'390x844',use:{viewport:{width:390,height:844}}}],
 webServer:[{command:'npm run api:dev',url:'http://127.0.0.1:3001/api/catalog/meta',reuseExistingServer:true},{command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer:true}],
})
