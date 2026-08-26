import { Injectable, computed, signal } from '@angular/core';
import { TemporaryUserRole } from './temporary-access-control';

export type InternshipType = 'Obrigatório' | 'Não obrigatório';
export type EmployeeStatus = 'Ativo' | 'Inativo';

export interface BasePharmacyEmployee {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  role: TemporaryUserRole;
  status: EmployeeStatus;
}

export interface PharmacistEmployee extends BasePharmacyEmployee {
  role: 'ADMIN' | 'FARMACEUTICO';
  crf: string;
  isTechnicalResponsible: boolean;
}

export interface InternEmployee extends BasePharmacyEmployee {
  role: 'ESTAGIARIO';
  internshipType: InternshipType;
  supervisorName: string;
  internshipStartDate: string;
  internshipEndDate: string;
}

export type PharmacyEmployee = PharmacistEmployee | InternEmployee;

const SEEDED_EMPLOYEES: PharmacyEmployee[] = [
  {
    id: 'employee-admin-marina',
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

@Injectable({ providedIn: 'root' })
export class TemporaryPharmacyEmployeeStore {
  private readonly employeeState = signal<PharmacyEmployee[]>(this.cloneEmployees());

  readonly employees = computed(() => this.employeeState());

  searchEmployees(term: string): PharmacyEmployee[] {
    const query = this.normalize(term);

    if (!query) {
      return this.employeeState();
    }

    return this.employeeState().filter((employee) =>
      this.normalize(`${employee.name} ${employee.email} ${employee.role}`).includes(query),
    );
  }

  getEmployee(id: string): PharmacyEmployee | undefined {
    return this.employeeState().find((employee) => employee.id === id);
  }

  toggleTechnicalResponsible(id: string): boolean {
    const employee = this.getEmployee(id);

    if (!employee || employee.role === 'ESTAGIARIO') {
      return false;
    }

    this.employeeState.update((employees) =>
      employees.map((currentEmployee) =>
        currentEmployee.id === id && currentEmployee.role !== 'ESTAGIARIO'
          ? {
              ...currentEmployee,
              isTechnicalResponsible: !currentEmployee.isTechnicalResponsible,
            }
          : currentEmployee,
      ),
    );

    return true;
  }

  private cloneEmployees(): PharmacyEmployee[] {
    return SEEDED_EMPLOYEES.map((employee) => ({ ...employee }));
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }
}
