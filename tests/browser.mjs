import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const executablePath=process.env.BROWSER_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if(!executablePath)throw new Error('未找到Edge/Chrome，请设置 BROWSER_PATH。');
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true});
const results=[];const errors=[];
try{
const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');await page.locator('#sample-btn').click();await page.locator('#members').fill('小林，小周');await page.locator('#generate-btn').click();await page.waitForFunction(()=>document.querySelector('#notification').textContent.includes('已生成'));
assert.equal(await page.locator('.stat strong').nth(1).textContent(),'100%');assert.equal(await page.locator('.stat strong').nth(2).textContent(),'0%');results.push('课程示例生成、覆盖率与完成率区分');
await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'docs/screenshots/overview.png',fullPage:true});
await page.locator('[data-tab="requirements"]').click();assert.equal(await page.locator('[data-req]').count(),13);await page.locator('[data-req="R001"] [data-field="title"]').fill('<img src=x onerror=alert(1)>');await page.locator('[data-req="R001"] [data-field="title"]').blur();results.push('需求原文与验收编辑');
await page.locator('[data-tab="tasks"]').click();await page.locator('[data-task="T001"] [data-field="owner"]').selectOption('小林');await page.locator('[data-task="T001"] [data-field="status"]').selectOption('done');await page.locator('[data-tab="audit"]').click();assert.ok((await page.locator('#audit-content').textContent()).includes('已完成但缺少交付证据'));results.push('完成但无证据时提示风险');
await page.locator('[data-tab="tasks"]').click();await page.locator('[data-task="T001"] [data-field="evidence"]').fill('https://github.com/LS-XH/TeamProject');await page.locator('[data-task="T001"] [data-field="evidence"]').blur();await page.locator('[data-tab="audit"]').click();await page.screenshot({path:'docs/screenshots/audit.png',fullPage:true});results.push('交付证据持久化与体检');
await page.reload();await page.locator('[data-tab="tasks"]').click();assert.equal(await page.locator('[data-task="T001"] [data-field="owner"]').inputValue(),'小林');await page.locator('[data-delete="T002"]').click();await page.locator('[data-tab="audit"]').click();assert.ok((await page.locator('#audit-content').textContent()).includes('没有关联任务'));results.push('刷新恢复与任务漏项检查');
await page.locator('[data-tab="overview"]').click();await page.locator('#source').fill('上线运行\n编写博客');assert.ok(await page.locator('#source-diff').isVisible());results.push('原文变更提示');
await page.locator('#settings-btn').click();await page.locator('#api-key').fill('test-ui-not-real');await page.locator('#settings-dialog .primary').click();assert.ok(!(await page.evaluate(()=>localStorage.getItem('keti-dazi-v1'))).includes('test-ui-not-real'));results.push('密钥不写入本地项目存储');
const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#backup-btn').click()]);assert.ok(download.suggestedFilename().endsWith('.json'));results.push('JSON备份可下载');
const importProject=await page.evaluate(()=>JSON.parse(localStorage.getItem('keti-dazi-v1')));importProject.name='导入测试';await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(importProject))});assert.equal(await page.locator('#project-name').inputValue(),'导入测试');results.push('JSON备份可导入');
await page.locator('#generate-btn').click();await page.waitForFunction(()=>document.querySelector('#notification').textContent.includes('已生成'));await page.locator('#restore-btn').click();assert.equal(await page.locator('#project-name').inputValue(),'导入测试');results.push('重新生成后可恢复旧计划');
await page.locator('[data-tab="tasks"]').click();assert.equal(await page.locator('img').count(),0);results.push('恶意HTML作为纯文本显示');
await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="overview"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:'docs/screenshots/mobile.png',fullPage:true});results.push('390px移动端无水平溢出');
assert.deepEqual(errors,[]);results.push('无未捕获浏览器错误');
await writeFile('docs/browser-results.json',JSON.stringify({date:'2026-11-08',baseUrl:process.env.BASE_URL||'http://127.0.0.1:4173',browser:'Microsoft Edge / Chromium',passed:results.length,results,errors},null,2));console.log(JSON.stringify({passed:results.length,results},null,2));
}finally{await browser.close();}
