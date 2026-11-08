import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpeedLimit } from './speedLimit.js';
test('accepts decimal thresholds in Vietnamese notation and rejects empty/coerced/out-of-range values', () => {
  for (const [text, expected] of [['1',1],['120',120],[' 5,5 ',5.5],['2.5',2.5],['',null],[' ',null],['0',null],['121',null],['1e1',null],['0x10',null],['NaN',null],['5km/h',null]])
    assert.equal(parseSpeedLimit(text),expected);
});
