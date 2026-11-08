import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/noto-sans-devanagari';
import '@phosphor-icons/web/regular';
import './styles.css';
import {BSDate,adToBS,bsToAD,parseBS,formatBS,addDays,addMonths,addYears,differenceInDays,fiscalYear,fiscalYearBounds,monthGrid,daysInMonth,fromInstant,HolidayCalendar,holidayCoverage,TithiCalendar,tithiFromLongitudes,calendarInfo,toLatinDigits,toNepaliDigits} from '@prabish01/nepali-date';

const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const literal=value=>JSON.stringify(value);
const pad=value=>String(value).padStart(2,'0');
const info=calendarInfo(),coverage=holidayCoverage(),holidays=new HolidayCalendar();
const monthNames=Array.from({length:12},(_,i)=>new BSDate(2083,i+1,1).format('MMMM'));
const scopeNames={'NP-national':'National holidays','NP-region:KathmanduValley':'Kathmandu Valley','NP-region:hills-himalaya':'Hill & Himalayan districts','NP-region:terai':'Listed Terai districts','NP-community:Newar':'Newar community','NP-community:Gaura':'Gaura observers','NP-community:Dura':'Dura community','NP-community:Kirat':'Kirat followers','NP-employees:women':'Women employees','NP-employees:women-observing-Jitiya':'Women observing Jitiya','NP-employees:disability':'Employees with disabilities','NP-education':'Educational institutions'};
let selected;
try{selected=BSDate.today();}catch{selected=new BSDate(2083,1,1);}
let viewYear=selected.year,viewMonth=selected.month,activeDemo='convert',direction='bs-ad',recipeLanguage='ne',moduleSystem='esm',currentCode='',toastTimer,parseEdited=false;
const demoForm=$('demo-form');
const demoMeta={
 convert:{title:'Two calendars. One moment.',description:'Go from Bikram Sambat to Gregorian, or back again. Months start at 1.',file:'conversion.js'},
 format:{title:'Say it your way.',description:'Try English or Nepali names, numerals, and strict parsing with the same date.',file:'formatting.js'},
 arithmetic:{title:'A little date arithmetic.',description:'Cross a month boundary, add a year, or find the days between two dates.',file:'arithmetic.js'},
 fiscal:{title:'Made for Nepal’s fiscal year.',description:'Find the fiscal label and quarter. Shrawan 1 starts a new fiscal year.',file:'fiscal-year.js'},
 timezone:{title:'Same instant. Different date.',description:'Start with an explicit timestamp. The library finds its civil day in your chosen timezone.',file:'timezone.js'},
 holidays:{title:'A holiday, with the context.',description:'Explore the 2083 government notice by month and eligibility scope.',file:'holidays.js'},
 tithi:{title:'Explore the lunar angle.',description:'Supply Sun and Moon longitudes to classify a tithi. These example angles are not today’s astronomy.',file:'tithi.js'}
};
function integer(value,label){const text=toLatinDigits(String(value));if(!/^-?\d+$/.test(text)||!Number.isSafeInteger(Number(text)))throw new RangeError(`${label} must be a whole, safe integer.`);return Number(text);}
function asCivil(date){return {year:date.year,month:date.month,day:date.day};}
function adLabel(date){return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(date.year,date.month-1,date.day)));}
function animateResult(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const el=$('demo-visual');el.classList.remove('is-updating');requestAnimationFrame(()=>el.classList.add('is-updating'));}
function highlight(code){
 const regex=/\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|const|let|new|return|try|catch|if|else|type|readonly|null|true|false)\b|\b\d+(?:\.\d+)?\b/g;
 let result='',last=0;
 for(const match of code.matchAll(regex)){
  result+=esc(code.slice(last,match.index));const token=match[0];
  const kind=token.startsWith('//')?'comment':/^["']/.test(token)?'string':/^\d/.test(token)?'number':'keyword';
  result+=`<span class="syntax-${kind}">${esc(token)}</span>`;last=match.index+token.length;
 }
 return result+esc(code.slice(last));
}
function setOutput(value,code,visual){
 currentCode=code;$('demo-code').innerHTML=highlight(code);$('demo-result').textContent=typeof value==='undefined'?'undefined':JSON.stringify(value,null,2);
 $('demo-visual').innerHTML=visual;$('demo-error').hidden=true;$('demo-error').textContent='';
 $('output-status').innerHTML='<i class="ph ph-check" aria-hidden="true"></i> Executed in your browser';
}
function setError(error){
 const message=error instanceof Error?error.message:String(error);
 $('demo-error').textContent=message;$('demo-error').hidden=false;
 $('demo-visual').innerHTML='<div class="empty-state">Adjust the input above to see a valid result.</div>';
 $('demo-result').textContent=`${error.name||'Error'}: ${message}`;
 currentCode='// Correct the input to run this example.';$('demo-code').textContent=currentCode;
 $('output-status').innerHTML='<i class="ph ph-warning-circle" aria-hidden="true"></i> Check your input';
}
function preview(label,value,detail=''){return `<div class="result-preview"><span class="preview-label">${esc(label)}</span><div class="preview-value">${esc(value)}</div>${detail?`<p class="preview-detail">${esc(detail)}</p>`:''}</div>`;}
function input(name,label,value,extra=''){return `<div class="field"><label for="field-${name}">${esc(label)}</label><input id="field-${name}" name="${name}" value="${esc(value)}" ${extra}></div>`;}
function select(name,label,options,value){return `<div class="field"><label for="field-${name}">${esc(label)}</label><select id="field-${name}" name="${name}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(value)?'selected':''}>${esc(text)}</option>`).join('')}</select></div>`;}
function dateInput(){return input('date','Bikram Sambat date',selected.toString(),'type="text" inputmode="text" spellcheck="false" autocomplete="off" aria-describedby="bs-date-help"')+'<p class="helper" id="bs-date-help">YYYY-MM-DD. Latin and Nepali numerals are accepted.</p>';}
function formFields(){
 switch(activeDemo){
 case'convert':{
  const date=direction==='bs-ad'?selected:selected.toAD();
  return `<div class="field-group"><div class="segmented" role="group" aria-label="Conversion direction"><button type="button" data-direction="bs-ad" class="${direction==='bs-ad'?'active':''}" aria-pressed="${direction==='bs-ad'}">BS to AD</button><button type="button" data-direction="ad-bs" class="${direction==='ad-bs'?'active':''}" aria-pressed="${direction==='ad-bs'}">AD to BS</button></div><div class="field-row">${input('year','Year',date.year,'inputmode="numeric" autocomplete="off"')}${input('month','Month',date.month,'inputmode="numeric" autocomplete="off"')}${input('day','Day',date.day,'inputmode="numeric" autocomplete="off"')}</div><p class="helper">${direction==='bs-ad'?`BS ${info.minYear}–${info.maxYear}; actual month lengths are validated.`:`AD ${info.anchorAD} through ${info.lastAD}, inclusive.`}</p></div>`;
 }
 case'format':return `<div class="field-group">${dateInput()}${input('pattern','Format pattern','dddd, D MMMM YYYY','spellcheck="false" autocomplete="off"')}<div class="field-row two">${select('locale','Language',[['en','English'],['ne','नेपाली']],'ne')}${select('numerals','Numerals',[['auto','Match language'],['latin','Latin (123)'],['ne','Nepali (१२३)']],'auto')}</div></div><div class="pattern-shortcuts" role="group" aria-label="Format presets"><button type="button" data-pattern="YYYY-MM-DD">ISO style</button><button type="button" data-pattern="D MMMM YYYY">Full month</button><button type="button" data-pattern="dddd, D MMMM YYYY">With weekday</button><button type="button" data-pattern="[BS] YYYY/MM/DD">Custom literal</button></div><div class="form-divider"></div><h4 class="field-heading">Parse a formatted date</h4>${input('parse','Date text',selected.format('dddd, D MMMM YYYY',{locale:'ne'}),'spellcheck="false" autocomplete="off"')}<button type="submit" class="form-submit" data-action="parse">Parse date <i class="ph ph-arrow-right" aria-hidden="true"></i></button>`;
 case'arithmetic':return `<div class="field-group">${dateInput()}${select('operation','Operation',[['days','Add days'],['months','Add months'],['years','Add years'],['difference','Difference in days']],'days')}<div class="field-row two">${input('amount','Amount',7,'inputmode="numeric"')}${select('overflow','Month overflow',[['constrain','Constrain to last day'],['reject','Reject invalid day']],'constrain')}</div><div id="difference-field" hidden>${input('other','Compare with (BS)',selected.addDays(selected.day>23?-7:7).toString(),'spellcheck="false"')}</div></div><p class="helper" style="margin-top:12px">Negative amounts subtract. Difference is the first date minus the second.</p>`;
 case'fiscal':return `<div class="field-group">${dateInput()}<div class="pattern-shortcuts"><button type="button" data-example-date="2082-03-32">Last day of FY 2081/82</button><button type="button" data-example-date="2082-04-01">First day of FY 2082/83</button></div></div>`;
 case'timezone':return `<div class="field-group">${input('instant','Timestamp with explicit offset','2026-04-13T18:15:00Z','spellcheck="false" autocomplete="off"')}${select('zone','View in timezone',[['Asia/Kathmandu','Asia/Kathmandu (Nepal)'],['UTC','UTC'],['America/New_York','America/New_York'],['Asia/Tokyo','Asia/Tokyo']],'Asia/Kathmandu')}<p class="helper">Include seconds and Z or a numeric offset such as +05:45.</p></div><div class="pattern-shortcuts" role="group" aria-label="Midnight examples"><button type="button" data-instant="2026-04-13T18:14:59Z">1 second before Nepal midnight</button><button type="button" data-instant="2026-04-13T18:15:00Z">At Nepal midnight</button></div>`;
 case'holidays':{
  const scopes=[...new Set(holidays.forYear(2083).map(record=>record.scope))].sort();
  return `<div class="field-group"><div class="field-row two">${select('year','BS year',Array.from({length:info.maxYear-info.minYear+1},(_,i)=>[info.maxYear-i,String(info.maxYear-i)]),2083)}${select('holidayMonth','Month',[['all','All months'],...monthNames.map((name,i)=>[i+1,name])],selected.month)}</div>${select('scope','Eligibility scope',[['all','All categories'],...scopes.map(scope=>[scope,scopeNames[scope]||scope])],'NP-national')}</div>`;
 }
 case'tithi':return `<div class="field-group"><div class="field"><div class="range-label"><label for="field-sun">Sun longitude</label><output id="sun-output" for="field-sun">350°</output></div><input id="field-sun" name="sun" type="range" min="0" max="359.9" step="0.1" value="350"></div><div class="field"><div class="range-label"><label for="field-moon">Moon longitude</label><output id="moon-output" for="field-moon">10°</output></div><input id="field-moon" name="moon" type="range" min="0" max="359.9" step="0.1" value="10"></div>${select('locale','Tithi language',[['en','English'],['ne','नेपाली']],'en')}<p class="helper">Example longitudes in the same reference frame. No ephemeris or dated almanac is bundled.</p></div><details class="interval-details"><summary>Try sourced interval lookup</summary><div class="field-group"><div class="field"><label for="field-records">Your interval records (JSON array)</label><textarea id="field-records" name="records" spellcheck="false">[]</textarea></div>${input('lookup','Lookup timestamp','2026-11-08T06:00:00+05:45','spellcheck="false"')}<p class="helper">Each record needs start, end, number (1–30), and source. Empty data returns null; it does not estimate a tithi.</p></div><button class="form-submit" type="submit" data-action="interval">Look up interval <i class="ph ph-arrow-right" aria-hidden="true"></i></button><pre class="interval-response" id="interval-response" aria-live="polite"></pre></details>`;
 }
}
function mountDemo(mode,{focus=false}={}){
 if(!demoMeta[mode])return;activeDemo=mode;parseEdited=false;
 document.querySelectorAll('[data-demo]').forEach(button=>{const isActive=button.dataset.demo===mode;button.setAttribute('aria-selected',String(isActive));button.tabIndex=isActive?0:-1;});
 $('demo-panel').setAttribute('aria-labelledby','tab-'+mode);
 $('demo-title').textContent=demoMeta[mode].title;$('demo-description').textContent=demoMeta[mode].description;$('code-filename').textContent=demoMeta[mode].file;
 $('demo-fields').innerHTML=formFields();evaluate();
 if(focus)$('tab-'+mode).focus({preventScroll:true});
}
function evaluate(){
 const fields=Object.fromEntries(new FormData(demoForm));
 try{
  switch(activeDemo){
  case'convert':{
   const year=integer(fields.year,'Year'),month=integer(fields.month,'Month'),day=integer(fields.day,'Day');
   if(direction==='bs-ad'){
    const date=new BSDate(year,month,day),result=bsToAD(date);
    setOutput(result,`import { BSDate, bsToAD } from '@prabish01/nepali-date';\n\nconst date = new BSDate(${year}, ${month}, ${day});\nconst result = bsToAD(date);`,preview('Gregorian (AD)',adLabel(result),`${date.format('D MMMM YYYY')} BS`)+`<div class="preview-subline"><span>${esc(date.format('dddd'))}</span><span>Calendar-day conversion, timezone independent</span></div>`);
    updateSelected(date);
   }else{
    const result=adToBS({year,month,day});
    setOutput(result,`import { adToBS } from '@prabish01/nepali-date';\n\nconst date = { year: ${year}, month: ${month}, day: ${day} };\nconst result = adToBS(date);\n\n// BSDate serializes as a BS date string.`,preview('Bikram Sambat (BS)',result.format('D MMMM YYYY'),result.format('dddd, D MMMM YYYY',{locale:'ne'})));
    updateSelected(result);
   }
   break;
  }
  case'format':{
   const date=parseBS(fields.date),options={locale:fields.locale};if(fields.numerals!=='auto')options.numerals=fields.numerals;
   const result=formatBS(date,fields.pattern,options);
   if(!parseEdited)$('field-parse').value=result;
   setOutput(result,`import { BSDate, formatBS } from '@prabish01/nepali-date';\n\nconst date = BSDate.parse(${literal(fields.date)});\nconst result = formatBS(\n  date,\n  ${literal(fields.pattern)},\n  ${JSON.stringify(options)}\n);`,preview('Formatted date',result,'Copy the example, or parse the text back into a BS date.'));
   updateSelected(date);break;
  }
  case'arithmetic':{
   const date=parseBS(fields.date),operation=fields.operation;
   $('difference-field').hidden=operation!=='difference';$('field-amount').disabled=operation==='difference';$('field-overflow').disabled=!['months','years'].includes(operation);
   const amount=operation==='difference'?0:integer($('field-amount').value,'Amount');
   fields.overflow=$('field-overflow').value;
   if(operation==='difference'){
    const other=parseBS(fields.other),result=differenceInDays(date,other);
    setOutput(result,`import { BSDate, differenceInDays } from '@prabish01/nepali-date';\n\nconst first = BSDate.parse(${literal(fields.date)});\nconst second = BSDate.parse(${literal(fields.other)});\nconst result = differenceInDays(first, second);`,preview('Difference in civil days',`${result} ${Math.abs(result)===1?'day':'days'}`,'First date minus second date. Timezones do not shift this calculation.'));
   }else{
    const fn={days:addDays,months:addMonths,years:addYears}[operation],name={days:'addDays',months:'addMonths',years:'addYears'}[operation];
    const result=operation==='days'?fn(date,amount):fn(date,amount,fields.overflow);
    setOutput(result,`import { BSDate, ${name} } from '@prabish01/nepali-date';\n\nconst date = BSDate.parse(${literal(fields.date)});\nconst result = ${name}(date, ${amount}${operation==='days'?'':', '+literal(fields.overflow)});\n\n// The original date is unchanged.`,preview('Resulting Bikram Sambat date',result.toString(),result.format('dddd, D MMMM YYYY')));
   }
   updateSelected(date);break;
  }
  case'fiscal':{
   const date=parseBS(fields.date),result=fiscalYear(date);let bounds=null;
   try{bounds=fiscalYearBounds(result.startYear);}catch{/* Labels can cross the conversion table boundary. */}
   const quarterLabels=['Shrawan–Ashwin','Kartik–Poush','Magh–Chaitra','Baishakh–Ashadh'];
   const detail=bounds?`${bounds.start.format('D MMMM YYYY')} to ${bounds.end.format('D MMMM YYYY')} BS`:'Full boundaries extend outside the supported calendar table.';
   let code=`import { BSDate, fiscalYear${bounds?', fiscalYearBounds':''} } from '@prabish01/nepali-date';\n\nconst date = BSDate.parse(${literal(fields.date)});\nconst result = fiscalYear(date);`;
   if(bounds)code=code.replace('const result = fiscalYear(date);','const year = fiscalYear(date);')+'\nconst bounds = fiscalYearBounds(year.startYear);\nconst result = { ...year, bounds };';
   setOutput(bounds?{...result,bounds:{start:String(bounds.start),end:String(bounds.end)}}:result,code,preview('Nepal fiscal year',result.label,detail)+`<div class="quarter-visual">${quarterLabels.map((label,i)=>`<div class="${i+1===result.quarter?'active':''}"><b>Q${i+1}</b>${esc(label)}</div>`).join('')}</div>`);
   updateSelected(date);break;
  }
  case'timezone':{
   const result=fromInstant(fields.instant,fields.zone),nepal=fromInstant(fields.instant,'Asia/Kathmandu'),utc=fromInstant(fields.instant,'UTC');
   const dateText=date=>{const ad=date.toAD();return `${ad.year}-${pad(ad.month)}-${pad(ad.day)}`;};
   const note=nepal.compare(utc)>0?'Nepal is already on the next calendar day.':nepal.compare(utc)===0?'Nepal and UTC currently share the same calendar day.':'Nepal’s date differs from UTC at this historical boundary.';
   setOutput(result,`import { fromInstant } from '@prabish01/nepali-date';\n\nconst instant = ${literal(fields.instant)};\nconst result = fromInstant(\n  instant,\n  ${literal(fields.zone)}\n);`,preview(fields.zone,result.format('D MMMM YYYY'),result.format('dddd'))+`<div class="timezone-comparison"><div class="zone-box"><span>UTC calendar day</span><strong>${dateText(utc)}</strong><span>Gregorian</span></div><div class="zone-box current"><span>Nepal calendar day</span><strong>${dateText(nepal)}</strong><span>Gregorian, Asia/Kathmandu</span></div></div><p class="coverage-note">${esc(note)}</p>`);
   updateSelected(result);break;
  }
  case'holidays':{
   const year=integer(fields.year,'Year'),scope=fields.scope==='all'?undefined:fields.scope;
   let result=holidays.forYear(year,scope);if(fields.holidayMonth!=='all')result=result.filter(record=>parseBS(record.date).month===Number(fields.holidayMonth));
   const code=`import { HolidayCalendar } from '@prabish01/nepali-date';\n\nconst holidays = new HolidayCalendar();\nconst result = holidays.forYear(\n  ${year}${scope?',\n  '+literal(scope):''}\n)${fields.holidayMonth==='all'?';':`\n  .filter(day => Number(day.date.slice(5, 7)) === ${Number(fields.holidayMonth)});`}`;
   const list=result.length?`<ul class="holiday-list" aria-label="Matching holiday records">${result.map(record=>{const d=parseBS(record.date);return `<li><span class="holiday-date">${esc(d.format('MMM'))}<strong>${d.day}</strong></span><div><h4>${esc(record.name)}</h4><p>${esc(scopeNames[record.scope]||record.scope)}</p></div><a href="${esc(record.source)}" target="_blank" rel="noopener noreferrer" aria-label="Source for ${esc(record.name)}"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></a></li>`;}).join('')}</ul>`:'<div class="empty-state">No records match this selection. The bundled notice covers 2083; an empty result does not establish a working day.</div>';
   setOutput(result,code,`<div class="preview-subline" style="margin:0 0 10px"><span>${result.length} matching ${result.length===1?'record':'records'}</span><span>${coverage.complete?'Complete coverage':'Partial notice coverage'}</span></div>`+list+`<p class="coverage-note">Source: <a href="${esc(coverage.source)}" target="_blank" rel="noopener noreferrer">MOHA 2083 holiday notice</a>. Later/local announcements and unannounced dates are excluded. An omitted scope includes all categories.</p>`);break;
  }
  case'tithi':{
   const sun=Number(fields.sun),moon=Number(fields.moon),result=tithiFromLongitudes(sun,moon,fields.locale),angle=(moon-sun+360)%360;
   $('sun-output').textContent=`${sun}°`;$('moon-output').textContent=`${moon}°`;
   setOutput(result,`import { tithiFromLongitudes } from '@prabish01/nepali-date';\n\n// Example angles, not today’s ephemeris.\nconst sun = ${sun};\nconst moon = ${moon};\nconst result = tithiFromLongitudes(\n  sun, moon, ${literal(fields.locale)}\n);`,`<div class="tithi-preview"><div class="moon-disc" style="--moon-inset:${Math.round(29*Math.abs(180-angle)/180)+3}px" aria-hidden="true"></div><div><span class="preview-label">${result.paksha==='shukla'?'Shukla':'Krishna'} paksha · Day ${result.day}</span><div class="preview-value" ${fields.locale==='ne'?'lang="ne"':''}>${esc(result.name)}</div><p class="preview-detail">${Number(angle.toFixed(1))}° lunar elongation</p></div></div><p class="coverage-note">A longitude classification, not a dated festival or sunrise-tithi determination. Accurate longitudes must come from your provider.</p>`);break;
  }
  }
 }catch(error){setError(error);}
}
function updateSelected(date){selected=date;viewYear=date.year;viewMonth=date.month;renderCalendar();renderRecipes();}
function renderCalendar(){
 const first=new BSDate(viewYear,viewMonth,1);
 $('calendar-title').textContent=first.format('MMMM YYYY');
 $('hero-day').textContent=toNepaliDigits(selected.day);$('hero-weekday').textContent=selected.format('dddd');$('hero-month').textContent=selected.format('MMMM YYYY',{locale:'ne'});
 $('hero-ad').textContent=adLabel(selected.toAD())+' AD';$('hero-code').textContent=`new BSDate(${selected.year}, ${selected.month}, ${selected.day})`;
 $('calendar-prev').disabled=viewYear===info.minYear&&viewMonth===1;$('calendar-next').disabled=viewYear===info.maxYear&&viewMonth===12;
 $('calendar-grid').setAttribute('aria-label',first.format('MMMM YYYY')+', choose a Bikram Sambat date');
 const selectedVisible=selected.year===viewYear&&selected.month===viewMonth;
 $('calendar-grid').innerHTML=monthGrid(viewYear,viewMonth).flat().map(date=>{
  if(!date)return '<span aria-hidden="true"></span>';
  const active=date.compare(selected)===0,nationalHoliday=holidays.isHoliday(date,'NP-national');
  return `<button type="button" class="calendar-day ${date.weekday===6?'saturday':''} ${nationalHoliday?'holiday':''}" data-calendar-day="${date.day}" aria-pressed="${active}" tabindex="${active||(!selectedVisible&&date.day===1)?0:-1}" aria-label="${esc(date.format('dddd, D MMMM YYYY'))}${nationalHoliday?', national holiday record':''}" title="${esc(date.format('dddd, D MMMM YYYY'))}">${date.day}</button>`;
 }).join('');
}
function renderRecipes(){
 $('specimen-date').textContent=selected.format('D MMMM YYYY',{locale:recipeLanguage});$('specimen-date').lang=recipeLanguage;
 $('specimen-code').textContent=`date.format('D MMMM YYYY', { locale: '${recipeLanguage}' })`;
 const fy=selected.fiscalYear();$('recipe-fy').textContent=fy.label;$('recipe-quarter').textContent=`Q${fy.quarter}`;
 document.querySelectorAll('.fiscal-mini-timeline>span').forEach((el,i)=>el.classList.toggle('active',i+1===fy.quarter));
 const declarations={esm:`import { BSDate } from '@prabish01/nepali-date';\n\nconst date = new BSDate(${selected.year}, ${selected.month}, ${selected.day});\nconsole.log(date.toAD());`,cjs:`const { BSDate } = require(\n  '@prabish01/nepali-date'\n);\n\nconst date = new BSDate(${selected.year}, ${selected.month}, ${selected.day});\nconsole.log(date.toAD());`,ts:`import { BSDate, type CivilDate }\n  from '@prabish01/nepali-date';\n\nconst date = new BSDate(${selected.year}, ${selected.month}, ${selected.day});\nconst ad: CivilDate = date.toAD();`};
 $('stack-code').innerHTML=highlight(declarations[moduleSystem]);
}
function showToast(message){clearTimeout(toastTimer);$('toast').querySelector('span').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('Copied to clipboard');}catch{showToast('Clipboard unavailable. Select and copy the code instead.');}}
function localTheme(){try{return localStorage.getItem('nepali-date-theme');}catch{return null;}}
function applyTheme(value){document.documentElement.dataset.theme=value;const dark=value==='dark';$('theme-toggle').setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');$('theme-toggle').innerHTML=`<i class="ph ph-${dark?'sun':'moon'}" aria-hidden="true"></i>`;document.querySelector('meta[name=theme-color]').content=dark?'#101318':'#f7f8fa';}
const mediaTheme=matchMedia('(prefers-color-scheme: dark)');applyTheme(localTheme()|| (mediaTheme.matches?'dark':'light'));
$('theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(theme);try{localStorage.setItem('nepali-date-theme',theme);}catch{}});
mediaTheme.addEventListener('change',event=>{if(!localTheme())applyTheme(event.matches?'dark':'light');});
$('demo-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-demo]');if(button){mountDemo(button.dataset.demo);animateResult();}});
$('demo-tabs').addEventListener('keydown',event=>{
 const buttons=[...document.querySelectorAll('[data-demo]')],i=buttons.indexOf(document.activeElement);if(i<0)return;
 const index=event.key==='ArrowRight'?(i+1)%buttons.length:event.key==='ArrowLeft'?(i-1+buttons.length)%buttons.length:event.key==='Home'?0:event.key==='End'?buttons.length-1:null;
 if(index!==null){event.preventDefault();mountDemo(buttons[index].dataset.demo,{focus:true});buttons[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
});
demoForm.addEventListener('input',event=>{if(event.target.name==='parse'){parseEdited=true;return;}if(['records','lookup'].includes(event.target.name))return;evaluate();});
demoForm.addEventListener('change',event=>{if(!['parse','records','lookup'].includes(event.target.name))evaluate();});
demoForm.addEventListener('click',event=>{
 const dir=event.target.closest('[data-direction]');if(dir){direction=dir.dataset.direction;mountDemo('convert');animateResult();return;}
 const preset=event.target.closest('[data-pattern]');if(preset){$('field-pattern').value=preset.dataset.pattern;parseEdited=false;evaluate();animateResult();return;}
 const example=event.target.closest('[data-example-date]');if(example){$('field-date').value=example.dataset.exampleDate;evaluate();animateResult();return;}
 const boundary=event.target.closest('[data-instant]');if(boundary){$('field-instant').value=boundary.dataset.instant;evaluate();animateResult();}
});
demoForm.addEventListener('submit',event=>{
 event.preventDefault();const action=event.submitter?.dataset.action,fields=Object.fromEntries(new FormData(demoForm));
 try{
  if(action==='parse'){
   const result=parseBS(fields.parse,fields.pattern,{locale:fields.locale});$('field-date').value=String(result);
   setOutput(result,`import { parseBS } from '@prabish01/nepali-date';\n\nconst result = parseBS(\n  ${literal(fields.parse)},\n  ${literal(fields.pattern)},\n  { locale: ${literal(fields.locale)} }\n);`,preview('Parsed Bikram Sambat date',String(result),result.format('dddd, D MMMM YYYY')));updateSelected(result);animateResult();
  }else if(action==='interval'){
   const records=JSON.parse(fields.records),calendar=new TithiCalendar(records),result=calendar.at(fields.lookup,fields.locale);
   $('interval-response').textContent=result?JSON.stringify(result,null,2):'null: no interval covers this instant. Supply a licensed, sourced dataset to look it up.';
   currentCode=`import { TithiCalendar } from '@prabish01/nepali-date';\n\nconst records = ${JSON.stringify(records,null,2)};\nconst calendar = new TithiCalendar(records);\nconst result = calendar.at(\n  ${literal(fields.lookup)}, ${literal(fields.locale)}\n);`;
   $('demo-code').innerHTML=highlight(currentCode);$('demo-result').textContent=JSON.stringify(result,null,2);$('demo-error').hidden=true;$('output-status').innerHTML='<i class="ph ph-check" aria-hidden="true"></i> Executed in your browser';
  }else evaluate();
 }catch(error){setError(error);if(action==='interval')$('interval-response').textContent=error.message;}
});
$('calendar-grid').addEventListener('click',event=>{const button=event.target.closest('[data-calendar-day]');if(!button)return;selected=new BSDate(viewYear,viewMonth,Number(button.dataset.calendarDay));mountDemo(activeDemo);renderCalendar();renderRecipes();});
$('calendar-grid').addEventListener('keydown',event=>{
 const button=event.target.closest('[data-calendar-day]');if(!button)return;const date=new BSDate(viewYear,viewMonth,Number(button.dataset.calendarDay));
 const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-date.weekday,End:6-date.weekday}[event.key];if(offset===undefined)return;
 event.preventDefault();try{selected=date.addDays(offset);viewYear=selected.year;viewMonth=selected.month;mountDemo(activeDemo);renderCalendar();renderRecipes();$('calendar-grid').querySelector(`[data-calendar-day="${selected.day}"]`)?.focus({preventScroll:true});}catch{/* Stop at the calendar table boundary. */}
});
function browseMonth(amount){try{const next=new BSDate(viewYear,viewMonth,1).addMonths(amount);viewYear=next.year;viewMonth=next.month;renderCalendar();}catch(error){showToast(error.message);}}
$('calendar-prev').addEventListener('click',()=>browseMonth(-1));$('calendar-next').addEventListener('click',()=>browseMonth(1));
$('calendar-today').addEventListener('click',()=>{try{selected=BSDate.today();viewYear=selected.year;viewMonth=selected.month;mountDemo(activeDemo);renderCalendar();renderRecipes();showToast('Showing today in Nepal');}catch(error){showToast(error.message);}});
$('copy-code').addEventListener('click',()=>copyText(currentCode));
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',()=>copyText(button.dataset.copy)));
document.querySelectorAll('[data-open-demo]').forEach(button=>button.addEventListener('click',()=>{mountDemo(button.dataset.openDemo);$('playground').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('tab-'+button.dataset.openDemo).focus({preventScroll:true});}));
for(const language of ['en','ne'])$('recipe-'+language).addEventListener('click',()=>{recipeLanguage=language;for(const l of ['en','ne']){$('recipe-'+l).classList.toggle('active',l===language);$('recipe-'+l).setAttribute('aria-pressed',String(l===language));}renderRecipes();});
document.querySelectorAll('[data-module]').forEach(button=>button.addEventListener('click',()=>{moduleSystem=button.dataset.module;document.querySelectorAll('[data-module]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderRecipes();}));
$('range-label').textContent=`${info.minYear}–${info.maxYear} BS`;
$('coverage-range').textContent=`BS ${info.minYear}–${info.maxYear}, backed by a versioned month-length table. Dates beyond the table throw instead of guessing.`;
mountDemo('convert');renderCalendar();renderRecipes();
