// Controlled REST/STOMP fixtures only. Never sends commands to a real broker/device.
const { chromium } = require('../../frontend/node_modules/playwright');
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'docs/evidence/speed-limit-ui');
const servers = [], checks = [], errors = [];
const now = () => new Date().toISOString();
const token = () => 'fixture.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url') + '.fixture';
async function serve(directory) {
  const base = path.join(root, directory);
  const server = http.createServer((req, res) => {
    let file = path.resolve(base, '.' + new URL(req.url, 'http://local').pathname);
    if (file !== base && !file.startsWith(base + path.sep)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(base, 'index.html');
    res.writeHead(200, { 'Content-Type': ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
async function run(browser, kind, origin, role = 'OWNER') {
  const context = await browser.newContext({ viewport: kind === 'web' ? {width:1440,height:1100} : {width:390,height:844} });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(`${kind}: ${error.message}`));
  await page.route('**/*', route => ['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  let socket, subscription, sequence = 0, commands = [], requests = [], live = true;
  const user = { userId:'speed-fixture-'+role, email:'fixture@example.invalid', fullName:'Kiểm thử giao diện', role, status:'ACTIVE' };
  const device = { deviceId:'speed-ui',deviceUuid:'speed-ui-fixture',name:'Xe kiểm thử giao diện',dataSource:'HARDWARE',currentUserRole:role,lifecycleState:'ACTIVE',securityState:'PARKED',sensorConnected:true,speedValid:true,imuValid:true,gpsValid:false,lastSpeedKmh:0 };
  const stats = {deviceId:device.deviceId,sessionId:'12345678-1',sourceBootId:42,pulseCount:10,revolutions:10,distanceM:2.0420352,maxSpeedKmh:3,movingMs:2000,elapsedMs:5000,fresh:true,overspeedActive:false,speedLimitKmh:2,speedLimitConfigurable:true,circumferenceM:.20420352,pulsesPerRev:1};
  const view = () => ({...device,lastSeenAt:now(),lastTelemetryAt:now()});
  const wheel = () => ({...stats,sequence:++sequence,receivedAt:now()});
  function emit(type,data) {
    if (!socket || !subscription) return;
    socket.send(`MESSAGE\nsubscription:${subscription}\nmessage-id:${++sequence}\ncontent-type:application/json\n\n${JSON.stringify({type,deviceId:device.deviceId,data,sentAt:now()})}\0`);
  }
  await page.routeWebSocket('**/ws', ws => {
    socket=ws; ws.onMessage(message => {
      const frame=String(message);
      if (/^(CONNECT|STOMP)\n/.test(frame)) ws.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
      if(frame.startsWith('SUBSCRIBE\n')) subscription=frame.match(/\nid:([^\n]+)/)?.[1];
    });
  });
  await page.route('**/api/**', async route => {
    const req=route.request(), p=new URL(req.url()).pathname;
    const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
    if(req.method()==='OPTIONS') return route.fulfill({status:204,headers});
    let data=null;
    if(p==='/api/auth/login'||p==='/api/auth/refresh') data={accessToken:token(),refreshToken:'fixture',user};
    else if(p==='/api/users/me') data=user;
    else if(p==='/api/devices') data=[view()];
    else if(p==='/api/alerts') data=[];
    else if(p.endsWith('/wheel-session')) data=wheel();
    else if(p.endsWith('/commands')) data=commands;
    else if(p.endsWith('/command')) {
      assert.equal(role,'OWNER'); const body=req.postDataJSON(); requests.push(body);
      assert.equal(body.type,'CONFIG_THRESHOLDS');
      data={cmdId:'speed-cmd-'+requests.length,deviceId:device.deviceId,type:body.type,status:'PENDING',issuedAt:now(),reasonIfFailed:null}; commands.unshift(data);
    } else if(p.endsWith('/telemetry/latest')) data=null;
    else if(p.endsWith('/telemetry')) data=[];
    else if(p.startsWith('/api/devices/')) data=view();
    else throw Error('Unexpected fixture API '+p);
    await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({success:true,data})});
  });
  if(kind==='web') await context.addInitScript(({user,token}) => {localStorage.setItem('accessToken',token);localStorage.setItem('currentUser',JSON.stringify(user));}, {user,token:token()});
  const timer=setInterval(() => {if(live){emit('DEVICE',view());emit('WHEEL_SESSION',wheel());}},500);
  try {
    await page.goto(origin);
    if(kind==='mobile') {
      await page.getByLabel('Email',{exact:true}).fill(user.email);
      await page.getByLabel('Mật khẩu',{exact:true}).fill('fixture-password-only');
      await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    }
    const applied=page.getByText(/^Ngưỡng thiết bị báo về:/);
    await applied.waitFor();
    const input=page.getByLabel('Ngưỡng mới (km/h)',{exact:true});
    const save=page.getByRole('button',{name:'Lưu ngưỡng cảnh báo',exact:true});
    if(role==='VIEWER') {
      assert.equal(await input.count(),0); assert.equal(requests.length,0); checks.push(kind+': viewer cannot edit'); return;
    }
    await input.fill('0'); await save.click();
    await page.getByText('Nhập ngưỡng từ 1 đến 120 km/h.',{exact:true}).waitFor();
    assert.equal(requests.length,0); checks.push(kind+': invalid threshold is not sent');
    await input.fill('5.5'); await save.click();
    await page.getByText('Đổi ngưỡng cảnh báo tốc độ: Đang chờ thiết bị',{exact:true}).waitFor();
    assert.deepEqual(JSON.parse(requests[0].payload),{speed_limit_kmh:5.5});
    assert.match(await applied.textContent(),/2 km\/h/);
    assert.equal(await save.isDisabled(),true); checks.push(kind+': payload and pending state; no optimistic applied value');
    commands[0]={...commands[0],status:'EXECUTED',ackAt:now()}; emit('COMMAND',commands[0]);
    await page.getByText('Đổi ngưỡng cảnh báo tốc độ: Đã thực hiện',{exact:true}).waitFor();
    assert.match(await applied.textContent(),/2 km\/h/);
    stats.speedLimitKmh=5.5; emit('WHEEL_SESSION',wheel());
    await page.waitForFunction(() => document.body.textContent.includes('Ngưỡng thiết bị báo về: 5,5 km/h'));
    checks.push(kind+': applied threshold follows device snapshot after ACK');
    await input.fill('6'); await save.click();
    await page.getByText('Đổi ngưỡng cảnh báo tốc độ: Đang chờ thiết bị',{exact:true}).waitFor();
    commands[0]={...commands[0],status:'REJECTED',reasonIfFailed:'CONFIG_STORAGE_FAILED',ackAt:now()}; emit('COMMAND',commands[0]);
    await page.getByText(/Thiết bị chưa lưu được ngưỡng mới/).waitFor();
    assert.match(await applied.textContent(),/5,5 km\/h/); checks.push(kind+': rejection preserves the reported threshold');
    stats.speedLimitConfigurable=false; emit('WHEEL_SESSION',wheel());
    await page.getByText('Thiết bị chưa hỗ trợ đổi ngưỡng từ xa. Cần cập nhật phần mềm thiết bị.',{exact:true}).waitFor();
    assert.equal(await save.isDisabled(),true); checks.push(kind+': older firmware cannot submit settings');
    stats.speedLimitConfigurable=true; stats.fresh=false; emit('WHEEL_SESSION',wheel());
    await page.getByText('Chờ thiết bị kết nối và gửi dữ liệu mới để đổi ngưỡng.',{exact:true}).waitFor();
    assert.equal(await save.isDisabled(),true); checks.push(kind+': stale device cannot submit settings');
    stats.fresh=true; emit('WHEEL_SESSION',wheel());
    await page.waitForFunction(() => {
      const button=[...document.querySelectorAll('button,[role="button"]')].find(el=>el.textContent==='Lưu ngưỡng cảnh báo');
      return button && !button.disabled && button.getAttribute('aria-disabled')!=='true';
    });
    await page.evaluate(() => {
      const label=document.createElement('div');label.textContent='KIỂM THỬ GIAO DIỆN · DỮ LIỆU GIẢ LẬP · KHÔNG PHẢI MẠCH / ĐIỆN THOẠI THẬT';
      Object.assign(label.style,{position:'fixed',bottom:0,left:0,right:0,zIndex:99999,background:'#fff3cd',fontSize:'11px',padding:'6px'});document.body.appendChild(label);
    });
    await input.scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,kind+'.png'),fullPage:kind==='web'});
  } finally {clearInterval(timer);await context.close();}
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const web=await serve('frontend/dist'),mobile=await serve('frontend/mobile/dist');
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
  try {
    for(const [kind,origin] of [['web',web],['mobile',mobile]]) {await run(browser,kind,origin);await run(browser,kind,origin,'VIEWER');}
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({source:'SOFTWARE_FIXTURE',result:'PASS',checks,pageErrors:errors,physicalDeviceVerified:false},null,2));
    console.log(`PASS ${checks.length} web/mobile speed-limit UI checks; pageErrors=0`);
  } finally {await browser.close();for(const server of servers)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);for(const server of servers)server.close();process.exitCode=1;});
