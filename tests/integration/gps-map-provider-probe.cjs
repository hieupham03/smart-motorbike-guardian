// Optional, single map view at public demo coordinates. No board or account.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('../../frontend/node_modules/playwright');
const out=path.resolve(__dirname,'../../docs/evidence/gps-map/2026-11-08');
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:430,height:500}});
  const result={purpose:'One public demo-coordinate provider check',physicalBoard:false,nativePhone:false};
  try{
    const response=await page.goto('https://www.openstreetmap.org/export/embed.html?bbox=105.8494%2C21.0235%2C105.8594%2C21.0335&layer=mapnik&marker=21.0285%2C105.8544',{waitUntil:'domcontentloaded',timeout:20000});
    result.httpStatus=response.status();
    await page.locator('.leaflet-tile-loaded').first().waitFor({timeout:10000});
    result.renderedTiles=await page.locator('.leaflet-tile-loaded').count();
    result.status='PASS';
    await page.screenshot({path:path.join(out,'provider-public-demo.png')});
  }catch(e){result.status='NOT_VERIFIED';result.reason=String(e).slice(0,300);}
  finally{fs.writeFileSync(path.join(out,'provider-probe.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
