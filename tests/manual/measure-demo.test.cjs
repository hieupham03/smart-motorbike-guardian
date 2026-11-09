const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {distribution,parseOptions,sanitizeSnapshot,Metrics,ApiClient,measureReset}=require('./measure-demo.cjs');

function sample(id,elapsedMs,{uptime=10,lifecycle='ACTIVE',sensor=true}={}) {
  return {elapsedMs,pollMs:10,device:{lifecycle},reading:{id,deviceUptimeS:uptime,sensorConnected:sensor}};
}

test('latest-reading polls are deduplicated and stale is measured on the collector clock',()=>{
  const m=new Metrics(5000);
  m.observe(sample('a',0));m.observe(sample('a',1000));
  const stale=m.observe(sample('a',6001));assert.equal(stale.observedReadingStale,true);
  m.observe(sample('b',6500));
  const s=m.summary(7000);
  assert.equal(s.successfulPolls,4);assert.equal(s.uniqueBackendReadings,2);
  assert.equal(s.unchangedReadingStaleObservations,1);assert.equal(s.newDataObserved,true);
});

test('uptime decrease is reported only for a new reading, with no electrical reboot claim',()=>{
  const m=new Metrics();m.observe(sample('a',0,{uptime:100}));
  m.observe(sample('a',100,{uptime:1}));assert.equal(m.resets.length,0);
  m.observe(sample('b',200,{uptime:1}));assert.equal(m.resets.length,1);
  assert.deepEqual(m.resets[0],{elapsedMs:200,previousUptimeS:100,uptimeS:1});
});

test('offline/recovery markers use observations after keypress and require new data on recovery',()=>{
  const m=new Metrics();m.observe(sample('a',0));assert.equal(m.marker('restore',10),false);
  assert.equal(m.marker('disconnect',1000),true);assert.equal(m.marker('disconnect',1100),false);
  m.observe(sample('a',7100,{lifecycle:'OFFLINE'}));m.marker('restore',8000);
  m.observe(sample('a',8100));assert.equal(m.cycles[0].recoveryObservedMs,null);
  m.observe(sample('b',9300));const cycle=m.summary(9500).networkCycles[0];
  assert.equal(cycle.offlineAfterDisconnectMarkerMs,6100);assert.equal(cycle.recoveryAfterRestoreMarkerMs,1300);
  assert.ok(!('readingAtRestore' in cycle));
});

test('sanitizer refuses simulator and omits credentials, people and coordinates from raw evidence',()=>{
  assert.throws(()=>sanitizeSnapshot({dataSource:'SIMULATED'},null,0,1),/SOURCE_NOT_HARDWARE/);
  assert.throws(()=>sanitizeSnapshot({dataSource:'HARDWARE'},{dataSource:'SIMULATED'},0,1),/SOURCE_NOT_HARDWARE/);
  const d={dataSource:'HARDWARE',email:'private@example.invalid',claimToken:'private-claim',lastLatitude:21.123,lastLongitude:105.456,
    name:'Private Name',licensePlate:'private-plate',lifecycleState:'ACTIVE'};
  const r={dataSource:'HARDWARE',readingId:'r-1',latitude:21.123,longitude:105.456,accessToken:'private-token',speedKmh:2,receivedAt:'2026-01-01T00:00:00Z'};
  const text=JSON.stringify(sanitizeSnapshot(d,r,50,10));
  assert.ok(!/private|latitude|longitude|token|email|plate|name/i.test(text));
  assert.equal(JSON.parse(text).reading.speedKmh,2);
});

test('summary percentiles use nearest rank and HTTP errors stay distinct',()=>{
  assert.deepEqual(distribution([1,2,3,4,5]),{count:5,min:1,mean:3,p50:3,p95:5,max:5});
  const m=new Metrics();m.error('HTTP_503');m.error('REQUEST_TIMEOUT');m.error('HTTP_503');
  assert.deepEqual(m.summary(10).errorCodes,{HTTP_503:2,REQUEST_TIMEOUT:1});
  assert.equal(distribution([]).p95,null);
});

test('CLI refuses credential URLs, too-fast polling and unknown switches',()=>{
  assert.equal(parseOptions(['--duration','1800','--measure-reset']).duration,1800);
  assert.throws(()=>parseOptions(['--base-url','http://user:pass@localhost:8082']),/credentials/);
  assert.throws(()=>parseOptions(['--interval-ms','1']),/numeric/);
  assert.throws(()=>parseOptions(['--password','secret']),/Invalid arguments/);
});

test('reset latency uses one explicit RAM command and same-clock server ack interval',async()=>{
  let now=0;const calls=[];
  const api={request:async(route,method,body)=>{
    calls.push({route,method,body});
    if(method==='POST'){now=20;return {cmdId:'cmd-1',status:'PENDING'};}
    return [{cmdId:'cmd-1',status:'EXECUTED',issuedAt:'2026-01-01T00:00:00.000Z',ackAt:'2026-01-01T00:00:00.080Z',issuedByEmail:'not-for-evidence@example.invalid'}];
  }};
  const r=await measureReset(api,'d-1',{now:()=>now,pause:async ms=>{now+=ms;},pollMs:100});
  assert.equal(calls[0].body.type,'RESET_WHEEL_SESSION');assert.equal(calls.filter(c=>c.method==='POST').length,1);
  assert.equal(r.status,'EXECUTED');assert.equal(r.clientObservedMs,120);assert.equal(r.serverIssuedToAckMs,80);
  assert.ok(!JSON.stringify(r).includes('@'));
});

test('reset observer timeout never resends or invents an ACK',async()=>{
  let now=0,posts=0;const api={request:async(route,method)=>{
    if(method==='POST'){posts++;return {cmdId:'cmd-2',status:'PENDING'};}
    return [{cmdId:'cmd-2',status:'PENDING'}];
  }};
  const r=await measureReset(api,'d-1',{timeout:1000,pollMs:250,now:()=>now,pause:async ms=>{now+=ms;}});
  assert.equal(r.status,'OBSERVER_TIMEOUT');assert.equal(r.serverIssuedToAckMs,null);assert.equal(posts,1);
});

test('HTTP request timeout is bounded and server error bodies are not exposed',async t=>{
  const server=http.createServer((req,res)=>{
    if(req.url==='/api/slow')return;
    res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,message:'private-token@example.invalid'}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  const api=new ApiClient('http://127.0.0.1:'+server.address().port,'unused','unused',100);
  await assert.rejects(()=>api.request('/denied'),e=>e.code==='HTTP_403'&&!e.message.includes('private'));
  await assert.rejects(()=>api.request('/slow'),e=>e.code==='REQUEST_TIMEOUT');
});

test('concurrent expired-token requests share one refresh; refresh secret remains in memory',async()=>{
  const api=new ApiClient('http://127.0.0.1:1','unused','unused',1000);api.access='expired';api.refresh='refresh-secret';
  let refreshCalls=0;
  api.raw=async(route)=>{
    if(route==='/auth/refresh'){refreshCalls++;await new Promise(r=>setTimeout(r,10));return {accessToken:'new-access'};}
    if(api.access==='expired'){const e=new Error('expired');e.status=401;throw e;}
    return {ok:true};
  };
  const values=await Promise.all([api.request('/a'),api.request('/b')]);
  assert.equal(refreshCalls,1);assert.ok(values.every(v=>v.ok));
});
