import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminRegistrationService,
  PendingRegistrationDetail,
} from '../../auth/admin-registration.service';
import { InternshipType, RegistrationRole } from '../../auth/auth.models';

type RegistrationDecision = 'approve' | 'reject';

@Component({
  selector: 'app-visualizar-cadastro-pendente-page',
  imports: [RouterLink],
  templateUrl: './visualizar-cadastro-pendente-page.html',
})
export class VisualizarCadastroPendentePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminRegistration = inject(AdminRegistrationService);
  private readonly registrationId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly registration = signal<PendingRegistrationDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly pendingDecision = signal<RegistrationDecision | null>(null);
  protected readonly decisionInProgress = signal(false);
  protected readonly actionErrorMessage = signal('');

  constructor() {
    this.adminRegistration
      .findPendente(this.registrationId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (registration) => this.registration.set(registration),
        error: () => this.hasLoadError.set(true),
      });
  }

  protected askToApprove(): void {
    this.actionErrorMessage.set('');
    this.pendingDecision.set('approve');
  }

  protected askToReject(): void {
    this.actionErrorMessage.set('');
    this.pendingDecision.set('reject');
  }

  protected cancelDecision(): void {
    if (!this.decisionInProgress()) {
      this.pendingDecision.set(null);
    }
  }

  protected confirmDecision(): void {
    const decision = this.pendingDecision();
    if (!decision || this.decisionInProgress()) {
      return;
    }

    this.decisionInProgress.set(true);
    const request =
      decision === 'approve'
        ? this.adminRegistration.aprovar(this.registrationId)
        : this.adminRegistration.rejeitar(this.registrationId);

    request.pipe(finalize(() => this.decisionInProgress.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/admin/cadastros-pendentes'),
      error: () => {
        this.pendingDecision.set(null);
        this.actionErrorMessage.set(
          decision === 'approve'
            ? 'Não foi possível aprovar o cadastro. Tente novamente.'
            : 'Não foi possível rejeitar o cadastro. Tente novamente.',
        );
      },
    });
  }

  protected isApproveDecision(): boolean {
    return this.pendingDecision() === 'approve';
  }

  protected roleLabel(role: RegistrationRole): string {
    return role === 'FARMACEUTICO' ? 'Farmacêutico' : 'Estagiário';
  }

  protected internshipTypeLabel(type: InternshipType | null): string {
    return type === 'OBRIGATORIO' ? 'Obrigatório' : 'Não obrigatório';
  }

  protected formatCpf(value: string): string {
    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'Não informada';
    }

    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
