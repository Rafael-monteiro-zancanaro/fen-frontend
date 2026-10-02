import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { focusFirstInvalidField } from '../../domain/form-validation-focus';
import { PasswordRecoveryService } from '../../domain/password-recovery.service';

@Component({
  selector: 'app-recuperar-senha-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-senha-page.html',
})
export class RecuperarSenhaPage {
  @ViewChild('recoveryForm') private recoveryForm?: ElementRef<HTMLFormElement>;
  protected readonly submitted = signal(false);
  protected readonly requestSent = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected email = '';
  protected newPassword = '';
  protected confirmation = '';

  constructor(private readonly recoveryService: PasswordRecoveryService) {}

  protected submitRequest(): void {
    this.submitted.set(true);
    this.requestSent.set(false);
    this.errorMessage.set('');

    if (!this.isValid()) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.recoveryService.create(this.email, this.newPassword).pipe(
      finalize(() => this.isSubmitting.set(false)),
    ).subscribe({
      next: () => {
        this.newPassword = ''; this.confirmation = ''; this.email = '';
        this.submitted.set(false); this.requestSent.set(true);
      },
      error: () => this.errorMessage.set('Não foi possível enviar a solicitação. Verifique o e-mail e tente novamente.'),
    });
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

  protected isNewPasswordLengthInvalid(): boolean {
    return (
      this.submitted() &&
      Boolean(this.newPassword) &&
      (this.newPassword.length < 8 || this.newPassword.length > 72)
    );
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
        this.newPassword.length >= 8 &&
        this.newPassword.length <= 72 &&
        this.confirmation &&
        this.newPassword === this.confirmation,
    );
  }

  private isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  private focusFirstInvalidField(): void {
    if (this.recoveryForm) {
      focusFirstInvalidField(this.recoveryForm.nativeElement);
    }
  }
}
