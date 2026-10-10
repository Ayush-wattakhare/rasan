/**
 * @jest-environment node
 */
import { devToolsEnabled, setupSecretGuard } from '@/lib/dev-tools';

const ORIGINAL_ENV = process.env;

function setEnv(env: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('devToolsEnabled', () => {
  it('is off unless ENABLE_DEV_TOOLS is "true"', () => {
    setEnv({ ENABLE_DEV_TOOLS: undefined, NODE_ENV: 'development', VERCEL_ENV: undefined });
    expect(devToolsEnabled()).toBe(false);
  });

  it('is on locally when enabled', () => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'development', VERCEL_ENV: undefined });
    expect(devToolsEnabled()).toBe(true);
  });

  it('is never on in Vercel production, even when enabled', () => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'production', VERCEL_ENV: 'production' });
    expect(devToolsEnabled()).toBe(false);
  });

  it('is never on in a self-hosted production build', () => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'production', VERCEL_ENV: undefined });
    expect(devToolsEnabled()).toBe(false);
  });

  it('can be enabled on Vercel preview deploys', () => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'production', VERCEL_ENV: 'preview' });
    expect(devToolsEnabled()).toBe(true);
  });
});

describe('setupSecretGuard', () => {
  const request = (secret?: string) =>
    new Request('http://localhost/api/admin/setup', {
      method: 'POST',
      headers: secret ? { 'x-admin-secret': secret } : {},
    });

  beforeEach(() => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'development', VERCEL_ENV: undefined, ADMIN_SETUP_SECRET: 's3cret' });
  });

  it('accepts the configured secret', () => {
    expect(setupSecretGuard(request('s3cret'))).toBeNull();
  });

  it('rejects a missing or wrong secret', () => {
    expect(setupSecretGuard(request())?.status).toBe(401);
    expect(setupSecretGuard(request('nope'))?.status).toBe(401);
  });

  it('refuses when no secret is configured', () => {
    setEnv({ ENABLE_DEV_TOOLS: 'true', NODE_ENV: 'development', ADMIN_SETUP_SECRET: undefined });
    expect(setupSecretGuard(request('anything'))?.status).toBe(403);
  });

  it('returns 404 when dev tools are off', () => {
    setEnv({ ENABLE_DEV_TOOLS: undefined, ADMIN_SETUP_SECRET: 's3cret' });
    expect(setupSecretGuard(request('s3cret'))?.status).toBe(404);
  });
});
