import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCheckLg, bootstrapEye, bootstrapXLg } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import { PasswordRecoveryRequest, PasswordRecoveryService } from '../../domain/password-recovery.service';

type RecoveryAction = 'approve' | 'reject';

interface PendingAction {
  action: RecoveryAction;
  request: PasswordRecoveryRequest;
}

@Component({
  selector: 'app-admin-recuperacoes-senha-page',
  imports: [NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapCheckLg,
      bootstrapEye,
      bootstrapXLg,
    }),
  ],
  templateUrl: './admin-recuperacoes-senha-page.html',
})
export class AdminRecuperacoesSenhaPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly pendingAction = signal<PendingAction | null>(null);
  protected readonly operationInProgressId = signal<string | null>(null);
  protected readonly pendingRequests = signal<PasswordRecoveryRequest[]>([]);
  private readonly totalElements = signal(0);
  protected readonly pagination = computed(() =>
    buildPagination(this.totalElements(), this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedPendingRequests = computed(() =>
    this.pendingRequests(),
  );

  constructor(private readonly recoveryService: PasswordRecoveryService) { this.load(); }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
    this.load();
  }

  protected goToPreviousPage(): void {
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1)); this.load();
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1)); this.load();
  }

  protected askToApprove(request: PasswordRecoveryRequest): void {
    this.successMessage.set('');
    this.pendingAction.set({ action: 'approve', request });
  }

  protected askToReject(request: PasswordRecoveryRequest): void {
    this.successMessage.set('');
    this.pendingAction.set({ action: 'reject', request });
  }

  protected cancelAction(): void {
    this.pendingAction.set(null);
  }

  protected confirmAction(): void {
    const pendingAction = this.pendingAction();

    if (!pendingAction || this.operationInProgressId()) {
      return;
    }

    this.operationInProgressId.set(pendingAction.request.id);

    const operation = pendingAction.action === 'approve' ? this.recoveryService.approve(pendingAction.request.id) : this.recoveryService.reject(pendingAction.request.id);
    operation.subscribe({ next: () => { this.successMessage.set(pendingAction.action === 'approve' ? 'Solicitação aprovada com sucesso.' : 'Solicitação rejeitada com sucesso.'); this.operationInProgressId.set(null); this.pendingAction.set(null); this.load(); }, error: () => { this.errorMessage.set('Não foi possível processar a solicitação.'); this.operationInProgressId.set(null); } });
  }

  protected isApproveAction(): boolean {
    return this.pendingAction()?.action === 'approve';
  }

  private load(): void {
    this.isLoading.set(true); this.errorMessage.set('');
    this.recoveryService.list('', 'PENDENTE', this.currentPage() - 1, this.pageSize()).subscribe({
      next: (page) => { this.pendingRequests.set(page.content); this.totalElements.set(page.totalElements); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Tente novamente em instantes.'); this.isLoading.set(false); },
    });
  }
}
