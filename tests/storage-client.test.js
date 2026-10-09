const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { storageService: storage } = require('../src/storage/asyncStorage');
const { apiFetch } = require('../src/services/api/client');
beforeEach(() => {
  AsyncStorage.getItem.mockResolvedValue(null);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
test('shared storage reads missing and serialized values', async () => {
  expect(await storage.getItem('key')).toBeNull();
  AsyncStorage.getItem.mockResolvedValueOnce('{"a":1}');
  expect(await storage.getItem('key')).toEqual({ a: 1 });
});
test('shared storage handles corrupt JSON and read errors', async () => {
  AsyncStorage.getItem.mockResolvedValueOnce('bad');
  expect(await storage.getItem('key')).toBeNull();
  AsyncStorage.getItem.mockRejectedValueOnce(new Error('disk'));
  expect(await storage.getItem('key')).toBeNull();
});
test.each(['setItem', 'removeItem', 'clearAll'])(
  'shared storage %s returns true on success and false on device error',
  async (method) => {
    const dependency = method === 'clearAll' ? 'clear' : method;
    AsyncStorage[dependency].mockResolvedValueOnce();
    expect(await storage[method]('key', { a: 1 })).toBe(true);
    AsyncStorage[dependency].mockRejectedValueOnce(new Error('disk'));
    expect(await storage[method]('key', { a: 1 })).toBe(false);
  },
);
test('shared API merges headers and auth token', async () => {
  AsyncStorage.getItem.mockResolvedValueOnce('"token"');
  global.fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'a' }) });
  expect(await apiFetch('/incidents', { headers: { 'X-Test': 'yes' } })).toEqual({
    data: { id: 'a' },
    error: null,
    status: 201,
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/incidents'),
    expect.objectContaining({
      headers: {
        'Content-Type': 'application/json',
        'X-Test': 'yes',
        Authorization: 'Bearer token',
      },
    }),
  );
});
test.each([{ message: 'denied' }, {}])(
  'shared API handles unsuccessful HTTP response %#',
  async (body) => {
    global.fetch.mockResolvedValue({ ok: false, status: 403, json: async () => body });
    expect(await apiFetch('/alerts')).toEqual({
      data: null,
      status: 403,
      error: body.message || 'API request failed',
    });
  },
);
test.each([new Error('offline'), {}])('shared API handles network errors %#', async (error) => {
  global.fetch.mockRejectedValue(error);
  expect(await apiFetch('/alerts')).toEqual({
    data: null,
    status: 0,
    error: error.message || 'Network request failed',
  });
});
