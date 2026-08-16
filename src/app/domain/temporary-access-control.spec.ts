import { TestBed } from '@angular/core/testing';
import { TemporaryAccessControl } from './temporary-access-control';

describe('TemporaryAccessControl', () => {
  let accessControl: TemporaryAccessControl;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [TemporaryAccessControl],
    });

    accessControl = TestBed.inject(TemporaryAccessControl);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to FARMACEUTICO and grants admin access only to ADMIN', () => {
    expect(accessControl.currentRole()).toBe('FARMACEUTICO');
    expect(accessControl.canManagePasswordRecovery()).toBe(false);

    accessControl.setRole('ESTAGIARIO');
    expect(accessControl.canManagePasswordRecovery()).toBe(false);

    accessControl.setRole('ADMIN');
    expect(accessControl.canManagePasswordRecovery()).toBe(true);
  });
});
