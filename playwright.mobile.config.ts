import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./e2e',testMatch:'mobile-layout.spec.ts',workers:1,timeout:90000,
 use:{baseURL:'http://127.0.0.1:5184',channel:'chrome',trace:'retain-on-failure'},
 projects:[320,390,768,1440].map(width=>({name:`layout-${width}`,use:{viewport:{width,height:900}}})),
 webServer:{command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5184 --strictPort',url:'http://127.0.0.1:5184',reuseExistingServer:false},
})
