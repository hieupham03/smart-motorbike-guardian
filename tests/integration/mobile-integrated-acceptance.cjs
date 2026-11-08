// Real exported Expo web app + real Spring Boot/H2; MQTT hardware and push transport are local emulators.
// Never contacts the public broker/Expo service or operates a physical board.
const fs=require('fs'),path=require('path'),http=require('http'),net=require('net'),crypto=require('crypto');
const {spawn,spawnSync}=require('child_process');
const assert=require('assert/strict');
const {chromium}=require('../../frontend/node_modules/playwright');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const output=path.join(root,'docs/evidence/user-dev-ui/2026-11-01/integration');fs.mkdirSync(output,{recursive:true});
const api='http://127.0.0.1:18085',web='http://127.0.0.1:15175';
const mobileExport=path.join(root,'build/mobile-integration-web');
const failureOutput=path.join(root,'build/mobile-integration-failures');
const uuid='550e8400-e29b-41d4-a716-446655440001',deviceId='dev-550e8400-0001';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const checks=[],errors=[],events=[],pushRequests=[],commandRequests=[];
let wheelSequence=0,wheelGeneration=1,wheelPulses=10;
let backend,browser,telemetryTimer,wireState='PARKED',speed=3,gpsFix=false,sendTelemetry=true;
const clients=new Set();
function packet(type,body){let n=body.length,header=[type];do{let b=n%128;n=Math.floor(n/128);header.push(b|(n?128:0));}while(n);return Buffer.concat([Buffer.from(header),body]);}
function send(socket,type,body){if(!socket.destroyed)socket.write(packet(type,body));}
function publish(topic,payload){let name=Buffer.from(topic),length=Buffer.alloc(2);length.writeUInt16BE(name.length);const body=Buffer.concat([length,name,Buffer.from(JSON.stringify(payload))]);for(const c of clients)send(c,0x30,body);}
const broker=net.createServer(socket=>{
  clients.add(socket);let buffer=Buffer.alloc(0);
  socket.on('close',()=>clients.delete(socket));socket.on('error',()=>{});
  socket.on('data',chunk=>{
    buffer=Buffer.concat([buffer,chunk]);
    while(buffer.length>1){let len=0,mult=1,i=1,b;do{if(i>=buffer.length)return;b=buffer[i++];len+=(b&127)*mult;mult*=128;}while(b&128);
      if(buffer.length<i+len)return;const type=buffer[0],body=buffer.subarray(i,i+len);buffer=buffer.subarray(i+len);
      if(type>>4===1)send(socket,0x20,Buffer.from([0,0]));
      else if(type>>4===8)send(socket,0x90,Buffer.from([body[0],body[1],0]));
      else if(type>>4===12)send(socket,0xd0,Buffer.alloc(0));
      else if(type>>4===3){const size=body.readUInt16BE(0),topic=body.subarray(2,2+size).toString();let offset=2+size;
        if((type>>1)&3){send(socket,0x40,body.subarray(offset,offset+2));offset+=2;}
        if(topic.includes('/cmd/')){const cmd=JSON.parse(body.subarray(offset));commandRequests.push(cmd.type);
          const accepted=cmd.type!=='LOCK_ENGINE'||speed===0;
          if(accepted&&cmd.type==='ARM')wireState='ARMED';if(accepted&&cmd.type==='DISARM')wireState='PARKED';
          if(accepted&&cmd.type==='RESET_WHEEL_SESSION'){wheelGeneration++;wheelPulses=0;publishWheel();}
          setTimeout(()=>publish(`guardian/${uuid}/cmd/ack`,{cmd_id:cmd.cmd_id,result:accepted?'EXECUTED':'REJECTED',reason_if_failed:accepted?null:'SPEED_NOT_ZERO'}),80);
        }
      }
    }
  });
});
const staticServer=http.createServer((request,response)=>{
  const url=new URL(request.url,web),base=mobileExport;
  let file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(base+path.sep)&&file!==base){response.writeHead(403).end();return;}
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(base,'index.html');
  const type={'.js':'application/javascript','.css':'text/css','.png':'image/png','.html':'text/html','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  response.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(response);
});
const pushServer=http.createServer((request,response)=>{let body='';request.on('data',chunk=>body+=chunk);request.on('end',()=>{
  pushRequests.push({path:request.url,kind:'LOCAL_MOCK'});
  response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({data:{status:'ok',id:'local-push-ticket'}}));
});});
async function listen(server,port){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});}
async function waitFor(check,ms=20000){const end=Date.now()+ms;let value;while(Date.now()<end){try{value=await check();if(value)return value;}catch{}await sleep(200);}throw Error('Timed out waiting for integration condition');}
async function request(url,token,method='GET',body){const r=await fetch(api+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
function telemetry(){if(!sendTelemetry)return;publish(`guardian/${uuid}/telemetry`,{device_id:uuid,data_source:'HARDWARE',sensor_connected:true,speed_valid:true,imu_valid:true,
  gps_valid:gpsFix,gps_age_ms:gpsFix?0:4294967295,speed_kmh:speed,accel_x:0.1,accel_y:0.2,accel_z:9.81,state:wireState,ts:Math.floor(process.uptime()),
  ...(gpsFix?{latitude:21.0285,longitude:105.8544}:{})});publishWheel();}
function publishWheel(){publish(`guardian/${uuid}/wheel_session`,{device_id:uuid,data_source:'HARDWARE',session_id:`12345678-${wheelGeneration}`,sequence:++wheelSequence,source_boot_id:42,pulse_count:wheelPulses,revolutions:wheelPulses,
  distance_m:wheelPulses*0.20420352,max_speed_kmh:wheelPulses?3:0,moving_ms:wheelPulses?2000:0,elapsed_ms:5000,fresh:true,overspeed_active:speed>2,speed_limit_kmh:2,circumference_m:0.20420352,pulses_per_rev:1});}
async function main(){
  fs.mkdirSync(path.join(root,'build'),{recursive:true});
  const exportLog=fs.openSync(path.join(root,'build/mobile-integration-export.log'),'w');
  const exported=spawnSync(process.execPath,[path.join(root,'frontend/mobile/node_modules/expo/bin/cli'),'export','--platform','web','--output-dir',mobileExport],{
    cwd:path.join(root,'frontend/mobile'),env:{...process.env,EXPO_PUBLIC_API_BASE_URL:api,EXPO_PUBLIC_WS_URL:api.replace(/^http/,'ws')+'/ws'},
    stdio:['ignore',exportLog,exportLog],windowsHide:true,timeout:120000,
  });
  fs.closeSync(exportLog);
  assert.equal(exported.status,0,'Isolated mobile export failed; see build/mobile-integration-export.log');
  await listen(broker,18885);await listen(pushServer,18886);await listen(staticServer,15175);
  const password=crypto.randomBytes(24).toString('base64url');
  const env={...process.env,JWT_SECRET:crypto.randomBytes(48).toString('base64url'),DEMO_PASSWORD:password,DEMO_SEED_ENABLED:'true',
    SPRING_PROFILES_ACTIVE:'h2',MQTT_ENABLED:'true',MQTT_BROKER_URL:'tcp://127.0.0.1:18885',EXPO_PUSH_ENABLED:'true',EXPO_PUSH_BASE_URL:'http://127.0.0.1:18886',
    CORS_ALLOWED_ORIGINS:web,SPRING_DATASOURCE_URL:'jdbc:h2:mem:mobile_review;DB_CLOSE_DELAY=-1;MODE=PostgreSQL',SPRING_DATASOURCE_DRIVER:'org.h2.Driver',
    SPRING_DATASOURCE_USERNAME:'sa',SPRING_DATASOURCE_PASSWORD:'',SPRING_JPA_DIALECT:'org.hibernate.dialect.H2Dialect',SPRING_JPA_SHOW_SQL:'false',LOGGING_LEVEL_ROOT:'WARN'};
  const log=fs.openSync('build/user-dev-integrated-backend-20261101.log','w');
  const java=process.env.GUARDIAN_JAVA || (fs.existsSync('C:/Program Files/Java/jdk-24/bin/java.exe')?'C:/Program Files/Java/jdk-24/bin/java.exe':'java');
  backend=spawn(java,['-jar','backend/target/smart-motorbike-guardian-backend-1.0.0.jar','--server.port=18085','--server.address=127.0.0.1'],{env,stdio:['ignore',log,log],windowsHide:true});
  await waitFor(async()=>{const r=await fetch(api+'/api/health');return r.ok;},60000);
  let auth=await waitFor(async()=>{const r=await request('/api/auth/login',null,'POST',{email:'owner@guardian.iot',password});return r.status===200?r.data.data:null;});
  checks.push('Backend starts with Flyway V1/V2/V3 and real authentication');
  telemetryTimer=setInterval(telemetry,600);telemetry();
  await waitFor(async()=>{const r=await request('/api/devices/'+deviceId,auth.accessToken);return r.data.data?.lastSpeedKmh===3;});
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
  const context=await browser.newContext({viewport:{width:430,height:932}}),page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(20000);
  page.on('dialog',dialog=>dialog.accept());
  page.on('pageerror',error=>errors.push(error.message));
  page.on('websocket',socket=>socket.on('framereceived',frame=>{const text=String(frame.payload);if(text.startsWith('MESSAGE')){try{events.push(JSON.parse(text.slice(text.indexOf('\n\n')+2).replace(/\0$/,'')));}catch{}}}));
  await page.goto(web);await page.getByLabel('Email',{exact:true}).fill('owner@guardian.iot');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByText('An tâm hơn mỗi ngày',{exact:true}).waitFor({timeout:30000});
  await page.getByText('Đang nhận thông tin mới từ xe.',{exact:true}).waitFor();
  await page.getByText(/^3[.,]0\s+km\/h$/).waitFor();checks.push('Exported mobile login + real REST/STOMP dashboard receives emulated Hall speed');
  await page.reload();await page.getByText('An tâm hơn mỗi ngày',{exact:true}).waitFor();checks.push('Mobile session survives browser reload');
  await page.goto(web+'/control');await page.getByText('Bảo vệ & điều khiển',{exact:true}).first().waitFor();
  // LOCK uses an actual modal on web/native, avoiding web Alert confirmation limitations.
  await page.getByText('Khóa động cơ',{exact:true}).click();await page.getByPlaceholder('Mật khẩu',{exact:true}).fill(password);
  await page.getByText('Gửi yêu cầu khóa',{exact:true}).click();await page.getByText(/bánh xe đang quay hoặc chưa dừng đủ lâu/i).first().waitFor();
  assert.ok(commandRequests.includes('LOCK_ENGINE'));checks.push('Mobile LOCK -> real backend -> local MQTT emulator -> REJECTED ACK -> DB/STOMP history');
  publish(`guardian/${uuid}/alert`,{device_id:uuid,alert_id:'mobile-review-overspeed',reason:'SPEED_LIMIT_EXCEEDED',severity:'MEDIUM',action_taken:'WARNING_ONLY',details:'LOCAL EMULATOR: 3 km/h > 2 km/h'});
  await page.goto(web+'/alerts');await page.getByText('Vượt ngưỡng tốc độ',{exact:true}).waitFor();
  checks.push('New firmware overspeed alert is stored and displayed by mobile');
  await page.goto(web+'/map');await page.getByText('Chưa xác định được vị trí',{exact:true}).waitFor();
  gpsFix=true;await page.getByText('Vị trí mới cập nhật',{exact:true}).waitFor();await page.getByText('Vị trí mới cập nhật: 21.028500, 105.854400',{exact:true}).waitFor();
  gpsFix=false;await page.getByText('Vị trí cuối đã biết',{exact:true}).first().waitFor();checks.push('Emulated GPS NO_FIX -> FIX -> STALE keeps last-known position');
  await page.goto(web+'/device/'+deviceId);const name=page.locator('input').first();await name.waitFor();
  await name.fill('UNSAVED MOBILE EDIT');await sleep(1400);
  assert.equal(await name.inputValue(),'UNSAVED MOBILE EDIT');checks.push('Live telemetry preserves dirty metadata form');
  await name.fill('Mobile metadata test');
  const saved=page.waitForResponse(r=>r.url().endsWith('/config')&&r.request().method()==='PATCH');
  await page.getByRole('button',{name:'Lưu thông tin xe',exact:true}).click();const saveResponse=await saved;
  assert.equal(saveResponse.status(),200);assert.ok(!('speedThresholdKmh' in saveResponse.request().postDataJSON()));checks.push('Hardware metadata save succeeds without threshold fields');
  // Keep fixture screenshot labelled; no token/password fields or private coordinates.
  await page.goto(web);sendTelemetry=true;
  await page.getByText('An tâm hơn mỗi ngày',{exact:true}).waitFor();await page.getByText('Đang nhận thông tin mới từ xe.',{exact:true}).waitFor();
  publishWheel();
  await waitFor(async()=>{const r=await request('/api/devices/'+deviceId+'/wheel-session',auth.accessToken);return r.data.data?.pulseCount===10;});
  await page.getByText('2,04 m',{exact:true}).waitFor();await page.getByText('Xe đang vượt ngưỡng tốc độ cảnh báo.',{exact:true}).waitFor();
  checks.push('Firmware wheel_session reaches mobile with real limit, distance and overspeed indicator');
  await page.getByRole('button',{name:'Bắt đầu phiên mới',exact:true}).click();
  await page.getByText('Bắt đầu phiên mới: Đã thực hiện',{exact:true}).waitFor();await page.getByText('0 m',{exact:true}).waitFor();
  assert.ok(commandRequests.includes('RESET_WHEEL_SESSION'));checks.push('Owner reset passes REST/MQTT/ACK and new wheel session clears totals');
  sendTelemetry=false;await page.getByText('Chưa có cập nhật mới. Đang giữ thống kê lần cuối.',{exact:true}).waitFor({timeout:12000});
  assert.equal(await page.getByRole('button',{name:'Bắt đầu phiên mới',exact:true}).isDisabled(),true);
  checks.push('Sensor/wheel expiry retains totals and disables reset');sendTelemetry=true;
  await page.getByText('Đang nhận thông tin mới từ xe.',{exact:true}).waitFor();
  await page.evaluate(()=>{const label=document.createElement('div');label.textContent='SOFTWARE TEST · MQTT/GPS EMULATOR · NO PHYSICAL BOARD';Object.assign(label.style,{position:'fixed',top:'0',left:'0',right:'0',background:'#fef3c7',color:'#92400e',fontSize:'10px',zIndex:99999,padding:'4px',textAlign:'center'});document.body.appendChild(label);});
  await page.screenshot({path:path.join(output,'mobile-web-emulator.png'),fullPage:true});
  // Push is redirected to a local HTTP mock. Probe actual afterCommit flow, not direct service calls.
  const registered=await request('/api/push-tokens',auth.accessToken,'POST',{token:'ExponentPushToken[local-review-test]',platform:'android',installationId:'review-local-install'});
  assert.equal(registered.status,200);
  publish(`guardian/${uuid}/alert`,{device_id:uuid,alert_id:'mobile-review-push',reason:'WHEEL_MOVEMENT_WHILE_ARMED',severity:'HIGH',details:'LOCAL EMULATOR: 3 pulses'});
  await sleep(1800);
  const pushLog=fs.readFileSync('build/user-dev-integrated-backend-20261101.log','utf8');
  const txFailure=pushLog.includes('no transaction is in progress')||pushLog.includes('TransactionRequiredException');
  assert.equal(txFailure,false);assert.ok(pushRequests.length>=1);checks.push('Actual alert afterCommit calls local HTTP push transport without transaction error');
  const viewerAuth=(await request('/api/auth/login',null,'POST',{email:'viewer@guardian.iot',password})).data.data;
  const denied=await request('/api/devices/'+deviceId+'/command',viewerAuth.accessToken,'POST',{type:'RESET_WHEEL_SESSION'});
  assert.equal(denied.status,403);checks.push('Backend denies Viewer wheel reset with 403');
  // Independent logged-in mobile instance: REST must recover live data with WebSocket blocked.
  const fallbackContext=await browser.newContext({viewport:{width:430,height:932}});
  await fallbackContext.routeWebSocket('**/ws',route=>route.close());
  const fallback=await fallbackContext.newPage();fallback.on('pageerror',error=>errors.push(error.message));
  await fallback.goto(web);await fallback.getByLabel('Email',{exact:true}).fill('owner@guardian.iot');await fallback.getByLabel('Mật khẩu',{exact:true}).fill(password);
  await fallback.getByRole('button',{name:'Đăng nhập',exact:true}).click();await fallback.getByText('Đang nhận thông tin mới từ xe.',{exact:true}).waitFor();
  speed=7;await fallback.getByText(/^7[.,]0\s+km\/h$/).waitFor({timeout:18000});
  checks.push('Foreground REST fallback updates mobile speed when WebSocket is blocked');await fallbackContext.close();
  assert.deepEqual(errors,[]);checks.push('No browser JavaScript errors including notification APIs');
  fs.writeFileSync(path.join(output,'integration-results.json'),JSON.stringify({result:'PASS',source:'EXPORTED_MOBILE_REAL_BACKEND_LOCAL_MQTT_EMULATOR',checks,localPushRequests:pushRequests.length,pageErrors:errors,physicalBoard:false,nativePhone:false},null,2));
  console.log('Mobile integrated acceptance PASS:',checks.length,'checks; native/physical NOT tested');
}
main().catch(async error=>{console.error(error.message);fs.mkdirSync(failureOutput,{recursive:true});if(browser){const pages=browser.contexts().flatMap(context=>context.pages());for(let i=0;i<pages.length;i++){try{const body=await pages[i].locator('body').innerText({timeout:2000});fs.writeFileSync(path.join(failureOutput,`failure-page-${i}.txt`),body);}catch{}}}fs.writeFileSync(path.join(failureOutput,'runtime-failure.txt'),error.stack||error.message);process.exitCode=1;}).finally(async()=>{
  clearInterval(telemetryTimer);if(browser)await browser.close();if(backend){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(backend.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else backend.kill();}for(const c of clients)c.destroy();broker.close();pushServer.close();staticServer.close();
});
