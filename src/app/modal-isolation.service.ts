import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalIsolationService {
  private readonly activeState = signal(false);

  readonly active = this.activeState.asReadonly();

  activate(): void {
    this.activeState.set(true);
  }

  deactivate(): void {
    this.activeState.set(false);
  }
}
