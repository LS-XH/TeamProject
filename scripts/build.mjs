import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const core=await readFile('src/core.js','utf8');
const server=(await readFile('src/server.js','utf8')).replace(/^import .*?;\r?\n/,'');
const html=await readFile('src/index.html','utf8'), css=await readFile('src/style.css','utf8');
const client=(await readFile('src/client.js','utf8')).replace(/^import .*?;\r?\n/,'');
const bundle=`${core}\n${server}\nconst html=${JSON.stringify(html)};\nconst css=${JSON.stringify(css)};\nconst client=${JSON.stringify(core+'\n'+client)};\nexport default {async fetch(request){const path=new URL(request.url).pathname;if(path==='/api/plan')return handleApi(request);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const assets={'/':[html,'text/html'],'/style.css':[css,'text/css'],'/client.js':[client,'text/javascript'],'/health':[JSON.stringify({status:'ok',version:'1.0.0'}),'application/json']};const asset=assets[path];if(!asset)return new Response('Not found',{status:404});return new Response(request.method==='HEAD'?null:asset[0],{headers:{'Content-Type':asset[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",'Cache-Control':'no-cache'}});}};\n`;
await writeFile('dist/server/index.js',bundle);await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built dependency-free Worker: dist/server/index.js');
