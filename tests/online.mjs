import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='https://keti-dazi-lsxh.leoxinghen.chatgpt.site';
const results=[];
const direct=await fetch(base);results.push({client:'Node fetch',status:direct.status,note:direct.status===403?'Cloudflare rejects this non-browser client; browser checks follow.':'HTTP result'});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const home=await page.goto(base);assert.equal(home.status(),200);
for(const route of ['/health','/blog','/style.css','/client.js','/media/overview.png']){const status=await page.evaluate(async route=>(await fetch(route)).status,route);assert.equal(status,200,route);results.push({route,status,client:'browser fetch'});}
await page.locator('#sample-btn').click();await page.locator('#generate-btn').click();await page.waitForFunction(()=>document.querySelector('#notification').textContent.includes('已生成'));assert.equal(await page.locator('.stat strong').first().textContent(),'12');await page.locator('[data-tab="tasks"]').click();assert.equal(await page.locator('[data-task]').count(),13);await page.goto(base+'/blog');assert.ok((await page.locator('h1').textContent()).includes('课题搭子'));assert.ok(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);results.push({browser:'anonymous Edge',homeStatus:200,plan:true,tasks:13,blog:true,blogImages:true,mobileBlog:true,errors});}finally{await browser.close();}
const record={date:'2026-11-08',base,results};await writeFile('docs/online-results.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
