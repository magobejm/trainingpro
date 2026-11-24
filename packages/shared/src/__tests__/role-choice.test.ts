import { defaultRole, onlyRole, usableRoles } from '../role-choice';

describe('usableRoles', () => {
  it('orders the roles from least to most privilege and drops repeats and unknown ones', () => {
    expect(usableRoles(['admin', 'client', 'coach', 'coach', 'owner'], 'mobile')).toEqual(['client', 'coach', 'admin']);
  });

  it('has no client app on the web', () => {
    expect(usableRoles(['client'], 'web')).toEqual([]);
    expect(usableRoles(['admin', 'client', 'coach'], 'web')).toEqual(['coach', 'admin']);
  });
});

describe('defaultRole', () => {
  it('preselects the role with the least privilege', () => {
    expect(defaultRole(['admin', 'coach'], 'web')).toBe('coach');
    expect(defaultRole(['admin', 'coach', 'client'], 'mobile')).toBe('client');
    expect(defaultRole(['admin'], 'mobile')).toBe('admin');
  });

  it('is empty when the account has no usable role', () => {
    expect(defaultRole(['client'], 'web')).toBeNull();
    expect(defaultRole([], 'mobile')).toBeNull();
  });
});

describe('onlyRole', () => {
  it('enters without asking only with one usable role', () => {
    expect(onlyRole(['coach'], 'web')).toBe('coach');
    expect(onlyRole(['client', 'coach'], 'web')).toBe('coach');
    expect(onlyRole(['client', 'coach'], 'mobile')).toBeNull();
    expect(onlyRole([], 'mobile')).toBeNull();
  });
});
