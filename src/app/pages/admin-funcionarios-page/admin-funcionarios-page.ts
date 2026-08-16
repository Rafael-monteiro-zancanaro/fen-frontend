import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
  paginateItems,
} from '../../domain/pagination';
import {
  PharmacyEmployee,
  TemporaryPharmacyEmployeeStore,
} from '../../domain/temporary-pharmacy-employee-store';

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
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly employees = computed(() => this.employeeStore.employees());
  protected readonly filteredEmployees = computed(() =>
    this.employeeStore.searchEmployees(this.searchTerm()),
  );
  protected readonly pagination = computed(() =>
    buildPagination(this.filteredEmployees().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedEmployees = computed(() =>
    paginateItems(this.filteredEmployees(), this.currentPage(), this.pageSize()),
  );

  constructor(private readonly employeeStore: TemporaryPharmacyEmployeeStore) {}

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
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
}
