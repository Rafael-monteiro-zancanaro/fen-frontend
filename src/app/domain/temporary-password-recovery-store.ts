import { Injectable, computed, signal } from '@angular/core';

export type PasswordRecoveryStatus = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface PasswordRecoveryRequest {
  id: string;
  email: string;
  requestedAt: string;
  status: PasswordRecoveryStatus;
}

interface PasswordRecoveryState {
  requests: PasswordRecoveryRequest[];
}

const STORAGE_KEY = 'fen-temporary-recovery-requests';

@Injectable({ providedIn: 'root' })
export class TemporaryPasswordRecoveryStore {
  private readonly state = signal<PasswordRecoveryState>(this.readInitialState());

  readonly requests = computed(() => this.state().requests);
  readonly pendingRequests = computed(() =>
    this.state().requests.filter((request) => request.status === 'PENDENTE'),
  );

  createRequest(email: string): PasswordRecoveryRequest {
    const request: PasswordRecoveryRequest = {
      id: this.createId(),
      email: email.trim(),
      requestedAt: new Date().toISOString(),
      status: 'PENDENTE',
    };

    this.updateState({
      requests: [request, ...this.state().requests],
    });

    return request;
  }

  getRequest(id: string): PasswordRecoveryRequest | undefined {
    return this.state().requests.find((request) => request.id === id);
  }

  approveRequest(id: string): void {
    this.updateRequestStatus(id, 'APROVADA');
  }

  rejectRequest(id: string): void {
    this.updateRequestStatus(id, 'REJEITADA');
  }

  private updateRequestStatus(id: string, status: PasswordRecoveryStatus): void {
    this.updateState({
      requests: this.state().requests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    });
  }

  private updateState(nextState: PasswordRecoveryState): void {
    this.state.set(nextState);
    this.writeState(nextState);
  }

  private readInitialState(): PasswordRecoveryState {
    try {
      const rawState = globalThis.localStorage?.getItem(STORAGE_KEY);

      if (!rawState) {
        return { requests: [] };
      }

      const parsedState = JSON.parse(rawState) as Partial<PasswordRecoveryState>;

      return {
        requests: Array.isArray(parsedState.requests) ? parsedState.requests : [],
      };
    } catch {
      return { requests: [] };
    }
  }

  private writeState(state: PasswordRecoveryState): void {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }
}
