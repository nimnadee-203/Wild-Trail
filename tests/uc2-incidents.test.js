jest.mock('../src/services/incidentReporter', () => ({
  getIncidentReporter: jest.fn(),
  DEFAULT_INCIDENT_RANGER: { name: 'Ranger Nimal', badgeNumber: 'RANGER-409' },
}));
jest.mock('../src/services/cloudinary', () => ({ uploadIncidentPhoto: jest.fn() }));
const fs = require('firebase/firestore');
const { getIncidentReporter } = require('../src/services/incidentReporter');
const { uploadIncidentPhoto } = require('../src/services/cloudinary');
const {
  createIncident,
  getRangerIncidents,
  getFirebaseIncidents,
  incidentApiService,
} = require('../src/services/api/incidents');
const input = {
  category: 'poaching',
  title: ' Snare ',
  description: ' Wire found ',
  location: { latitude: 6, longitude: 81 },
};
beforeEach(() => {
  getIncidentReporter.mockResolvedValue({ uid: 'ranger', isAnonymous: false });
  fs.addDoc.mockResolvedValue({ id: 'incident-1' });
  fs.updateDoc.mockResolvedValue();
  uploadIncidentPhoto.mockResolvedValue('https://photos.example/1');
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
test('UC2 creates trimmed pending incident preserving category and GPS', async () => {
  expect(await createIncident(input)).toMatchObject({
    id: 'incident-1',
    reporterId: 'ranger',
    category: 'poaching',
    title: 'Snare',
    description: 'Wire found',
    severity: 'medium',
    status: 'pending',
    location: input.location,
    photoUris: [],
  });
  expect(fs.addDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      description: 'Wire found',
      status: 'pending',
      location: input.location,
    }),
  );
});
test.each(['', '  ', '\n'])(
  'UC2 rejects empty description %# before contacting database',
  async (description) => {
    await expect(createIncident({ ...input, description })).rejects.toThrow(
      'description is required',
    );
    expect(fs.addDoc).not.toHaveBeenCalled();
    expect(getIncidentReporter).not.toHaveBeenCalled();
  },
);
test('UC2 anonymous identity adds demo reporter details and respects severity', async () => {
  getIncidentReporter.mockResolvedValue({ uid: 'anon', isAnonymous: true });
  expect(await createIncident({ ...input, severity: 'high' })).toMatchObject({
    reporterName: 'Ranger Nimal',
    reporterBadgeNumber: 'RANGER-409',
    severity: 'high',
  });
});
test('UC2 attaches successfully uploaded photos', async () => {
  expect((await createIncident({ ...input, photoUris: ['local'] })).photoUris).toEqual([
    'https://photos.example/1',
  ]);
  expect(uploadIncidentPhoto).toHaveBeenCalledWith('local');
  expect(fs.updateDoc).toHaveBeenCalledWith(
    { id: 'incident-1' },
    expect.objectContaining({ photoUris: ['https://photos.example/1'] }),
  );
});
test.each([new Error('upload failed'), 'unknown'])(
  'UC2 keeps incident and successful photos when one upload fails %#',
  async (error) => {
    uploadIncidentPhoto
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('https://photos.example/2');
    const result = await createIncident({ ...input, photoUris: ['bad', 'good'] });
    expect(result.photoUris).toEqual(['https://photos.example/2']);
    expect(result.photoWarning).toContain('1 of 2 photos attached');
  },
);
test('UC2 reports link persistence failure without claiming uploaded photos were attached', async () => {
  fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
  const result = await createIncident({ ...input, photoUris: ['local'] });
  expect(result.photoUris).toEqual([]);
  expect(result.photoWarning).toContain('links could not be saved');
});
test.each(['identity', 'database'])('UC2 propagates %s failure', async (dependency) => {
  (dependency === 'identity' ? getIncidentReporter : fs.addDoc).mockRejectedValueOnce(
    new Error('denied'),
  );
  await expect(createIncident(input)).rejects.toThrow('denied');
  expect(uploadIncidentPhoto).not.toHaveBeenCalled();
});
test('UC2 personal history converts dates and sorts newest first', async () => {
  const old = new Date('2026-01-01');
  fs.getDocs.mockResolvedValue({
    docs: [
      { id: 'old', data: () => ({ createdAt: new fs.Timestamp(old), updatedAt: old }) },
      { id: 'new', data: () => ({ createdAt: '2026-02-01', updatedAt: null }) },
    ],
  });
  const reports = await getRangerIncidents();
  expect(reports.map((r) => r.id)).toEqual(['new', 'old']);
  expect(reports[1].createdAt).toBe(old.toISOString());
  expect(fs.where).toHaveBeenCalledWith('reporterId', '==', 'ranger');
});
test('UC2 manager query never substitutes personal history on permission failure', async () => {
  fs.getDocs.mockRejectedValueOnce(new Error('permission denied'));
  await expect(getFirebaseIncidents()).rejects.toThrow('permission denied');
  expect(fs.getDocs).toHaveBeenCalledTimes(1);
});
test('UC2 manager query maps timestamps', async () => {
  fs.getDocs.mockResolvedValue({
    docs: [{ id: 'a', data: () => ({ createdAt: '2026-01-01', updatedAt: '2026-01-02' }) }],
  });
  expect(await getFirebaseIncidents()).toEqual([
    expect.objectContaining({ id: 'a', updatedAt: '2026-01-02' }),
  ]);
});
test('UC2 legacy API sends incident/conflict payloads and history filter', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'a' }) });
  await incidentApiService.getIncidents();
  await incidentApiService.createIncidentReport(input);
  await incidentApiService.createConflictReport({ description: 'damage' });
  await incidentApiService.getConflictHistory('resident');
  await incidentApiService.getConflictHistory();
  expect(global.fetch.mock.calls.map((call) => call[0])).toEqual(
    expect.arrayContaining([
      expect.stringContaining('/incidents'),
      expect.stringContaining('/conflicts?reporterId=resident'),
    ]),
  );
  expect(global.fetch.mock.calls[1][1]).toMatchObject({
    method: 'POST',
    body: JSON.stringify(input),
  });
});
