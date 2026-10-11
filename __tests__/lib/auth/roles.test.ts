import {
  ROLE_HOME,
  canAccessPath,
  isProtectedPath,
  isUserRole,
  roleFromAppMetadata,
} from '@/lib/auth/roles';

describe('roleFromAppMetadata', () => {
  it('reads the role from app_metadata', () => {
    expect(roleFromAppMetadata({ app_metadata: { role: 'vendor' } })).toBe('vendor');
  });

  it('ignores user_metadata, which users can edit themselves', () => {
    const user = { app_metadata: {}, user_metadata: { role: 'admin' } } as any;
    expect(roleFromAppMetadata(user)).toBeNull();
  });

  it('rejects unknown role values', () => {
    expect(roleFromAppMetadata({ app_metadata: { role: 'superuser' } })).toBeNull();
    expect(roleFromAppMetadata({ app_metadata: null })).toBeNull();
  });
});

describe('isUserRole', () => {
  it('accepts only the four roles', () => {
    expect(['customer', 'vendor', 'delivery', 'admin'].every(isUserRole)).toBe(true);
    expect(isUserRole('root')).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
  });
});

describe('isProtectedPath', () => {
  it.each(['/dashboard', '/orders/123', '/payouts', '/subscriber-broadcast', '/settlements', '/meals', '/admin/setup'])(
    'protects %s',
    (path) => expect(isProtectedPath(path)).toBe(true)
  );

  it.each(['/', '/about', '/vendors', '/login', '/become-vendor'])('leaves %s public', (path) =>
    expect(isProtectedPath(path)).toBe(false)
  );

  it('matches whole path segments only', () => {
    expect(isProtectedPath('/ordersfoo')).toBe(false);
  });
});

describe('canAccessPath', () => {
  it('lets each role open its own pages and shared pages', () => {
    expect(canAccessPath('vendor', '/payouts')).toBe(true);
    expect(canAccessPath('admin', '/settlements')).toBe(true);
    expect(canAccessPath('delivery', '/earnings')).toBe(true);
    expect(canAccessPath('customer', '/meals')).toBe(true);
  });

  it('blocks other roles', () => {
    expect(canAccessPath('customer', '/admin-dashboard')).toBe(false);
    expect(canAccessPath('customer', '/payouts')).toBe(false);
    expect(canAccessPath('vendor', '/settlements')).toBe(false);
    expect(canAccessPath('delivery', '/vendor-dashboard')).toBe(false);
  });

  it('sends every role to a home page it can access', () => {
    for (const [role, home] of Object.entries(ROLE_HOME)) {
      expect(canAccessPath(role as any, home)).toBe(true);
    }
  });
});
