import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const temp=await mkdtemp(join(tmpdir(),'nepali-date-package-'));
try {
  // The check command already builds/tests; avoid running lifecycle hooks recursively.
  const packed=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',temp],{encoding:'utf8'}))[0];
  const paths=new Set(packed.files.map(f=>f.path));
  for(const file of ['dist/index.cjs','dist/index.mjs','dist/index.d.ts','dist/index.d.cts','dist/index.d.mts','data/calendar.json','data/holidays.json','licenses/Apache-2.0.txt','THIRD_PARTY_NOTICES.md','LICENSE']) assert.ok(paths.has(file),`Missing packed file ${file}`);
  assert.ok(![...paths].some(p=>p.startsWith('node_modules/')||p.startsWith('tests/')||p.startsWith('src/')));
  await writeFile(join(temp,'package.json'),JSON.stringify({private:true,type:'module'}));
  execFileSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(temp,packed.filename)],{cwd:temp,stdio:'pipe'});
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  await writeFile(join(temp,'consumer.mjs'),`import {BSDate} from '${pkg.name}'; import assert from 'node:assert/strict'; assert.equal(new BSDate(2083,1,1).toString(),'2083-01-01');`);
  await writeFile(join(temp,'consumer.cjs'),`const {BSDate}=require('${pkg.name}'); require('node:assert/strict').equal(new BSDate(2083,1,1).toAD().year,2026);`);
  for(const file of ['consumer.mjs','consumer.cjs']) execFileSync(process.execPath,[file],{cwd:temp,stdio:'pipe'});
  console.log(`Installed tarball offline and verified ESM/CJS consumers: ${packed.files.length} files, ${packed.size} bytes compressed.`);
} finally { await rm(temp,{recursive:true,force:true}); }
