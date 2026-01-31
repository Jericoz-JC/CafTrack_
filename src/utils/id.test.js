import { createClientId } from './id';

describe('id utils', () => {
  test('createClientId returns a non-empty string', () => {
    const id = createClientId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
