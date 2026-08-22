import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminRegistrationService,
  PendingRegistrationDetail,
} from '../../auth/admin-registration.service';
import { InternshipType, RegistrationRole } from '../../auth/auth.models';
import { ModalIsolationService } from '../../modal-isolation.service';

type RegistrationDecision = 'approve' | 'reject';

@Component({
  selector: 'app-visualizar-cadastro-pendente-page',
  imports: [RouterLink],
  templateUrl: './visualizar-cadastro-pendente-page.html',
})
export class VisualizarCadastroPendentePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminRegistration = inject(AdminRegistrationService);
  private readonly injector = inject(Injector);
  private readonly modalIsolation = inject(ModalIsolationService);
  private readonly registrationId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly decisionDialog = viewChild<ElementRef<HTMLElement>>('decisionDialog');
  private readonly cancelDecisionButton =
    viewChild<ElementRef<HTMLButtonElement>>('cancelDecisionButton');
  private decisionTrigger: HTMLElement | null = null;

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

  protected askToApprove(trigger: HTMLElement): void {
    this.openDecision('approve', trigger);
  }

  protected askToReject(trigger: HTMLElement): void {
    this.openDecision('reject', trigger);
  }

  private openDecision(decision: RegistrationDecision, trigger: HTMLElement): void {
    this.actionErrorMessage.set('');
    this.decisionTrigger = trigger;
    this.pendingDecision.set(decision);
    this.modalIsolation.activate();
    afterNextRender(
      { write: () => this.cancelDecisionButton()?.nativeElement.focus() },
      { injector: this.injector },
    );
  }

  protected cancelDecision(): void {
    if (!this.decisionInProgress()) {
      this.closeDecisionAndRestoreFocus();
    }
  }

  protected handleDecisionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelDecision();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialog = this.decisionDialog()?.nativeElement;
    const focusableElements = dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'))
      : [];

    if (!dialog || focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      (activeElement === lastElement || !dialog.contains(activeElement))
    ) {
      event.preventDefault();
      firstElement.focus();
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
        this.closeDecisionAndRestoreFocus();
        this.actionErrorMessage.set(
          decision === 'approve'
            ? 'Não foi possível aprovar o cadastro. Tente novamente.'
            : 'Não foi possível rejeitar o cadastro. Tente novamente.',
        );
      },
    });
  }

  private closeDecisionAndRestoreFocus(): void {
    const trigger = this.decisionTrigger;
    this.pendingDecision.set(null);
    this.decisionTrigger = null;
    this.modalIsolation.deactivate();
    afterNextRender({ write: () => trigger?.focus() }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.modalIsolation.deactivate();
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
