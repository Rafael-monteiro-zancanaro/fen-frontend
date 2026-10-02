import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../domain/auth.service';
import { focusFirstInvalidField } from '../../domain/form-validation-focus';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  @ViewChild('loginForm') private loginForm?: NgForm;
  @ViewChild('loginFormElement') private loginFormElement?: ElementRef<HTMLFormElement>;
  protected email = '';
  protected senha = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly registrationMessage =
    typeof history === 'undefined' ? '' : (history.state?.registrationMessage ?? '');

  protected enter(): void {
    if (this.loading()) return;
    this.submitted.set(true);
    this.error.set('');
    this.loginForm?.control.markAllAsTouched();
    if (this.loginForm?.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.email, this.senha).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/inicio'),
      error: () => this.error.set('E-mail ou senha inválidos.'),
    });
  }

  protected shouldShowError(control: NgModel): boolean {
    return Boolean(control.invalid && (control.touched || this.submitted()));
  }

  private focusFirstInvalidField(): void {
    if (this.loginFormElement) {
      focusFirstInvalidField(this.loginFormElement.nativeElement);
    }
  }
}
