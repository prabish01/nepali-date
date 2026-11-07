import { mkdir, copyFile } from 'node:fs/promises';
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
for (const file of ['index.cjs','index.mjs','index.d.ts']) await copyFile(new URL('../src/'+file,import.meta.url),new URL('../dist/'+file,import.meta.url));
for (const ext of ['mts','cts']) await copyFile(new URL('../src/index.d.ts',import.meta.url),new URL('../dist/index.d.'+ext,import.meta.url));
