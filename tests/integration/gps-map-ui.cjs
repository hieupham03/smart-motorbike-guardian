// Browser integration with controlled API/STOMP and map-provider responses.
// No real account, board, native phone or GPS position is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('../../frontend/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/evidence/gps-map/2026-11-08');
const checks = [], errors = [], servers = [];
let browser;
const now = () => new Date().toISOString();
const jwt = () => 'fixture.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url') + '.fixture';
async function serve(directory) {
  const base = path.join(root, directory);
  assert.ok(fs.existsSync(path.join(base, 'index.html')), 'Build required: ' + directory);
  const server = http.createServer((req, res) => {
    let file = path.resolve(base, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (file !== base && !file.startsWith(base + path.sep)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(base, 'index.html');
    const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.woff2':'font/woff2' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
async function test(kind, origin) {
  const context = await browser.newContext({ viewport: kind === 'web' ? {width:1280,height:900} : {width:430,height:932} });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${kind}: ${e.message}`));
  const user = { userId:'map-user', email:'map@example.invalid', fullName:'Kiểm thử bản đồ', role:'OWNER', status:'ACTIVE' };
  const device = { deviceId:'map-fixture',deviceUuid:'map-fixture',name:'Xe kiểm thử bản đồ',dataSource:'HARDWARE',currentUserRole:'OWNER',lifecycleState:'ACTIVE',securityState:'PARKED',sensorConnected:true,speedValid:true,imuValid:true,lastSpeedKmh:0,lastLatitude:null,lastLongitude:null,lastLocationReceivedAt:null,gpsValid:false,gpsAgeMs:4294967295 };
  const view = () => ({...device,lastTelemetryAt:now(),lastSeenAt:now()});
  const reading = () => ({ readingId:'map-reading',deviceId:device.deviceId,dataSource:'HARDWARE',sensorConnected:true,speedValid:true,imuValid:true,speedKmh:0,latitude:device.lastLatitude,longitude:device.lastLongitude,gpsValid:device.gpsValid,gpsAgeMs:device.gpsAgeMs,receivedAt:now(),ts:Math.floor(Date.now()/1000) });
  let socket, sub, failTiles = true;
  const emit = () => socket.send(`MESSAGE\nsubscription:${sub}\nmessage-id:${Date.now()}\ncontent-type:application/json\n\n${JSON.stringify({type:'DEVICE',deviceId:device.deviceId,data:view(),sentAt:now()})}\0`);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname === 'www.openstreetmap.org' && url.pathname === '/export/embed.html')
      return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Map fixture</title><p>Nền bản đồ giả lập để kiểm giao diện</p>'});
    if (url.hostname === 'tile.openstreetmap.org')
      return failTiles ? route.fulfill({status:503,body:'fixture outage'}) : route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv0kAAAAASUVORK5CYII=','base64')});
    return route.abort();
  });
  await page.routeWebSocket('**/ws', ws => {
    socket = ws;
    ws.onMessage(msg => {
      const frame = String(msg);
      if (/^(CONNECT|STOMP)\n/.test(frame)) ws.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
      if (frame.startsWith('SUBSCRIBE\n')) sub = frame.match(/\nid:([^\n]+)/)?.[1];
    });
  });
  await page.route('**/api/**', async route => {
    const p = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'}});
    const data = /\/auth\/(login|refresh)$/.test(p) ? {accessToken:jwt(),refreshToken:'fixture-refresh',expiresIn:3600000,user}
      : p === '/api/users/me' ? user : p === '/api/devices' ? [view()]
      : p.endsWith('/telemetry/latest') ? reading() : p.endsWith('/wheel-session') ? null
      : p === '/api/alerts' || /\/(telemetry|commands)$/.test(p) ? [] : view();
    return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({success:true,data,message:'OK'})});
  });
  if (kind === 'web') await context.addInitScript(({user,token}) => {
    localStorage.setItem('currentUser',JSON.stringify(user)); localStorage.setItem('accessToken',token); localStorage.setItem('refreshToken','fixture-refresh');
  }, {user,token:jwt()});
  await page.goto(origin);
  if (kind === 'mobile') {
    await page.getByLabel('Email',{exact:true}).fill(user.email);
    await page.getByLabel('Mật khẩu',{exact:true}).fill('fixture-password');
    await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.getByText('An tâm hơn mỗi ngày',{exact:true}).waitFor();
  }
  await page.goto(origin+'/map');
  await page.getByText('Chưa xác định được vị trí',{exact:false}).first().waitFor();
  assert.equal(await page.locator(kind === 'web' ? '.leaflet-container' : 'iframe').count(),0);
  checks.push(`${kind}: no marker/map before a position exists`);
  for (let attempt=0;!sub && attempt<80;attempt++) await page.waitForTimeout(50);
  assert.ok(sub,'STOMP subscribed');
  Object.assign(device,{lastLatitude:21.0285,lastLongitude:105.8544,lastLocationReceivedAt:now(),gpsValid:true,gpsAgeMs:0}); emit();
  await page.getByText('Vị trí mới cập nhật',{exact:false}).first().waitFor();
  if (kind === 'web') {
    await page.locator('.leaflet-marker-icon').waitFor();
    assert.equal(await page.locator('.leaflet-pane').first().evaluate(e=>getComputedStyle(e).position),'absolute');
    await page.getByText('Chưa tải được đầy đủ nền bản đồ.',{exact:false}).waitFor();
    failTiles = false;
    await page.getByRole('button',{name:'Tải lại bản đồ'}).click();
    await page.locator('.leaflet-tile-loaded').first().waitFor();
    assert.equal(await page.getByText('Chưa tải được đầy đủ nền bản đồ.',{exact:false}).count(),0);
    checks.push('web: bundled Leaflet CSS, marker, tile failure feedback and retry');
  } else {
    const frame=page.locator('iframe[title="Bản đồ vị trí xe"]');
    await frame.waitFor();
    assert.equal(new URL(await frame.getAttribute('src')).searchParams.get('marker'),'21.028500,105.854400');
    assert.ok(await frame.evaluate(e=>e.getBoundingClientRect().height)>=380);
    checks.push('mobile web: embedded map carries vehicle coordinates and fits viewport');
  }
  const link=page.getByRole('link',{name:'Mở bản đồ lớn'}).first();
  assert.equal(new URL(await link.getAttribute('href')).searchParams.get('mlat'),kind === 'web' ? '21.0285' : '21.028500');
  Object.assign(device,{lastLatitude:21.03,lastLongitude:105.86,lastLocationReceivedAt:now()}); emit();
  if (kind==='mobile') await page.waitForFunction(()=>document.querySelector('iframe')?.src.includes('21.030000'));
  else await page.waitForFunction(()=>document.querySelector('a[target="_blank"]')?.href.includes('mlat=21.03'));
  checks.push(`${kind}: realtime coordinates update map and full-map link`);
  device.gpsValid=false;device.gpsAgeMs=10000;emit();
  await page.getByText('Đây là vị trí lần cuối đã nhận, không phải vị trí hiện tại.',{exact:false}).first().waitFor();
  assert.equal(await page.locator(kind==='web'?'.leaflet-marker-icon':'iframe').count(),1);
  checks.push(`${kind}: keeps last-known location with stale warning`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.evaluate(()=>{const p=document.createElement('p');p.textContent='KIỂM THỬ GIAO DIỆN · API/STOMP VÀ NỀN BẢN ĐỒ GIẢ LẬP';p.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#fef3c7;color:#713f12;z-index:99999;font-size:11px';document.body.append(p);});
  await page.screenshot({path:path.join(out,kind+'-map-stale.png'),fullPage:true});
  await context.close();
}
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const web=await serve('frontend/dist'),mobile=await serve('frontend/mobile/dist');
  browser=await chromium.launch({headless:true});
  await test('web',web);await test('mobile',mobile);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'PASS',checks,pageErrors:errors,source:'CONTROLLED_API_STOMP_AND_MAP_PROVIDER',physicalBoard:false,nativePhone:false,realTilesVerified:false},null,2));
  console.log(JSON.stringify({status:'PASS',checks:checks.length,pageErrors:errors.length}));
}
main().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,checks,errors},null,2));console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();for(const s of servers)s.closeAllConnections();await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));});
