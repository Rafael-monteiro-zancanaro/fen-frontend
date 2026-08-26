import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapPencil } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { Patient } from '../../domain/clinical-records';
import {
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import { PatientService } from '../../domain/patient.service';

@Component({
  selector: 'app-pacientes-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapEye,
      bootstrapPencil,
    }),
  ],
  templateUrl: './pacientes-page.html',
})
export class PacientesPage {
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly patients = signal<Patient[]>([]);
  protected readonly filteredPatients = computed(() => this.patients());
  private readonly totalElements = signal(0);
  protected readonly pagination = computed(() =>
    buildPagination(this.totalElements(), this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedPatients = computed(() =>
    this.patients(),
  );

  constructor(private readonly service: PatientService) { this.load(); }

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
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1)); this.load();
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1)); this.load();
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatPhone(phone: string): string {
    return phone.length === 11
      ? phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      : phone;
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '';
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
  }

  protected comorbidityCount(patient: Patient): number {
    return patient.comorbidityIds.length;
  }

  private load(): void { this.service.list(this.searchTerm(), this.currentPage() - 1, this.pageSize()).subscribe({ next: (page) => { this.patients.set(page.content ?? []); this.totalElements.set(page.totalElements ?? 0); } }); }
}
