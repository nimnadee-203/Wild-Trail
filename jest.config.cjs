module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/services/api/{patrols,incidents,alerts,offlineSync,client}.ts',
    'src/services/{communityReports,managerAlerts,scheduledPatrols,cloudinary,incidentReporter,incidentPhoto,incidentPhoto.native,communityPhoto,communityPhoto.native}.ts',
    'src/hooks/useLocation.ts',
    'src/storage/asyncStorage.ts',
    'src/app/\\(ranger\\)/{patrol,report-incident}.tsx',
    'src/app/\\(ranger\\)/alerts/*.tsx',
    'src/app/{community-report,community-operations}.tsx',
    'src/components/CommunityOperationsScreen.tsx',
    'src/app/\\(manager\\)/{alerts,monitoring,patrols,incidents,community-reports}.tsx',
  ],
  coverageReporters: ['text', 'html', 'json', 'json-summary'],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  clearMocks: true,
};
