import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TemporaryAccessControl } from './domain/temporary-access-control';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(
    private readonly accessControl: TemporaryAccessControl,
    private readonly router: Router,
  ) {}

  protected isInternalNavigation(): boolean {
    return (
      this.router.url.startsWith('/inicio') ||
      this.router.url.startsWith('/atendimentos') ||
      this.router.url.startsWith('/medicamentos') ||
      this.router.url.startsWith('/comorbidades') ||
      this.router.url.startsWith('/pacientes') ||
      this.router.url.startsWith('/admin')
    );
  }

  protected canManagePasswordRecovery(): boolean {
    return this.accessControl.canAccessAdminModules();
  }
}
