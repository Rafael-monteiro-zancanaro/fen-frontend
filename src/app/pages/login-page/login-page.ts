import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { utf8ByteLength } from '../../auth/password.validators';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.maxLength(72), utf8ByteLength(72)]],
  });
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly loginFailed = signal(false);

  protected submit(): void {
    if (this.pending()) {
      return;
    }

    this.submitted.set(true);
    this.loginFailed.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.auth
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/inicio'),
        error: () => this.loginFailed.set(true),
      });
  }

  protected isEmailRequired(): boolean {
    return this.shouldShowError('email') && this.loginForm.controls.email.hasError('required');
  }

  protected isEmailInvalid(): boolean {
    return this.shouldShowError('email') && this.loginForm.controls.email.hasError('email');
  }

  protected isPasswordRequired(): boolean {
    return this.shouldShowError('senha') && this.loginForm.controls.senha.hasError('required');
  }

  protected isPasswordTooLong(): boolean {
    return (
      this.shouldShowError('senha') &&
      (this.loginForm.controls.senha.hasError('maxlength') ||
        this.loginForm.controls.senha.hasError('utf8ByteLength'))
    );
  }

  private shouldShowError(controlName: 'email' | 'senha'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
