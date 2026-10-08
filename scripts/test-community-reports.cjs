const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

let storage = null;
const otherStorage = new Map();
let nextId = 0;
let failUpload = true;
let uploads = 0;
const records = new Map();
const auth = { currentUser: { uid: 'resident' }, authStateReady: async () => {} };
const firestore = {
  collection: () => ({}),
  doc: (_db, _collection, id) => ({ id: id || `report-${++nextId}` }),
  serverTimestamp: () => 'server-time',
  getDoc: async (ref) => ({ data: () => records.get(ref.id) || { role: 'ranger', accountStatus: 'ACTIVE', name: 'Ranger A' } }),
  runTransaction: async (_db, work) => work({
    get: async (ref) => ({ exists: () => records.has(ref.id), data: () => records.get(ref.id) }),
    set: (ref, data) => records.set(ref.id, { ...data }),
    update: (ref, data) => records.set(ref.id, { ...records.get(ref.id), ...data }),
  }),
  updateDoc: async (ref, data) => records.set(ref.id, { ...records.get(ref.id), ...data }),
};
const modules = {
  '@react-native-async-storage/async-storage': {
    getItem: async (key) => key === '@wildtrail_community_queue_v1' ? storage : otherStorage.get(key) || null,
    setItem: async (key, value) => { if (key === '@wildtrail_community_queue_v1') storage = value; else otherStorage.set(key, value); },
  },
  '../storage/keys': { STORAGE_KEYS: { USER_PROFILE: '@wildlife_user_profile' } },
  'firebase/firestore': firestore,
  './firebase': { auth, db: {} },
  './incidentReporter': { getIncidentReporter: async () => auth.currentUser },
  './cloudinary': { uploadIncidentPhoto: async () => { uploads++; if (failUpload) throw new Error('Offline'); return 'https://photos.example/photo.jpg'; } },
  './communityPhoto': { retainCommunityPhoto: async (uri) => `retained:${uri}` },
};
const communityTypes = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/types/community.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: communityTypes });
modules['../types/community'] = communityTypes;
const source = ts.transpileModule(fs.readFileSync('src/services/communityReports.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(source, { exports: exportsObject, require: (name) => {
  assert.ok(modules[name], `Unexpected dependency ${name}`);
  return modules[name];
} });

(async () => {
  const api = exportsObject;
  assert.throws(() => api.parseCommunitySms('ELEPHANT | missing fields', ''), /Use a keyword/);
  for (const keyword of ['LIVESTOCK', 'PROPERTY', 'INJURY', 'OTHER']) {
    const parsed = api.parseCommunitySms(`${keyword} | Village | East | Gate | Details`, '');
    assert.equal(communityTypes.COMMUNITY_REPORT_TYPES[parsed.kind].keyword, keyword);
    api.validateCommunityInput(parsed);
  }
  const input = api.parseCommunitySms('crop | Village | East | Gate | Damaged crops', '123');
  assert.equal(input.kind, 'crop_raiding');
  assert.equal(input.source, 'sms_simulated');
  input.source = 'community_app';
  const queued = await api.queueCommunityReport(input, ['camera-photo']);
  assert.equal(records.size, 0, 'Save locally before accessing the backend');
  assert.equal((await api.getCommunityQueue())[0].localPhotos[0], 'retained:camera-photo');
  await Promise.all([api.syncCommunityReports(), api.syncCommunityReports()]);
  assert.equal(records.size, 1);
  assert.equal(uploads, 1, 'Concurrent sync calls share one operation');
  assert.equal((await api.getCommunityQueue())[0].received, true);
  assert.equal((await api.getCommunityQueue())[0].complete, false);
  await api.respondToCommunityReport(queued.id, 'investigating', 'On the way');
  failUpload = false;
  await api.syncCommunityReports();
  const delivered = records.get(queued.id);
  assert.equal(delivered.status, 'investigating', 'Photo retry must preserve staff status');
  assert.equal(delivered.responseNotes, 'On the way');
  assert.equal(delivered.photoUris.length, 1);
  assert.equal((await api.getCommunityQueue())[0].complete, true);
  await api.syncCommunityReports();
  assert.equal(records.size, 1, 'Retry must not duplicate the report');
  assert.equal(uploads, 2, 'Completed photos must not be uploaded again');
  const second = await api.queueCommunityReport(input, []);
  auth.currentUser = { uid: 'another-user' };
  await api.syncCommunityReports();
  assert.equal(records.has(second.id), false, 'Reports bound to another account must not be delivered');
  auth.currentUser = { uid: 'resident' };
  await api.syncCommunityReports();
  auth.currentUser = { uid: 'officer', getIdTokenResult: async () => ({ claims: {} }) };
  await api.acceptCommunityOperation(second.id);
  assert.equal(records.get(second.id).assignedTo, 'officer');
  assert.equal(records.get(second.id).assignedName, 'Ranger A');
  assert.equal(records.get(second.id).status, 'investigating');
  await assert.rejects(api.acceptCommunityOperation(second.id), /already been accepted/);
  await api.respondToCommunityReport(second.id, 'resolved', 'Completed');
  assert.equal(records.get(second.id).assignedTo, 'officer', 'Response edits preserve acceptance');
  auth.currentUser = { uid: 'anonymous', isAnonymous: true };
  await assert.rejects(api.acceptCommunityOperation(second.id), /Sign in/);
  records.set('demo-report', { reporterType: 'community', assignedTo: '', status: 'pending' });
  otherStorage.set('@wildlife_user_profile', JSON.stringify({ uid: 'usr-ranger-204', role: 'ranger', email: 'nimal@wildguard.org', name: 'Nimal Perera', accountStatus: 'ACTIVE' }));
  await api.acceptCommunityOperation('demo-report');
  assert.equal(records.get('demo-report').assignedTo, '', 'Demo acceptance must not alter shared assignments');
  await api.respondToCommunityReport('demo-report', 'resolved', 'Demo response');
  const demoResponses = JSON.parse(otherStorage.get('@wildtrail_demo_community_responses_v1'));
  assert.equal(demoResponses['demo-report'].assignedName, 'Nimal Perera');
  assert.equal(demoResponses['demo-report'].status, 'resolved');
  await assert.rejects(api.acceptCommunityOperation('demo-report'), /already been accepted/);
  console.log('Community parser, local queue, retry, status preservation and ownership checks passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
