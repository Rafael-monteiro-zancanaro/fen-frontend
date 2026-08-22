import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye } from '@ng-icons/bootstrap-icons';
import { finalize } from 'rxjs';
import {
  AdminRegistrationService,
  PendingRegistrationSummary,
} from '../../auth/admin-registration.service';
import { RegistrationRole } from '../../auth/auth.models';

@Component({
  selector: 'app-cadastros-pendentes-page',
  imports: [NgIcon, RouterLink],
  providers: [provideIcons({ bootstrapEye })],
  templateUrl: './cadastros-pendentes-page.html',
})
export class CadastrosPendentesPage {
  private readonly adminRegistration = inject(AdminRegistrationService);

  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly pendingRegistrations = signal<PendingRegistrationSummary[]>([]);

  constructor() {
    this.adminRegistration
      .findPendentes()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (registrations) => this.pendingRegistrations.set(registrations),
        error: () => this.hasLoadError.set(true),
      });
  }

  protected roleLabel(role: RegistrationRole): string {
    return role === 'FARMACEUTICO' ? 'Farmacêutico' : 'Estagiário';
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
