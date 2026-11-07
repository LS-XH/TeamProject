import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const built=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});if(built.status)process.exit(built.status);
const {default:worker}=await import(pathToFileURL(process.cwd()+'/dist/server/index.js'));
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{try{const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>100000){res.writeHead(413).end();return;}parts.push(part);}const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});const out=await worker.fetch(request);res.writeHead(out.status,Object.fromEntries(out.headers));res.end(Buffer.from(await out.arrayBuffer()));}catch{res.writeHead(500).end('Internal error');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
