import { TestBed } from '@angular/core/testing';
import { TemporaryPasswordRecoveryStore } from './temporary-password-recovery-store';

describe('TemporaryPasswordRecoveryStore', () => {
  let store: TemporaryPasswordRecoveryStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [TemporaryPasswordRecoveryStore],
    });

    store = TestBed.inject(TemporaryPasswordRecoveryStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('registers a pending recovery request without persisting the requested password', () => {
    const request = store.createRequest('usuario@uem.br');
    const persistedState = JSON.stringify(localStorage);

    expect(request.email).toBe('usuario@uem.br');
    expect(request.status).toBe('PENDENTE');
    expect(store.pendingRequests()).toEqual([request]);
    expect(persistedState).not.toContain('__FORM_PASSWORD_VALUE__');
    expect(persistedState).not.toContain('password');
    expect(persistedState).not.toContain('senha');
  });

  it('approves and rejects requests without keeping them in the pending list', () => {
    const requestToApprove = store.createRequest('admin-aprova@uem.br');
    const requestToReject = store.createRequest('admin-rejeita@uem.br');

    store.approveRequest(requestToApprove.id);
    store.rejectRequest(requestToReject.id);

    expect(store.getRequest(requestToApprove.id)?.status).toBe('APROVADA');
    expect(store.getRequest(requestToReject.id)?.status).toBe('REJEITADA');
    expect(store.pendingRequests()).toEqual([]);
  });
});
