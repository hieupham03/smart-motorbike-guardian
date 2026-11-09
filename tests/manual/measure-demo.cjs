#!/usr/bin/env node
// Observe the real backend. Never serializes API bodies, credentials, emails or GPS coordinates.
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const ROOT = path.resolve(__dirname, '../..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const round = value => value == null ? null : Math.round(value * 100) / 100;
const bool = value => typeof value === 'boolean' ? value : null;
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,120}$/.test(value) ? value : null;
const safeState = value => typeof value === 'string' && /^[A-Z_]{1,32}$/.test(value) ? value : null;
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;

function distribution(values) {
  const v = values.filter(Number.isFinite).sort((a,b) => a-b);
  if (!v.length) return { count: 0, min: null, mean: null, p50: null, p95: null, max: null };
  return { count:v.length, min:round(v[0]), mean:round(v.reduce((a,b)=>a+b,0)/v.length),
    p50:round(v[Math.ceil(v.length*.5)-1]), p95:round(v[Math.ceil(v.length*.95)-1]), max:round(v.at(-1)) };
}

function parseOptions(args) {
  const o = { baseUrl:'http://127.0.0.1:8082', duration:60, interval:1000, timeout:8000,
    staleMs:5000, commandTimeout:30000, device:null, measureReset:false, out:null };
  const names = { '--base-url':'baseUrl','--duration':'duration','--interval-ms':'interval',
    '--timeout-ms':'timeout','--stale-ms':'staleMs','--command-timeout-ms':'commandTimeout','--device':'device','--out':'out' };
  for (let i=0;i<args.length;i++) {
    if (args[i]==='--help' || args[i]==='-h') {o.help=true;continue;}
    if (args[i]==='--measure-reset') {o.measureReset=true;continue;}
    const key=names[args[i]];
    if (!key || !args[i+1] || args[i+1].startsWith('--')) throw new Error('Invalid arguments; use --help');
    o[key]=args[++i];
  }
  for (const key of ['duration','interval','timeout','staleMs','commandTimeout']) o[key]=Number(o[key]);
  if (!(o.duration>=5 && o.duration<=86400) || !(o.interval>=200 && o.interval<=60000) ||
      !(o.timeout>=100 && o.timeout<=60000) || !(o.staleMs>=1000) || !(o.commandTimeout>=1000 && o.commandTimeout<=120000))
    throw new Error('Invalid numeric range; use --help');
  const url=new URL(o.baseUrl);
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['/','/api','/api/'].includes(url.pathname))
    throw new Error('Base URL must be an HTTP(S) origin, optionally ending in /api; do not embed credentials');
  o.baseUrl=url.origin;
  if (o.device && !safeId(o.device)) throw new Error('Invalid device identifier');
  return o;
}

function sanitizeSnapshot(device, reading, elapsedMs, pollMs) {
  if (device?.dataSource!=='HARDWARE' || (reading && reading.dataSource!=='HARDWARE'))
    throw new Error('SOURCE_NOT_HARDWARE');
  return { type:'sample', observedAt:new Date().toISOString(), elapsedMs:round(elapsedMs), pollMs:round(pollMs),
    device:{ lifecycle:safeState(device.lifecycleState), security:safeState(device.securityState),
      sensorConnected:bool(device.sensorConnected), speedValid:bool(device.speedValid), imuValid:bool(device.imuValid), gpsValid:bool(device.gpsValid),
      lastTelemetryAt:instant(device.lastTelemetryAt), lastSeenAt:instant(device.lastSeenAt) },
    reading:reading ? { id:safeId(reading.readingId), receivedAt:instant(reading.receivedAt), deviceUptimeS:finite(reading.deviceUptimeS),
      speedKmh:finite(reading.speedKmh), sensorConnected:bool(reading.sensorConnected), speedValid:bool(reading.speedValid),
      imuValid:bool(reading.imuValid), gpsValid:bool(reading.gpsValid), gpsAgeMs:finite(reading.gpsAgeMs), state:safeState(reading.state) } : null };
}

class Metrics {
  constructor(staleMs=5000) {
    this.staleMs=staleMs;this.samples=0;this.errors=0;this.errorCodes={};this.ids=new Set();this.polls=[];this.gaps=[];
    this.transitions=[];this.resets=[];this.firstElapsed=null;this.lastElapsed=null;this.lastNew=null;this.lastIdentity=null;
    this.lastUptime=null;this.uptimeReadings=0;this.lastPollStart=null;this.staleObservations=0;
    this.invalidSensorObservations=0;this.unknownSensorObservations=0;this.speedValidObservations=0;this.gpsValidObservations=0;this.lifecycle=null;this.cycles=[];
  }
  observe(s) {
    this.samples++;this.polls.push(s.pollMs);
    if (this.firstElapsed==null) this.firstElapsed=s.elapsedMs;
    const pollStart=s.pollStartedElapsedMs??s.elapsedMs;
    if (this.lastPollStart!=null) this.gaps.push(pollStart-this.lastPollStart);
    this.lastPollStart=pollStart;
    this.lastElapsed=s.elapsedMs;
    if (s.device.lifecycle!==this.lifecycle) {
      this.transitions.push({from:this.lifecycle,to:s.device.lifecycle,elapsedMs:s.elapsedMs});this.lifecycle=s.device.lifecycle;
    }
    const identity=s.reading?.id || s.reading?.receivedAt || null;
    if (identity && identity!==this.lastIdentity) {
      this.ids.add(identity);this.lastIdentity=identity;this.lastNew=s.elapsedMs;
      const uptime=s.reading.deviceUptimeS;
      if (uptime!=null && this.lastUptime!=null && uptime<this.lastUptime)
        this.resets.push({elapsedMs:s.elapsedMs,previousUptimeS:this.lastUptime,uptimeS:uptime});
      if (uptime!=null) {this.lastUptime=uptime;this.uptimeReadings++;}
    }
    const age=this.lastNew==null ? null : s.elapsedMs-this.lastNew;
    s.observedReadingUnchangedMs=round(age);
    s.observedReadingStale=age==null ? null : age>this.staleMs;
    if (s.observedReadingStale) this.staleObservations++;
    if (s.reading?.sensorConnected===false) this.invalidSensorObservations++;
    if (s.reading && s.reading.sensorConnected==null) this.unknownSensorObservations++;
    if (s.reading?.speedValid===true) this.speedValidObservations++;
    if (s.reading?.gpsValid===true) this.gpsValidObservations++;
    const cycle=this.cycles.at(-1);
    if (cycle && cycle.offlineObservedMs==null && cycle.restoreMarkerMs==null && this.lifecycle==='OFFLINE') {
      cycle.offlineObservedMs=s.elapsedMs;cycle.offlineAfterDisconnectMarkerMs=round(s.elapsedMs-cycle.disconnectMarkerMs);
    }
    if (cycle?.restoreMarkerMs!=null && cycle.recoveryObservedMs==null && this.lifecycle==='ACTIVE' &&
        identity && identity!==cycle.readingAtRestore) {
      cycle.recoveryObservedMs=s.elapsedMs;cycle.recoveryAfterRestoreMarkerMs=round(s.elapsedMs-cycle.restoreMarkerMs);
    }
    return s;
  }
  error(code) { this.errors++;this.errorCodes[code]=(this.errorCodes[code]||0)+1; }
  marker(kind, elapsedMs) {
    const cycle=this.cycles.at(-1);
    if (kind==='disconnect') {
      if (cycle && cycle.restoreMarkerMs==null) return false;
      this.cycles.push({disconnectMarkerMs:round(elapsedMs),offlineObservedMs:null,offlineAfterDisconnectMarkerMs:null,
        restoreMarkerMs:null,recoveryObservedMs:null,recoveryAfterRestoreMarkerMs:null,readingAtRestore:null});return true;
    }
    if (kind==='restore' && cycle && cycle.restoreMarkerMs==null) {
      cycle.restoreMarkerMs=round(elapsedMs);cycle.readingAtRestore=this.lastIdentity;return true;
    }
    return false;
  }
  summary(durationMs) {
    return { observedDurationMs:round(durationMs), successfulPolls:this.samples, failedPolls:this.errors,errorCodes:this.errorCodes,
      uniqueBackendReadings:this.ids.size,pollRoundTripMs:distribution(this.polls),successfulPollStartGapMs:distribution(this.gaps),
      unchangedReadingThresholdMs:this.staleMs,unchangedReadingStaleObservations:this.staleObservations,
      sensorDisconnectedObservations:this.invalidSensorObservations,sensorUnknownObservations:this.unknownSensorObservations,
      speedValidObservations:this.speedValidObservations,gpsValidObservations:this.gpsValidObservations,lifecycleTransitions:this.transitions,
      uptimeAvailableReadings:this.uptimeReadings,observedUptimeDecreases:this.resets,
      networkCycles:this.cycles.map(({readingAtRestore,...v})=>({...v,offlineThenRecoveryObserved:v.offlineObservedMs!=null&&v.recoveryObservedMs!=null})),
      newDataObserved:this.ids.size>=2 };
  }
}

class ApiError extends Error {
  constructor(code,status=null) {super(code);this.code=code;this.status=status;}
}

class ApiClient {
  constructor(baseUrl,email,password,timeout) {this.baseUrl=baseUrl;this.email=email;this.password=password;this.timeout=timeout;this.access=null;this.refresh=null;this.refreshing=null;}
  async raw(route,method='GET',body=null,authenticated=true) {
    let response;
    try {
      response=await fetch(this.baseUrl+'/api'+route,{method,signal:AbortSignal.timeout(this.timeout),redirect:'error',
        headers:{'Content-Type':'application/json',...(authenticated?{Authorization:'Bearer '+this.access}:{})},
        body:body==null?undefined:JSON.stringify(body)});
    } catch (e) {throw new ApiError(e.name==='TimeoutError' || e.name==='AbortError'?'REQUEST_TIMEOUT':'NETWORK_ERROR');}
    let envelope;try {envelope=await response.json();} catch {throw new ApiError('INVALID_JSON',response.status);}
    if (!response.ok || envelope.success===false) throw new ApiError('HTTP_'+response.status,response.status);
    return envelope.data;
  }
  async login() {
    const d=await this.raw('/auth/login','POST',{email:this.email,password:this.password},false);
    if (!d?.accessToken || !d?.refreshToken) throw new ApiError('INVALID_AUTH_RESPONSE');
    this.access=d.accessToken;this.refresh=d.refreshToken;this.password=null;
  }
  async refreshAccess() {
    if (!this.refreshing) this.refreshing=(async()=>{
      const d=await this.raw('/auth/refresh','POST',{refreshToken:this.refresh},false);
      if (!d?.accessToken) throw new ApiError('INVALID_REFRESH_RESPONSE');
      this.access=d.accessToken;if(d.refreshToken)this.refresh=d.refreshToken;
    })().finally(()=>{this.refreshing=null;});
    return this.refreshing;
  }
  async request(route,method='GET',body=null) {
    try {return await this.raw(route,method,body);} catch(e) {
      if (e.status!==401 || !this.refresh) throw e;
      await this.refreshAccess();return this.raw(route,method,body);
    }
  }
}

async function measureReset(api,deviceId,{timeout=30000,pollMs=250,isStopped=()=>false,now=()=>performance.now(),pause=sleep}={}) {
  const start=now();let created;
  try {created=await api.request('/devices/'+encodeURIComponent(deviceId)+'/command','POST',{type:'RESET_WHEEL_SESSION'});}
  catch(e){return {status:'REQUEST_FAILED',error:e.code||'REQUEST_ERROR',clientObservedMs:round(now()-start),cmdId:null,serverIssuedToAckMs:null};}
  const cmdId=safeId(created?.cmdId);
  if (!cmdId) return {status:'INVALID_COMMAND_RESPONSE',clientObservedMs:round(now()-start),cmdId:null,serverIssuedToAckMs:null};
  let final=created;
  while (final.status==='PENDING' && now()-start<timeout && !isStopped()) {
    await pause(pollMs);
    if (isStopped()) break;
    try {const list=await api.request('/devices/'+encodeURIComponent(deviceId)+'/commands');final=(Array.isArray(list)?list:[]).find(c=>c.cmdId===cmdId)||final;}
    catch(e){return {status:'OBSERVATION_FAILED',error:e.code||'REQUEST_ERROR',clientObservedMs:round(now()-start),cmdId,serverIssuedToAckMs:null};}
  }
  const terminal=['EXECUTED','REJECTED','TIMEOUT'].includes(final.status);
  const issued=Date.parse(final.issuedAt),ack=Date.parse(final.ackAt);
  return {status:terminal?final.status:isStopped()?'STOPPED':'OBSERVER_TIMEOUT',cmdId,
    clientObservedMs:round(now()-start),serverIssuedToAckMs:Number.isFinite(issued)&&Number.isFinite(ack)&&ack>=issued?ack-issued:null};
}

function help() { console.log(`Usage: node tests/manual/measure-demo.cjs [options]
  --base-url http://127.0.0.1:8082  Backend origin (no credentials in URL)
  --device ID_OR_UUID             Required when more than one HARDWARE device
  --duration 60                   Observation seconds; use 1800 for 30 minutes
  --interval-ms 1000              Minimum polling interval (default 1000)
  --timeout-ms 8000               Per-request timeout
  --stale-ms 5000                 Flag an unchanged backend reading after this interval
  --measure-reset                Explicitly reset wheel RAM statistics FIVE times; no GPIO commands
  --command-timeout-ms 30000      Maximum observer wait for each reset command
  --out .local/evidence/NAME      Private output directory only
Credentials: GUARDIAN_EMAIL (default owner@guardian.iot), GUARDIAN_PASSWORD or DEMO_PASSWORD.
Interactive terminal: o = disconnect marker, r = restore marker, q = finish (single key).
Default performs only authentication and GETs. No credentials, emails or GPS coordinates are saved.
Output is measurement evidence, not automatic physical-device acceptance.`); }

async function main(args=process.argv.slice(2)) {
  const o=parseOptions(args);if(o.help){help();return 0;}
  const password=process.env.GUARDIAN_PASSWORD||process.env.DEMO_PASSWORD;
  const email=process.env.GUARDIAN_EMAIL||'owner@guardian.iot';
  if (!password) throw new Error('Set GUARDIAN_PASSWORD or DEMO_PASSWORD in the process environment; do not pass it on the command line');
  const api=new ApiClient(o.baseUrl,email,password,o.timeout);await api.login();
  const devices=await api.request('/devices');
  const hardware=(Array.isArray(devices)?devices:[]).filter(d=>d.dataSource==='HARDWARE');
  const device=o.device?hardware.find(d=>d.deviceId===o.device||d.deviceUuid===o.device):hardware.length===1?hardware[0]:null;
  if (!device || !safeId(device.deviceId)) throw new Error('Select one accessible HARDWARE device using --device; SIMULATED devices are refused');
  const evidenceRoot=path.join(ROOT,'.local/evidence');
  const output=path.resolve(ROOT,o.out||path.join('.local/evidence','demo-'+new Date().toISOString().replace(/[:.]/g,'-')));
  if (output===evidenceRoot || !output.startsWith(evidenceRoot+path.sep)) throw new Error('Output must be a new subdirectory under .local/evidence/');
  if (fs.existsSync(output)) throw new Error('Output directory already exists; choose a new one to preserve evidence');
  fs.mkdirSync(output,{recursive:true,mode:0o700});
  const rawPath=path.join(output,'observations.jsonl'),summaryPath=path.join(output,'summary.json');
  const fd=fs.openSync(rawPath,'wx',0o600);
  const write=v=>fs.writeSync(fd,JSON.stringify(v)+'\n');
  const startedAt=new Date().toISOString(),start=performance.now(),elapsed=()=>performance.now()-start;
  const metrics=new Metrics(o.staleMs);let stopped=false,stopReason='DURATION',lastPrint=-10000,wasRaw=false,resetResults=[];
  const stop=reason=>{stopped=true;stopReason=reason;};
  const mark=kind=>{const at=elapsed();if(metrics.marker(kind,at)){write({type:'manual-marker',kind,elapsedMs:round(at)});console.log('Marker recorded: '+kind);}};
  const onData=data=>{for(const c of data.toString().toLowerCase()){if(c==='o')mark('disconnect');if(c==='r')mark('restore');if(c==='q'||c==='\u0003')stop('OPERATOR');}};
  const onSignal=()=>stop('SIGNAL');process.once('SIGINT',onSignal);process.once('SIGTERM',onSignal);
  if(process.stdin.isTTY){wasRaw=!!process.stdin.isRaw;process.stdin.setRawMode(true);process.stdin.resume();process.stdin.on('data',onData);}
  write({type:'method',source:'HARDWARE',startedAt,deviceId:device.deviceId,deviceUuid:safeId(device.deviceUuid),
    reportedFirmwareVersion:safeId(device.firmwareVersion),reportedHardwareVersion:safeId(device.hwVersion),durationRequestedS:o.duration,
    intervalMs:o.interval,requestTimeoutMs:o.timeout,staleMs:o.staleMs,resetTrialsRequested:o.measureReset?5:0,
    privacy:'Allowlisted projections only: no email, credentials, tokens, names, plate or coordinates.',
    latencyScope:'REST round-trip and optional client command-to-observed-terminal / server issuedAt-to-ackAt; NOT sensor-to-screen latency.'});
  console.log('Observing HARDWARE-labelled device. Raw evidence stays in .local/evidence. Keys: o / r / q.');
  if(o.measureReset)console.log('Explicit mode: wheel RAM statistics will be reset five times; no relay/siren/reboot commands.');
  let resetTask=null;
  try {
    while(!stopped && elapsed()<o.duration*1000) {
      const pollStart=elapsed();
      try {
        const [d,t]=await Promise.all([api.request('/devices/'+encodeURIComponent(device.deviceId)),api.request('/devices/'+encodeURIComponent(device.deviceId)+'/telemetry/latest').catch(e=>e.status===404?null:Promise.reject(e))]);
        const sample=sanitizeSnapshot(d,t,elapsed(),elapsed()-pollStart);
        sample.pollStartedElapsedMs=round(pollStart);metrics.observe(sample);write(sample);
        if(o.measureReset && !resetTask && t && t.sensorConnected===true){
          resetTask=(async()=>{for(let i=0;i<5&&!stopped;i++){
            const result=await measureReset(api,device.deviceId,{timeout:o.commandTimeout,isStopped:()=>stopped});
            resetResults.push({trial:i+1,...result});write({type:'reset-measurement',trial:i+1,...result});
            if(i<4&&!stopped)await sleep(500);
          }})();
        }
      } catch(e) {
        const code=e.code||(e.message==='SOURCE_NOT_HARDWARE'?'SOURCE_NOT_HARDWARE':'OBSERVATION_ERROR');
        metrics.error(code);write({type:'poll-error',elapsedMs:round(elapsed()),code,status:e.status||null});
        if(code==='SOURCE_NOT_HARDWARE')stop('SOURCE_CHANGED');
      }
      if(elapsed()-lastPrint>=10000){lastPrint=elapsed();console.log(`Elapsed ${Math.floor(elapsed()/1000)} s; polls ${metrics.samples}; new readings ${metrics.ids.size}; errors ${metrics.errors}; lifecycle ${metrics.lifecycle||'UNKNOWN'}`);}
      if(!stopped)await sleep(Math.max(0,o.interval-(elapsed()-pollStart)));
    }
  } finally {
    stopped=true;if(resetTask)await resetTask;
    if(process.stdin.isTTY){process.stdin.off('data',onData);process.stdin.setRawMode(wasRaw);process.stdin.pause();}
    process.removeListener('SIGINT',onSignal);process.removeListener('SIGTERM',onSignal);
    const result={schemaVersion:1,startedAt,endedAt:new Date().toISOString(),stopReason,source:'HARDWARE',
      requestedDurationS:o.duration,pollIntervalMs:o.interval,...metrics.summary(elapsed()),
      resetCommands:{requested:o.measureReset?5:0,completed:resetResults.length,results:resetResults,
        executedClientObservedMs:distribution(resetResults.filter(r=>r.status==='EXECUTED').map(r=>r.clientObservedMs)),
        executedServerIssuedToAckMs:distribution(resetResults.filter(r=>r.status==='EXECUTED').map(r=>r.serverIssuedToAckMs))},
      limitations:[
        'HARDWARE is the backend source label; the operator must separately confirm a physical board supplies it.',
        'Polling observes latest readings, not every MQTT packet; no packet-loss rate can be derived from these counts.',
        'Unchanged-reading age starts at first observation and uses the collector monotonic clock; it is not sensor age.',
        'Uptime decreases can indicate reboot or counter rollover; this tool cannot prove the electrical cause.',
        'Manual markers follow operator keypresses; timing includes human reaction, polling interval and request delay.',
        'No unsynchronized device/server clocks are subtracted; sensor-to-dashboard latency is not measured.',
        'No command trial is automatically a GPIO/relay acceptance test; RESET_WHEEL_SESSION changes RAM statistics only.'
      ]};
    write({type:'end',elapsedMs:round(elapsed()),stopReason});fs.closeSync(fd);
    fs.writeFileSync(summaryPath,JSON.stringify(result,null,2)+'\n',{mode:0o600});
    console.log('Saved: '+path.relative(ROOT,output));console.log(`Unique readings: ${result.uniqueBackendReadings}; uptime decreases: ${result.observedUptimeDecreases.length}; errors: ${result.failedPolls}`);
  }
  return metrics.ids.size>=2 && stopReason!=='SOURCE_CHANGED'?0:2;
}

module.exports={distribution,parseOptions,sanitizeSnapshot,Metrics,ApiClient,ApiError,measureReset,main};
if(require.main===module)main().then(code=>{process.exitCode=code;}).catch(e=>{console.error('Measurement stopped: '+(e instanceof ApiError?e.code:e.message));process.exitCode=1;});
