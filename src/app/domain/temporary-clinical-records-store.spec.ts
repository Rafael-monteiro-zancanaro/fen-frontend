import { TestBed } from '@angular/core/testing';
import { TemporaryClinicalRecordsStore } from './temporary-clinical-records-store';

describe('TemporaryClinicalRecordsStore', () => {
  let store: TemporaryClinicalRecordsStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [TemporaryClinicalRecordsStore],
    });

    store = TestBed.inject(TemporaryClinicalRecordsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates, searches and deletes medications', () => {
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });

    store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutanea',
    });

    expect(store.medications()).toHaveLength(2);
    expect(store.searchMedications('dipi')).toEqual([dipirona]);
    expect(store.searchMedications('dose')).toHaveLength(1);
    expect(store.searchMedications('oral')).toEqual([dipirona]);

    store.deleteMedication(dipirona.id);

    expect(store.medications().map((medication) => medication.name)).toEqual(['Insulina']);
  });

  it('updates medication fields', () => {
    const medication = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });

    const updatedMedication = store.updateMedication(medication.id, {
      name: 'Dipirona gotas',
      measurementUnit: 'ml',
      administrationRoute: 'Oral',
    });

    expect(updatedMedication?.name).toBe('Dipirona gotas');
    expect(store.getMedication(medication.id)?.measurementUnit).toBe('ml');
    expect(store.searchMedications('gotas')).toEqual([updatedMedication]);
  });

  it('creates comorbidities with unique medication interactions', () => {
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const insulina = store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutanea',
    });

    const diabetes = store.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id, dipirona.id, insulina.id],
    });

    expect(diabetes.medicationInteractionIds).toEqual([dipirona.id, insulina.id]);
    expect(store.searchComorbidities('diabetes')).toEqual([diabetes]);
    expect(store.getInteractionMedications(diabetes)).toEqual([dipirona, insulina]);
  });

  it('removes deleted medications from comorbidity interactions', () => {
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const diabetes = store.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });

    store.deleteMedication(dipirona.id);

    expect(store.getMedication(dipirona.id)).toBeUndefined();
    expect(store.getComorbidity(diabetes.id)?.medicationInteractionIds).toEqual([]);
  });

  it('updates comorbidity fields and keeps medication interactions unique', () => {
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const insulina = store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutanea',
    });
    const diabetes = store.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });

    const updatedComorbidity = store.updateComorbidity(diabetes.id, {
      name: 'Diabetes tipo 2',
      medicationInteractionIds: [insulina.id, insulina.id, dipirona.id],
    });

    expect(updatedComorbidity?.name).toBe('Diabetes tipo 2');
    expect(updatedComorbidity?.medicationInteractionIds).toEqual([insulina.id, dipirona.id]);
    expect(store.getInteractionMedications(updatedComorbidity!)).toEqual([insulina, dipirona]);
  });
});
