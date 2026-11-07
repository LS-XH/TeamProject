import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {marked} from 'marked';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const core=await readFile('src/core.js','utf8');
const server=(await readFile('src/server.js','utf8')).replace(/^import .*?;\r?\n/,'');
const html=await readFile('src/index.html','utf8'), css=await readFile('src/style.css','utf8');
const client=(await readFile('src/client.js','utf8')).replace(/^import .*?;\r?\n/,'');
// Only repository-controlled Markdown is rendered here; no visitor content enters marked.
const markdown=(await readFile('docs/blog.md','utf8')).replaceAll('https://raw.githubusercontent.com/LS-XH/TeamProject/main/docs/screenshots/','/media/');
const blog='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>课题搭子 · 团队项目作业博客</title><link rel="stylesheet" href="/blog.css"></head><body><header><a href="/">课题搭子 · 返回工作台</a><a href="https://github.com/LS-XH/TeamProject">GitHub 开源项目</a></header><article>'+marked.parse(markdown)+'</article><footer>2026-11-08 · 公开项目文章；课程平台提交状态见交付说明。</footer></body></html>';
const media={};for(const name of ['overview.png','audit.png','mobile.png']) media['/media/'+name]=[(await readFile('docs/screenshots/'+name)).toString('base64'),'image/png'];
const assets={'/':[html,'text/html'],'/blog':[blog,'text/html'],'/blog.css':[await readFile('src/blog.css','utf8'),'text/css'],'/style.css':[css,'text/css'],'/client.js':[core+'\n'+client,'text/javascript'],'/health':[JSON.stringify({status:'ok',version:'1.0.0'}),'application/json']};
const bundle=`${core}\n${server}\nconst assets=${JSON.stringify(assets)};\nconst media=${JSON.stringify(media)};
export default {async fetch(request){
  const path=new URL(request.url).pathname;
  if(path==='/api/plan')return handleApi(request);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const asset=assets[path]||media[path];
  if(!asset)return new Response('Not found',{status:404});
  const body=media[path]?Uint8Array.from(atob(asset[0]),c=>c.charCodeAt(0)):asset[0];
  return new Response(request.method==='HEAD'?null:body,{headers:{
    'Content-Type':asset[1]+(media[path]?'':'; charset=utf-8'),
    'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
    'Cache-Control':'no-cache'
  }});
}};\n`;
await writeFile('dist/server/index.js',bundle);await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built dependency-free Worker: dist/server/index.js');
