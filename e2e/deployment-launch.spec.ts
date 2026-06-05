import { test, expect } from './fixtures';

test.describe('Deployment launch validation', () => {
  test('public setup status and version endpoints', async ({ request }) => {
    const status = await request.get('/api/v1/deploy/setup-status');
    expect(status.ok()).toBeTruthy();
    const statusJson = await status.json();
    expect(statusJson.data).toHaveProperty('needsSetup');

    const version = await request.get('/api/v1/deploy/version');
    expect(version.ok()).toBeTruthy();
    const versionJson = await version.json();
    expect(versionJson.data).toHaveProperty('packageVersion');
  });

  test('health endpoint reports database', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty('database');
  });
});
