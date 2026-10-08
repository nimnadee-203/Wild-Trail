jest.mock('../src/services/incidentPhoto', () => ({ readIncidentPhoto: jest.fn() }));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
const { readIncidentPhoto } = require('../src/services/incidentPhoto');
const { fetch: uploadFetch } = require('expo/fetch');
const { uploadIncidentPhoto } = require('../src/services/cloudinary');
beforeEach(() => {
  readIncidentPhoto.mockResolvedValue({ data: 'photo-data', size: 10 });
  uploadFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ secure_url: 'https://photos.example/1' }),
  });
});
test('UC2/UC4 uploads photo and accepts HTTPS URL', async () => {
  expect(await uploadIncidentPhoto('local')).toBe('https://photos.example/1');
  expect(readIncidentPhoto).toHaveBeenCalledWith('local');
  expect(uploadFetch).toHaveBeenCalledWith(
    expect.stringContaining('cloudinary.com'),
    expect.objectContaining({ method: 'POST', signal: expect.anything() }),
  );
});
test.each([0, 10 * 1024 * 1024, 10 * 1024 * 1024 + 1])(
  'UC2/UC4 rejects photo size %s before upload',
  async (size) => {
    readIncidentPhoto.mockResolvedValue({ data: 'photo', size });
    await expect(uploadIncidentPhoto('local')).rejects.toThrow(
      size === 0 ? 'empty' : 'smaller than 10 MB',
    );
    expect(uploadFetch).not.toHaveBeenCalled();
  },
);
test.each([undefined, 12, 'http://unsafe'])(
  'UC2/UC4 rejects invalid storage URL %#',
  async (secure_url) => {
    uploadFetch.mockResolvedValue({ ok: true, json: async () => ({ secure_url }) });
    await expect(uploadIncidentPhoto('local')).rejects.toThrow('valid photo URL');
  },
);
test.each([{ error: { message: 'Rejected' } }, {}])(
  'UC2/UC4 returns upload server error %#',
  async (body) => {
    uploadFetch.mockResolvedValue({ ok: false, status: 400, json: async () => body });
    await expect(uploadIncidentPhoto('local')).rejects.toThrow(body.error?.message || 'HTTP 400');
  },
);
test('UC2/UC4 timeout aborts upload and clears timer', async () => {
  jest.useFakeTimers();
  uploadFetch.mockImplementation(
    (url, { signal }) =>
      new Promise((resolve, reject) =>
        signal.addEventListener('abort', () => reject(new Error('aborted'))),
      ),
  );
  const pending = uploadIncidentPhoto('local');
  const assertion = expect(pending).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(60000);
  await assertion;
  expect(jest.getTimerCount()).toBe(0);
});
test('UC2/UC4 read failure propagates without upload', async () => {
  readIncidentPhoto.mockRejectedValueOnce(new Error('missing file'));
  await expect(uploadIncidentPhoto('local')).rejects.toThrow('missing file');
  expect(uploadFetch).not.toHaveBeenCalled();
});
