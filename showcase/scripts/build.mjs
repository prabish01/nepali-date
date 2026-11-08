import {build} from 'esbuild';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
export async function buildSite() {
  await mkdir(join(root,'dist'),{recursive:true});
  const result=await build({absWorkingDir:root,entryPoints:{app:'src/app.js'},bundle:true,format:'esm',platform:'browser',target:['es2022'],outdir:'dist/assets',entryNames:'[name]-[hash]',assetNames:'[name]-[hash]',loader:{'.woff2':'file','.woff':'file','.ttf':'file','.svg':'file'},minify:true,metafile:true,logLevel:'warning'});
  const outputs=Object.keys(result.metafile.outputs);
  const js=outputs.find(path=>path.endsWith('.js'));
  const css=outputs.find(path=>path.endsWith('.css'));
  const html=(await readFile(join(root,'index.html'),'utf8')).replace('__APP_JS__','/'+js.replace(/^dist\//,'')).replace('__APP_CSS__','/'+css.replace(/^dist\//,''));
  await writeFile(join(root,'dist/index.html'),html);
  await copyFile(join(root,'public/favicon.svg'),join(root,'dist/favicon.svg'));
  console.log('Built static showcase with bundled Nepali Date, fonts and icons.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildSite();
