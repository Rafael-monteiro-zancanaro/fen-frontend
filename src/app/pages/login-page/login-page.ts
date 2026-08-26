import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../domain/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected email = '';
  protected senha = '';
  protected error = '';
  protected loading = false;

  protected enter(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.senha).subscribe({
      next: () => void this.router.navigateByUrl('/inicio'),
      error: () => { this.error = 'E-mail ou senha inválidos.'; this.loading = false; },
    });
  }
}
