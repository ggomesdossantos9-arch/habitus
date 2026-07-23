import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenStore } from '../src/services/tokenStore.js';

test('access token permanece somente em memória', () => {
  tokenStore.set('access-token');
  assert.equal(tokenStore.get(), 'access-token');
  tokenStore.clear();
  assert.equal(tokenStore.get(), null);
});
