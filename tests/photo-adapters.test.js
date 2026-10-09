jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Directory: jest.fn(),
  Paths: { document: 'documents' },
}));
const { File, Directory } = require('expo-file-system');
const nativeRead = require('../src/services/incidentPhoto.native.ts').readIncidentPhoto;
const nativeRetain = require('../src/services/communityPhoto.native.ts').retainCommunityPhoto;
const webRead = require('../src/services/incidentPhoto.ts').readIncidentPhoto;
const webRetain = require('../src/services/communityPhoto.ts').retainCommunityPhoto;
test.each(['image/png', ''])(
  'UC2 native photo reader returns file and content type %s',
  async (type) => {
    const file = { exists: true, size: 5, type };
    File.mockImplementation(() => file);
    expect(await nativeRead('local')).toEqual({
      data: file,
      size: 5,
      contentType: type || 'image/jpeg',
    });
  },
);
test.each([
  { exists: false, size: 5 },
  { exists: true, size: 10 * 1024 * 1024 },
])('UC2 native reader rejects missing or oversized file %#', async (file) => {
  File.mockImplementation(() => file);
  await expect(nativeRead('local')).rejects.toThrow();
});
test.each(['.png', ''])(
  'UC4 native retention copies to durable document folder %s',
  async (extension) => {
    const folder = { create: jest.fn() },
      copy = jest.fn();
    Directory.mockImplementation(() => folder);
    File.mockImplementationOnce(() => ({
      exists: true,
      size: 5,
      extension,
      copy,
    })).mockImplementationOnce(() => ({ uri: 'durable' }));
    expect(await nativeRetain('temp', 'report', 0)).toBe('durable');
    expect(File).toHaveBeenLastCalledWith(folder, `report-0${extension || '.jpg'}`);
    expect(copy).toHaveBeenCalledWith({ uri: 'durable' });
  },
);
test.each([
  { exists: false, size: 5 },
  { exists: true, size: 0 },
  { exists: true, size: 10 * 1024 * 1024 },
])('UC4 native retention rejects unreadable or oversized photo %#', async (file) => {
  Directory.mockImplementation(() => ({ create: jest.fn() }));
  File.mockImplementation(() => file);
  await expect(nativeRetain('temp', 'r', 0)).rejects.toThrow();
});
test.each(['image/png', ''])(
  'UC2 browser reader returns blob and content type %s',
  async (type) => {
    const blob = { size: 4, type };
    global.fetch.mockResolvedValue({ ok: true, blob: async () => blob });
    expect(await webRead('blob:photo')).toEqual({
      data: blob,
      size: 4,
      contentType: type || 'image/jpeg',
    });
  },
);
test('UC2 browser reader rejects failed local fetch', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 404 });
  await expect(webRead('blob:photo')).rejects.toThrow('HTTP 404');
});
test.each([0, 10 * 1024 * 1024])('UC4 browser retention rejects photo size %s', async (size) => {
  global.fetch.mockResolvedValue({ ok: true, blob: async () => ({ size }) });
  await expect(webRetain('blob:r', 'r', 0)).rejects.toThrow('smaller than 10 MB');
});
test('UC4 browser retention rejects local fetch failure', async () => {
  global.fetch.mockResolvedValue({ ok: false });
  await expect(webRetain('blob:r', 'r', 0)).rejects.toThrow('Unable to save');
});
test.each([false, true])('UC4 browser FileReader completion/error %s', async (failure) => {
  global.fetch.mockResolvedValue({ ok: true, blob: async () => ({ size: 4 }) });
  const original = global.FileReader;
  global.FileReader = class {
    readAsDataURL() {
      this.result = 'data:image/png;base64,photo';
      if (failure) this.onerror();
      else this.onload();
    }
  };
  try {
    if (failure) await expect(webRetain('blob:r', 'r', 0)).rejects.toThrow('Unable to retain');
    else expect(await webRetain('blob:r', 'r', 0)).toBe('data:image/png;base64,photo');
  } finally {
    global.FileReader = original;
  }
});
