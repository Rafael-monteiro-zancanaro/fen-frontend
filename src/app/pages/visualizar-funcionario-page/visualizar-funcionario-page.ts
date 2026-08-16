import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  PharmacyEmployee,
  TemporaryPharmacyEmployeeStore,
} from '../../domain/temporary-pharmacy-employee-store';

@Component({
  selector: 'app-visualizar-funcionario-page',
  imports: [RouterLink],
  templateUrl: './visualizar-funcionario-page.html',
})
export class VisualizarFuncionarioPage {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeStore = inject(TemporaryPharmacyEmployeeStore);
  private readonly employeeId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly successMessage = signal('');
  protected readonly isUpdatingTechnicalResponsible = signal(false);
  protected readonly showTechnicalResponsibleDialog = signal(false);
  protected readonly employee = computed(() => this.employeeStore.getEmployee(this.employeeId));

  protected roleLabel(employee: PharmacyEmployee): string {
    if (employee.role === 'ADMIN') {
      return 'Administrador';
    }

    if (employee.role === 'FARMACEUTICO') {
      return 'Farmacêutico';
    }

    return 'Estagiário';
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
    }).format(new Date(`${date}T00:00:00`));
  }

  protected canManageTechnicalResponsible(employee: PharmacyEmployee): boolean {
    return employee.role !== 'ESTAGIARIO';
  }

  protected isTechnicalResponsible(employee: PharmacyEmployee): boolean {
    return employee.role !== 'ESTAGIARIO' && employee.isTechnicalResponsible;
  }

  protected openTechnicalResponsibleDialog(): void {
    this.successMessage.set('');
    this.showTechnicalResponsibleDialog.set(true);
  }

  protected closeTechnicalResponsibleDialog(): void {
    this.showTechnicalResponsibleDialog.set(false);
  }

  protected confirmTechnicalResponsibleChange(): void {
    if (this.isUpdatingTechnicalResponsible()) {
      return;
    }

    this.isUpdatingTechnicalResponsible.set(true);
    this.employeeStore.toggleTechnicalResponsible(this.employeeId);
    this.isUpdatingTechnicalResponsible.set(false);
    this.showTechnicalResponsibleDialog.set(false);
    this.successMessage.set('Responsabilidade técnica atualizada com sucesso.');
  }
}
