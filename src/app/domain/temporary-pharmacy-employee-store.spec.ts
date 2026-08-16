import { TestBed } from '@angular/core/testing';
import { TemporaryPharmacyEmployeeStore } from './temporary-pharmacy-employee-store';

describe('TemporaryPharmacyEmployeeStore', () => {
  let store: TemporaryPharmacyEmployeeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TemporaryPharmacyEmployeeStore],
    });

    store = TestBed.inject(TemporaryPharmacyEmployeeStore);
  });

  it('lists and searches pharmacy employees without relying on persisted storage', () => {
    expect(store.employees().length).toBeGreaterThanOrEqual(3);
    expect(store.searchEmployees('marina').map((employee) => employee.name)).toContain(
      'Marina Almeida',
    );
    expect(store.searchEmployees('estagio').map((employee) => employee.role)).toContain(
      'ESTAGIARIO',
    );
  });

  it('toggles technical responsibility only for pharmacists', () => {
    const pharmacist = store.employees().find((employee) => employee.role === 'FARMACEUTICO');
    const intern = store.employees().find((employee) => employee.role === 'ESTAGIARIO');

    if (!pharmacist || !intern) {
      throw new Error('Expected seeded pharmacist and intern employees.');
    }

    expect(store.toggleTechnicalResponsible(pharmacist.id)).toBe(true);
    const updatedPharmacist = store.getEmployee(pharmacist.id);

    expect(updatedPharmacist?.role).toBe('FARMACEUTICO');

    if (!updatedPharmacist || updatedPharmacist.role === 'ESTAGIARIO') {
      throw new Error('Expected an updated pharmacist employee.');
    }

    expect(updatedPharmacist.isTechnicalResponsible).toBe(true);

    expect(store.toggleTechnicalResponsible(intern.id)).toBe(false);
    expect(store.getEmployee(intern.id)?.role).toBe('ESTAGIARIO');
  });
});
