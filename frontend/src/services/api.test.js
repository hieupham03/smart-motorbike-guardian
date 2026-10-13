import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from './api.js';
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, headers: { get: () => 'application/json' }, json: async () => data });
function setup() {
  const values = new Map([['accessToken','old'],['refreshToken','renew'],['currentUser','user']]);
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) };
  globalThis.window = { dispatchEvent: () => {} };
  return values;
}
test('a rejected retry after token refresh still throws an HTTP error', async () => {
  setup();
  const responses = [response(401,{}),response(200,{data:{accessToken:'new',refreshToken:'renew'}}),response(403,{message:'Forbidden'})];
  globalThis.fetch = async () => responses.shift();
  await assert.rejects(request('/devices/x/command'), e => e.status === 403 && e.message === 'Forbidden');
});
test('network outage during refresh keeps the session for reconnect', async () => {
  const values = setup(); let calls = 0;
  globalThis.fetch = async () => { if (++calls === 1) return response(401,{}); throw new TypeError('offline'); };
  await assert.rejects(request('/devices'), /offline/);
  assert.equal(values.get('refreshToken'), 'renew'); assert.equal(values.get('currentUser'), 'user');
});
test('invalid refresh credentials clear only authentication state', async () => {
  const values = setup(); values.set('preference','keep');
  globalThis.fetch = async () => response(401,{message:'Expired'});
  await assert.rejects(request('/devices'), e => e.status === 401);
  assert.equal(values.get('accessToken'),undefined); assert.equal(values.get('preference'),'keep');
});
