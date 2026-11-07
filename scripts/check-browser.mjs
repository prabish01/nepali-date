import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const result=await build({stdin:{contents:`import {BSDate, fromInstant, HolidayCalendar, tithi} from '@prabish01/nepali-date'; globalThis.result = [new BSDate(2083,1,1).toAD(),fromInstant('2026-04-13T18:15:00Z').toString(),new HolidayCalendar().isHoliday(new BSDate(2083,7,22),'NP-national'),tithi(15).name];`,resolveDir:process.cwd()},bundle:true,platform:'browser',format:'iife',target:['es2022'],write:false});
const context={Intl,Date};
runInNewContext(result.outputFiles[0].text,context);
assert.equal(JSON.stringify(context.result),JSON.stringify([{year:2026,month:4,day:14},'2083-01-01',true,'Purnima']));
console.log(`Browser bundle executes without Node globals (${result.outputFiles[0].contents.length} bytes unminified).`);
