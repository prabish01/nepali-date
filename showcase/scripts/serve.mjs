import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,extname,sep} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
export function serve() {
 const port=Number(process.env.PORT||4173);
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
 const server=createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,'http://localhost');
   const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
   if(!(await stat(path)).isFile()){res.writeHead(404).end('Not found');return;}
   res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(path));
  } catch {res.writeHead(404).end('Not found');}
 });
 server.listen(port,'127.0.0.1',()=>console.log(`Local showcase: http://localhost:${server.address().port}`));
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url))serve();
