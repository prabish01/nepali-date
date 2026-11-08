import {chromium} from 'playwright';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {copyFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {buildSite} from './build.mjs';
import {serve} from './serve.mjs';

// The exported image is made entirely from the actual site's HTML/CSS and live
// library output. The pinned example keeps the artwork reproducible over time.
const root=dirname(dirname(fileURLToPath(import.meta.url)));
await buildSite();
process.env.PORT='0';
const server=serve();await once(server,'listening');
const local=`http://127.0.0.1:${server.address().port}`;
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let browser;
try {
  browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  await page.goto(local,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#field-year').fill('2083');
  await page.locator('#field-month').fill('1');
  await page.locator('#field-day').fill('1');
  const result=JSON.parse(await page.locator('#demo-result').textContent());
  if(result.year!==2026||result.month!==4||result.day!==14)throw new Error('OG example no longer matches its published reference date.');
  await page.evaluate(()=>{
    document.documentElement.dataset.theme='light';
    const brand=document.querySelector('header .brand').cloneNode(true);
    const hero=document.querySelector('.hero').cloneNode(true);
    hero.querySelector('.hero-kicker').remove();
    hero.querySelector('h1').innerHTML='Nepali dates.<br>Simply handled.';
    hero.querySelector('.hero-copy>p').innerHTML='Bikram Sambat for<br>JavaScript &amp; TypeScript.';
    hero.querySelector('.hero-actions').remove();
    hero.querySelector('.calendar-controls').remove();
    hero.querySelector('.text-button').remove();
    hero.querySelector('.receipt-label').remove();
    hero.querySelector('.calendar-receipt code').textContent='new BSDate(2083, 1, 1).toAD()';
    const card=document.createElement('div');card.className='social-card';
    const top=document.createElement('div');top.className='social-top';top.append(brand);
    const type=document.createElement('span');type.className='social-type';type.textContent='Open-source date toolkit';top.append(type);
    const bottom=document.createElement('div');bottom.className='social-bottom';
    bottom.innerHTML='<span>nepali-date.prabishdangi.com.np</span><span>BS ↔ AD <b>·</b> Nepali formatting <b>·</b> Fiscal years</span>';
    card.append(top,hero,bottom);document.body.replaceChildren(card);
  });
  await page.addStyleTag({content:`
    html,body{width:1200px!important;height:630px!important;min-width:1200px!important;margin:0!important;overflow:hidden!important;background:#f7f8fa!important;}
    *,*:before,*:after{animation:none!important;transition:none!important;}
    .social-card{width:1200px;height:630px;padding:48px 60px 0;background:#f7f8fa;overflow:hidden;color:#20232c;position:relative;}
    .social-top{display:flex;align-items:center;justify-content:space-between;height:49px;}
    .social-top .brand{font-size:29px;gap:14px;letter-spacing:-1px;}
    .social-top .brand-mark{width:47px;height:47px;border-radius:14px;font-size:34px;padding-top:9px;}
    .social-type{font-size:16px;color:#666b79;letter-spacing:-.1px;}
    .social-card .hero{display:grid;grid-template-columns:1.12fr 1fr;gap:44px;padding:0;height:409px;min-height:0;align-items:center;}
    .social-card .hero-copy{padding:0;}
    .social-card .hero h1{font-size:65px;line-height:1.09;letter-spacing:-3.1px;font-weight:620;max-width:none;margin:0 0 23px;text-wrap:initial;}
    .social-card .hero-copy>p{font-size:25px;line-height:1.45;max-width:none;letter-spacing:-.45px;color:#666b79;}
    .social-card .hero-object{padding:15px 0 0;transform:none;}
    .social-card .calendar-shell{transform:rotate(-2deg);border-radius:25px;}
    .social-card .calendar-caption{font-size:12px;}
    .social-card .calendar-toolbar{padding:10px 12px 15px;}
    .social-card .calendar-face{grid-template-columns:36% 64%;min-height:246px;}
    .social-card .date-leaf{padding:27px 12px 19px;}
    .social-card .hero-day{height:119px;line-height:1.5;font-size:90px;padding-top:17px;}
    .social-card .hero-month{font-size:14px;}
    .social-card .date-leaf>p{font-size:12px;}
    .social-card .leaf-foot{font-size:10px;padding-top:12px;}
    .social-card .month-view{padding:22px 17px 16px;}
    .social-card .month-title{margin-bottom:15px;}
    .social-card .month-title h2{font-size:14px;}
    .social-card .calendar-weekdays{font-size:11px;margin-bottom:8px;}
    .social-card .calendar-grid{grid-auto-rows:24px;gap:5px;}
    .social-card .calendar-day{font-size:12px;}
    .social-card .calendar-bottom{font-size:12px;padding:17px 13px 10px;}
    .social-card .calendar-locality{font-size:10px;gap:5px;}
    .social-card .calendar-receipt{width:91%;padding:12px 16px;margin:20px 0 0 auto;gap:11px;transform:rotate(1deg);}
    .social-card .calendar-receipt code{font-size:13px;letter-spacing:-.3px;}
    .social-card .calendar-receipt>.ph{font-size:18px;}
    .social-bottom{position:absolute;bottom:37px;left:60px;right:60px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding-top:23px;border-top:1px solid rgba(86,101,126,.14);font-size:15px;color:#666b79;}
    .social-bottom>span:first-child{color:#404754;font-size:17px;font-weight:500;letter-spacing:-.25px;}
    .social-bottom b{font-weight:400;margin:0 7px;color:#a1a5ad;}
  `});
  await page.evaluate(()=>document.fonts.ready);
  const image=join(root,'public/nepali-date-bs-ad-converter-og.png');
  await page.locator('.social-card').screenshot({path:image,type:'png',animations:'disabled'});
  await copyFile(image,join(root,'dist/nepali-date-bs-ad-converter-og.png'));
  console.log(`Exported code-rendered OG image: 1200×630, ${Math.round((await stat(image)).size/1024)} KiB.`);
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
