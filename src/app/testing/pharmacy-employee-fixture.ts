import { Injectable, computed, signal } from '@angular/core';
import { PharmacyEmployee } from '../domain/funcionario.service';

const EMPLOYEES: PharmacyEmployee[] = [
  {
    id: 'employee-admin-marina',
    userId: 'user-admin-marina',
    name: 'Marina Almeida',
    email: 'marina.admin@uem.br',
    cpf: '12345678901',
    birthDate: '1986-04-12',
    role: 'ADMIN',
    status: 'Ativo',
    crf: 'PR-12345',
    isTechnicalResponsible: true,
  },
  {
    id: 'employee-farmaceutico-carlos',
    userId: 'user-farmaceutico-carlos',
    name: 'Carlos Mendes',
    email: 'carlos.farmacia@uem.br',
    cpf: '23456789012',
    birthDate: '1991-09-03',
    role: 'FARMACEUTICO',
    status: 'Ativo',
    crf: 'PR-67890',
    isTechnicalResponsible: false,
  },
  {
    id: 'employee-estagiario-julia',
    userId: 'user-estagiario-julia',
    name: 'Julia Ferreira',
    email: 'julia.estagio@uem.br',
    cpf: '34567890123',
    birthDate: '2001-01-20',
    role: 'ESTAGIARIO',
    status: 'Ativo',
    internshipType: 'Obrigatório',
    supervisorName: 'Marina Almeida',
    internshipStartDate: '2026-02-01',
    internshipEndDate: '2026-12-15',
  },
];

@Injectable()
export class PharmacyEmployeeFixture {
  private readonly state = signal<PharmacyEmployee[]>(
    EMPLOYEES.map((employee) => ({ ...employee })),
  );
  readonly employees = computed(() => this.state());
  getEmployee(id: string): PharmacyEmployee | undefined {
    return this.state().find((employee) => employee.id === id);
  }
  searchEmployees(query: string): PharmacyEmployee[] {
    const term = query.toLowerCase();
    return this.state().filter((employee) =>
      `${employee.name} ${employee.email} ${employee.role}`.toLowerCase().includes(term),
    );
  }
  toggleTechnicalResponsible(id: string): void {
    this.state.update((employees) =>
      employees.map((employee) =>
        employee.id === id && employee.role !== 'ESTAGIARIO'
          ? { ...employee, isTechnicalResponsible: !employee.isTechnicalResponsible }
          : employee,
      ),
    );
  }
}
