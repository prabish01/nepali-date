import {watch} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {buildSite} from './build.mjs';
import {serve} from './serve.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
await buildSite();const server=serve();let timer;
const watcher=watch(root,{recursive:true},(_,file)=>{
 if(!file||!(file==='index.html'||file.startsWith('src/')||file.startsWith('public/')))return;
 clearTimeout(timer);timer=setTimeout(()=>buildSite().catch(console.error),120);
});
process.on('SIGINT',()=>{watcher.close();server.close();process.exit(0);});
