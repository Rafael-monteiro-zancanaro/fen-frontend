import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TemporaryPasswordRecoveryStore } from '../../domain/temporary-password-recovery-store';

@Component({
  selector: 'app-recuperar-senha-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-senha-page.html',
})
export class RecuperarSenhaPage {
  protected readonly submitted = signal(false);
  protected readonly requestSent = signal(false);
  protected email = '';
  protected newPassword = '';
  protected confirmation = '';

  constructor(private readonly recoveryStore: TemporaryPasswordRecoveryStore) {}

  protected submitRequest(): void {
    this.submitted.set(true);
    this.requestSent.set(false);

    if (!this.isValid()) {
      return;
    }

    this.recoveryStore.createRequest(this.email);
    this.newPassword = '';
    this.confirmation = '';
    this.email = '';
    this.submitted.set(false);
    this.requestSent.set(true);
  }

  protected isEmailRequired(): boolean {
    return this.submitted() && !this.email.trim();
  }

  protected isEmailInvalid(): boolean {
    return this.submitted() && Boolean(this.email.trim()) && !this.isValidEmail();
  }

  protected isNewPasswordInvalid(): boolean {
    return this.submitted() && !this.newPassword;
  }

  protected isConfirmationInvalid(): boolean {
    return this.submitted() && !this.confirmation;
  }

  protected isConfirmationMismatch(): boolean {
    return (
      this.submitted() &&
      Boolean(this.newPassword) &&
      Boolean(this.confirmation) &&
      this.newPassword !== this.confirmation
    );
  }

  private isValid(): boolean {
    return Boolean(
      this.email.trim() &&
        this.isValidEmail() &&
        this.newPassword &&
        this.confirmation &&
        this.newPassword === this.confirmation,
    );
  }

  private isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }
}
