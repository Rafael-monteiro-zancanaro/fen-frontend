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
  paginateItems,
} from '../../domain/pagination';
import {
  PasswordRecoveryRequest,
  TemporaryPasswordRecoveryStore,
} from '../../domain/temporary-password-recovery-store';

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
  protected readonly pendingRequests = computed(() => this.recoveryStore.pendingRequests());
  protected readonly pagination = computed(() =>
    buildPagination(this.pendingRequests().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedPendingRequests = computed(() =>
    paginateItems(this.pendingRequests(), this.currentPage(), this.pageSize()),
  );

  constructor(private readonly recoveryStore: TemporaryPasswordRecoveryStore) {}

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
  }

  protected goToPreviousPage(): void {
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1));
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1));
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

    if (pendingAction.action === 'approve') {
      this.recoveryStore.approveRequest(pendingAction.request.id);
      this.successMessage.set('Solicitação aprovada com sucesso.');
    } else {
      this.recoveryStore.rejectRequest(pendingAction.request.id);
      this.successMessage.set('Solicitação rejeitada com sucesso.');
    }

    this.operationInProgressId.set(null);
    this.pendingAction.set(null);
    this.currentPage.set(this.pagination().currentPage);
  }

  protected isApproveAction(): boolean {
    return this.pendingAction()?.action === 'approve';
  }
}
