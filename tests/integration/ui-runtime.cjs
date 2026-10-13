const fs = require('fs'), crypto = require('crypto'), {spawn} = require('child_process');
process.chdir(require('path').resolve(__dirname, '../..'));
const root = process.cwd();
const demoPassword = crypto.randomBytes(24).toString('base64url');
fs.writeFileSync('.ui-credentials.tmp', JSON.stringify({demoPassword}));
const env = {...process.env, JWT_SECRET: crypto.randomBytes(48).toString('base64'), DEMO_PASSWORD: demoPassword,
  DEMO_SEED_ENABLED: 'true', MQTT_ENABLED:'false', SPRING_PROFILES_ACTIVE:'h2',
  CORS_ALLOWED_ORIGINS:'http://localhost:15173,http://127.0.0.1:15173', BACKEND_URL:'http://127.0.0.1:18080'};
Object.assign(env, { SPRING_DATASOURCE_URL:'jdbc:h2:mem:ui_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL', SPRING_DATASOURCE_DRIVER:'org.h2.Driver',
  SPRING_DATASOURCE_USERNAME:'sa',SPRING_DATASOURCE_PASSWORD:'',SPRING_JPA_DIALECT:'org.hibernate.dialect.H2Dialect',LOGGING_LEVEL_ROOT:'INFO',SPRING_JPA_SHOW_SQL:'false' });
const backendLog = fs.openSync('backend/target/ui-runtime.log','w');
const java = spawn('java', ['-jar','backend/target/smart-motorbike-guardian-backend-1.0.0.jar','--server.port=18080','--server.address=127.0.0.1'], {env, cwd:root, stdio:['ignore',backendLog,backendLog], windowsHide:true});
const frontendLog = fs.openSync('frontend/ui-runtime.log','w');
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--port','15173','--host','127.0.0.1'], {env, cwd:root+'/frontend', stdio:['ignore',frontendLog,frontendLog], windowsHide:true});
fs.writeFileSync('.ui-pids.tmp', JSON.stringify({backend:java.pid,frontend:vite.pid}));
console.log('Local UI test services starting at 127.0.0.1:15173 and 127.0.0.1:18080');
function close() { java.kill(); vite.kill(); fs.rmSync('.ui-credentials.tmp',{force:true}); fs.rmSync('.ui-pids.tmp',{force:true}); process.exit(); }
process.on('SIGINT',close);process.on('SIGTERM',close);
