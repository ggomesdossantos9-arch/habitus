import test from 'node:test';
import assert from 'node:assert/strict';
import { notifySessionExpired, subscribeSessionExpired } from '../src/services/sessionEvents.js';

test('notifica e permite cancelar a escuta da expiração de sessão', () => {
  let notifications = 0;
  const unsubscribe = subscribeSessionExpired(() => { notifications += 1; });
  notifySessionExpired();
  unsubscribe();
  notifySessionExpired();
  assert.equal(notifications, 1);
});
