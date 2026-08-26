import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  TemporaryAccessControl,
  TemporaryUserRole,
} from '../../domain/temporary-access-control';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly accessControl = inject(TemporaryAccessControl);
  private readonly router = inject(Router);
  protected selectedRole: TemporaryUserRole = this.accessControl.currentRole();

  protected enter(): void {
    this.accessControl.setRole(this.selectedRole);
    void this.router.navigateByUrl('/inicio');
  }
}
