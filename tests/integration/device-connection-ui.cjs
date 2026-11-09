// Isolated browser fixtures: no real account, board, broker or public API is contacted.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('../../frontend/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const output=path.join(root,'.local/tasks/demo-readiness/device-connection-ui');
const servers=[],checks=[],failures=[],pageErrors=[];
const now=()=>new Date().toISOString();
const secret='fixture-device-key-not-a-real-credential-0123456789';
const claim='fixture-claim-not-a-real-onboarding-code';
const jwt=()=> 'fixture.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';

async function serve(directory){
  const base=path.resolve(root,directory);assert.ok(fs.existsSync(path.join(base,'index.html')),'Build missing: '+directory);
  const server=http.createServer((req,res)=>{
    const target=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(target!==base&&!target.startsWith(base+path.sep))return res.writeHead(403).end();
    const file=!fs.existsSync(target)||fs.statSync(target).isDirectory()?path.join(base,'index.html'):target;
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));servers.push(server);
  return 'http://127.0.0.1:'+server.address().port;
}

async function run(browser,kind,origin,role){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>pageErrors.push({kind,role,message:error.message}));
  await page.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  let socket,sub,sequence=0,rotations=0,reactivations=0,provisions=0;
  const user={userId:'connection-fixture-'+role,email:role.toLowerCase()+'@example.invalid',fullName:'UI fixture',role,status:'ACTIVE',createdAt:now()};
  const d={deviceId:'connection-ui',deviceUuid:'550e8400-e29b-41d4-a716-446655440099',name:'Xe fixture giao diện',dataSource:'HARDWARE',currentUserRole:role,
    lifecycleState:'ACTIVE',securityState:'PARKED',sensorConnected:true,speedValid:true,imuValid:true,gpsValid:false,lastSpeedKmh:0,
    firmwareVersion:'fixture',hwVersion:'fixture',licensePlate:null,vehicleModel:null};
  const registered={...d,deviceId:'unclaimed-ui',deviceUuid:'550e8400-e29b-41d4-a716-446655440098',name:'Board fixture chưa kích hoạt',lifecycleState:'REGISTERED',claimToken:claim};
  const view=()=>({...d,lastSeenAt:now(),lastTelemetryAt:now()});
  const list=()=>[view(),...(role==='ADMIN'?[registered]:[])];
  const credential=()=>({username:d.deviceUuid,password:secret,brokerHost:'192.168.0.101',brokerPort:1883});
  function emit(){if(socket&&sub)socket.send(`MESSAGE\nsubscription:${sub}\nmessage-id:${++sequence}\ncontent-type:application/json\n\n${JSON.stringify({type:'DEVICE',deviceId:d.deviceId,data:view(),sentAt:now()})}\0`);}
  await page.routeWebSocket('**/ws',ws=>{socket=ws;ws.onMessage(message=>{
    const frame=String(message);
    if(/^(CONNECT|STOMP)\n/.test(frame))ws.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
    if(frame.startsWith('SUBSCRIBE\n'))sub=frame.match(/\nid:([^\n]+)/)?.[1];
  });});
  await page.route('**/api/**',async route=>{
    const req=route.request(),url=new URL(req.url()),p=url.pathname;
    const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
    let data=null,status=200;
    if(p==='/api/auth/login'||p==='/api/auth/refresh')data={accessToken:jwt(),refreshToken:'fixture-refresh',expiresIn:3600000,user};
    else if(p==='/api/users/me')data=user;
    else if(p==='/api/admin/devices'&&req.method()==='POST'){
      assert.equal(role,'ADMIN');assert.equal(req.postDataJSON().dataSource,'HARDWARE');provisions++;data=registered;
    }else if(p==='/api/admin/devices')data=list();
    else if(p==='/api/admin/users')data=[user];
    else if(p==='/api/admin/audit-log')data=[];
    else if(p==='/api/devices')data=list();
    else if(p==='/api/alerts')data=[];
    else if(p.endsWith('/mqtt-credentials')){assert.notEqual(role,'VIEWER');rotations++;data=credential();}
    else if(p.endsWith('/reactivate')){assert.notEqual(role,'VIEWER');reactivations++;d.lifecycleState='ACTIVE';data=credential();}
    else if(p.endsWith('/commands')||p.endsWith('/telemetry')||p.endsWith('/users'))data=[];
    else if(p.endsWith('/telemetry/latest'))data=null;
    else if(p.endsWith('/wheel-session'))data={deviceId:d.deviceId,sessionId:'fixture-1',sourceBootId:1,pulseCount:0,revolutions:0,distanceM:0,maxSpeedKmh:0,movingMs:0,elapsedMs:1000,
      fresh:true,available:true,speedLimitConfigurable:true,speedLimitKmh:2,sequence:1,receivedAt:now(),circumferenceM:.20420352,pulsesPerRev:1};
    else if(p.startsWith('/api/devices/'))data=view();
    else throw new Error('Unexpected fixture route: '+p);
    await route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify({success:true,data})});
  });
  if(kind==='web')await context.addInitScript(({user,token})=>{localStorage.setItem('accessToken',token);localStorage.setItem('currentUser',JSON.stringify(user));},{user,token:jwt()});
  const timer=setInterval(emit,700);
  const storageSafe=async()=>{
    const saved=JSON.stringify(await context.storageState());assert.ok(!saved.includes(secret),'MQTT key persisted in browser storage');assert.ok(!saved.includes(claim),'Claim token persisted in browser storage');
  };
  const fit=async label=>{
    const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(dimensions.scroll<=dimensions.width+2,`${kind}/${role} ${label}: horizontal overflow ${dimensions.scroll}/${dimensions.width}`);
    checks.push(`${kind}/${role}: ${label} fits 390px`);
  };
  try{
    await page.goto(origin);
    if(kind==='mobile'){
      await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Mật khẩu',{exact:true}).fill('fixture-login-only');
      await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByText('An tâm hơn mỗi ngày',{exact:true}).waitFor();
    }
    await page.goto(origin+'/developer');
    if(role==='VIEWER'){
      await page.getByText(/Cần quyền chủ xe hoặc quản trị viên để mở công cụ thử nghiệm/).waitFor();
      assert.equal(await page.getByRole('button',{name:'Cấp lại khóa kết nối',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Đăng ký thiết bị mới',exact:true}).count(),0);
      assert.equal(rotations+reactivations+provisions,0);checks.push(`${kind}/VIEWER: direct developer route cannot expose credential/provision controls`);await storageSafe();return;
    }
    const rotate=page.getByRole('button',{name:'Cấp lại khóa kết nối',exact:true});await rotate.waitFor();
    page.once('dialog',dialog=>dialog.dismiss());await rotate.click();assert.equal(rotations,0);checks.push(`${kind}/${role}: cancelling rotate sends no request`);
    page.once('dialog',dialog=>dialog.accept());await rotate.click();const password=page.getByLabel('Khóa kết nối mới',{exact:true});await password.waitFor();
    assert.equal(rotations,1);assert.equal(await password.getAttribute('type'),'password');assert.equal(await password.inputValue(),secret);
    checks.push(`${kind}/${role}: confirmed rotate calls one endpoint and masks one-time key`);await storageSafe();
    await page.getByRole('button',{name:'Hiện khóa',exact:true}).click();assert.equal((await password.getAttribute('type'))||'text','text');
    await page.getByRole('button',{name:'Ẩn khóa',exact:true}).click();assert.equal(await password.getAttribute('type'),'password');
    checks.push(`${kind}/${role}: reveal/hide key is explicit; browser storage omits key/claim`);await fit('credential panel');
    await page.getByRole('button',{name:'Xóa khỏi màn hình',exact:true}).click();assert.equal(await password.count(),0);checks.push(`${kind}/${role}: key can be removed from screen`);
    d.lifecycleState='FAULT';await page.reload();const reactivate=page.getByRole('button',{name:'Kích hoạt lại và cấp khóa mới',exact:true});await reactivate.waitFor();
    page.once('dialog',dialog=>dialog.dismiss());await reactivate.click();assert.equal(reactivations,0);
    page.once('dialog',dialog=>dialog.accept());await reactivate.click();await password.waitFor();assert.equal(reactivations,1);assert.equal(await password.getAttribute('type'),'password');
    checks.push(`${kind}/${role}: reactivation requires confirmation, then issues a masked key`);await storageSafe();
    await page.reload();await rotate.waitFor();assert.equal(await password.count(),0);checks.push(`${kind}/${role}: page reload clears one-time key`);
    if(role==='ADMIN'){
      if(kind==='web')await page.getByText('Đăng ký board mới để kích hoạt sau',{exact:true}).click();
      await page.getByLabel('Tên thiết bị mới',{exact:true}).fill('Board fixture mới');await page.getByRole('button',{name:'Đăng ký thiết bị mới',exact:true}).click();
      await page.getByText(new RegExp(claim)).waitFor();assert.equal(provisions,1);checks.push(`${kind}/ADMIN: provision creates an unclaimed HARDWARE-labelled device and displays returned claim`);await storageSafe();await fit('provision result');
      await page.goto(origin+'/admin');
      if(kind==='web')await page.getByRole('button',{name:/Quản lý Thiết Bị/}).click();
      const reveal=page.getByText('Xem mã kích hoạt',{exact:true});await reveal.waitFor();assert.equal(await page.getByText(claim,{exact:true}).isVisible(),false);
      await reveal.click();await page.getByText(claim,{exact:true}).waitFor();checks.push(`${kind}/ADMIN: admin inventory hides claim until explicit reveal`);await storageSafe();await fit('admin inventory');
    }
    await page.evaluate(()=>{const label=document.createElement('div');label.textContent='UI FIXTURE · KHÔNG PHẢI MẠCH / ĐIỆN THOẠI THẬT';Object.assign(label.style,{position:'fixed',bottom:0,left:0,right:0,zIndex:999999,background:'#fff3cd',padding:'5px',fontSize:'10px'});document.body.appendChild(label);});
    await page.screenshot({path:path.join(output,kind+'-'+role.toLowerCase()+'.png'),fullPage:true});
  }catch(error){failures.push({kind,role,message:error.message});await page.screenshot({path:path.join(output,kind+'-'+role.toLowerCase()+'-failure.png'),fullPage:true}).catch(()=>{});}
  finally{clearInterval(timer);await context.close();}
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});const web=await serve('build/device-connection-web-ui'),mobile=await serve('build/device-connection-mobile-ui');
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||(fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
  try{for(const [kind,origin]of[['web',web],['mobile',mobile]])for(const role of['OWNER','VIEWER','ADMIN'])await run(browser,kind,origin,role);}
  finally{await browser.close();for(const server of servers)await new Promise(resolve=>server.close(resolve));}
  const result={source:'SOFTWARE_FIXTURE',checks,failures,pageErrors,physicalDeviceVerified:false,nativePhoneVerified:false};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({checks:checks.length,failures,pageErrors}));if(failures.length||pageErrors.length)process.exitCode=1;
})().catch(error=>{console.error(error.message);for(const server of servers)server.close();process.exitCode=1;});
