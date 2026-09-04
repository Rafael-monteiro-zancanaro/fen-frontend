import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { PAGE_SIZE_OPTIONS, PageSize, normalizePageSize } from '../../domain/pagination';
import { PharmacyEmployee, FuncionarioService } from '../../domain/funcionario.service';
import { PaginationState } from '../../domain/pagination';

@Component({
  selector: 'app-admin-funcionarios-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapEye,
    }),
  ],
  templateUrl: './admin-funcionarios-page.html',
})
export class AdminFuncionariosPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isApproving = signal(false);
  protected readonly employeeToApprove = signal<PharmacyEmployee | undefined>(undefined);
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly employees = signal<PharmacyEmployee[]>([]);
  protected readonly pagination = signal<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    startItem: 0,
    endItem: 0,
  });

  constructor(private readonly employeeService: FuncionarioService) {
    this.load();
  }

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.load();
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
    this.load();
  }

  protected goToPreviousPage(): void {
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1));
    this.load();
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1));
    this.load();
  }

  protected roleLabel(employee: PharmacyEmployee): string {
    if (employee.role === 'ADMIN') {
      return 'Administrador';
    }

    if (employee.role === 'FARMACEUTICO') {
      return 'Farmacêutico';
    }

    return 'Estagiário';
  }

  protected isTechnicalResponsible(employee: PharmacyEmployee): boolean {
    return employee.role !== 'ESTAGIARIO' && employee.isTechnicalResponsible;
  }

  protected openApprovalDialog(employee: PharmacyEmployee): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.employeeToApprove.set(employee);
  }

  protected closeApprovalDialog(): void {
    if (!this.isApproving()) {
      this.employeeToApprove.set(undefined);
    }
  }

  protected confirmApproval(): void {
    const employee = this.employeeToApprove();
    if (!employee || employee.status !== 'Pendente' || this.isApproving()) {
      return;
    }
    this.isApproving.set(true);
    this.employeeService.efetivar(employee.userId).subscribe({
      next: () => {
        this.isApproving.set(false);
        this.employeeToApprove.set(undefined);
        this.successMessage.set('Cadastro efetivado com sucesso.');
        this.load();
      },
      error: () => {
        this.isApproving.set(false);
        this.errorMessage.set('Não foi possível efetivar o cadastro.');
      },
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.employeeService
      .list(this.searchTerm(), this.currentPage() - 1, this.pageSize())
      .subscribe({
        next: (page) => {
          const currentPage = page.number + 1;
          this.employees.set(page.content);
          this.pagination.set({
            currentPage,
            pageSize: this.pageSize(),
            totalItems: page.totalElements,
            totalPages: Math.max(1, page.totalPages),
            startItem: page.totalElements ? page.number * page.size + 1 : 0,
            endItem: Math.min((page.number + 1) * page.size, page.totalElements),
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Não foi possível consultar o servidor.');
          this.isLoading.set(false);
        },
      });
  }
}
