import { TestBed } from '@angular/core/testing';
import { TemporaryClinicalRecordsStore } from './temporary-clinical-records-store';
import { TemporaryPharmaceuticalServiceStore } from './temporary-pharmaceutical-service-store';

describe('TemporaryPharmaceuticalServiceStore', () => {
  let store: TemporaryPharmaceuticalServiceStore;
  let clinicalStore: TemporaryClinicalRecordsStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [TemporaryClinicalRecordsStore, TemporaryPharmaceuticalServiceStore],
    });

    store = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reuses patients by CPF when creating attendances', () => {
    const firstAttendance = store.createAttendance({
      patient: {
        name: 'Maria Souza',
        cpf: '12345678901',
        birthDate: '1988-04-10',
        cellPhone: '44999999999',
        gender: 'feminino',
        address: 'Rua das Flores',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '95',
        systolicPressure: '120',
        diastolicPressure: '80',
        bodyTemperature: '36.5',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    const secondAttendance = store.createAttendance({
      patient: {
        name: 'Maria Souza Atualizada',
        cpf: '123.456.789-01',
        birthDate: '1988-04-10',
        cellPhone: '44888888888',
        gender: 'feminino',
        address: 'Rua Nova',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['inaloterapia'],
      care: null,
      injectable: null,
      inhalotherapy: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Soro fisiológico',
            batch: 'A1',
            expirationDate: '2027-01-01',
            dosage: 'Conforme orientação',
          },
        ],
        prescriberName: 'Dra. Ana',
        crmCro: 'CRM 123',
      },
      complementaryServices: null,
      followUp: null,
    });

    expect(store.patients()).toHaveLength(1);
    expect(firstAttendance.patient.id).toBe(secondAttendance.patient.id);
    expect(store.findPatientByCpf('12345678901')?.name).toBe('Maria Souza Atualizada');
  });

  it('creates, searches and updates patients without duplicating CPF records', () => {
    const patient = store.createPatient({
      name: 'Maria Souza',
      cpf: '123.456.789-01',
      birthDate: '1988-04-10',
      cellPhone: '(44) 99999-9999',
      gender: 'feminino',
      cep: '87020-025',
      address: 'Rua das Flores',
      neighborhood: 'Zona 7',
      city: 'Maringá',
      state: 'pr',
      phone: '',
      responsibleName: '',
    });

    expect(patient.cpf).toBe('12345678901');
    expect(patient.cellPhone).toBe('44999999999');
    expect(patient.cep).toBe('87020025');
    expect(patient.comorbidityIds).toEqual([]);
    expect(store.searchPatients('maria')).toEqual([patient]);
    expect(store.searchPatients('12345678901')).toEqual([patient]);

    const updatedPatient = store.updatePatient(patient.id, {
      ...patient,
      name: 'Maria Souza Atualizada',
      cpf: '12345678901',
      cellPhone: '44888888888',
      cep: '87030000',
      state: 'PR',
    });

    expect(updatedPatient?.id).toBe(patient.id);
    expect(store.patients()).toHaveLength(1);
    expect(store.getPatient(patient.id)?.name).toBe('Maria Souza Atualizada');
    expect(store.findPatientByCpf('123.456.789-01')?.cellPhone).toBe('44888888888');
  });

  it('keeps patient comorbidity associations unique and resolves medication interactions', () => {
    const dipirona = clinicalStore.createMedication({
      name: 'Dipirona',
      measurementUnit: '500 mg',
      administrationRoute: 'Oral',
    });
    const insulina = clinicalStore.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutânea',
    });
    const diabetes = clinicalStore.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });
    const hipertensao = clinicalStore.createComorbidity({
      name: 'Hipertensão',
      medicationInteractionIds: [insulina.id],
    });
    const patient = store.createPatient({
      name: 'João Pereira',
      cpf: '98765432100',
      birthDate: '1970-09-20',
      cellPhone: '44977777777',
      gender: 'masculino',
      address: '',
      city: 'Maringá',
      state: 'PR',
      phone: '',
      responsibleName: '',
      comorbidityIds: [diabetes.id, diabetes.id, 'inexistente'],
    });

    expect(patient.comorbidityIds).toEqual([diabetes.id]);

    store.updatePatientComorbidities(patient.id, [diabetes.id, hipertensao.id, diabetes.id]);

    expect(store.getPatient(patient.id)?.comorbidityIds).toEqual([diabetes.id, hipertensao.id]);
    expect(
      store.getPatientComorbidities(patient.id).map((comorbidity) => comorbidity.name),
    ).toEqual(['Diabetes mellitus', 'Hipertensão']);
    expect(
      store
        .getPatientMedicationInteractions(patient.id, dipirona.id)
        .map((interaction) => interaction.comorbidity.name),
    ).toEqual(['Diabetes mellitus']);
  });

  it('sets attendance status from follow-up and closes expired attendances', () => {
    const withFollowUp = store.createAttendance({
      patient: {
        name: 'João Pereira',
        cpf: '98765432100',
        birthDate: '1970-09-20',
        cellPhone: '44977777777',
        gender: 'masculino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['servicos-farmaceuticos'],
      care: null,
      injectable: null,
      inhalotherapy: null,
      complementaryServices: {
        homeCare: false,
        pharmacotherapeuticFollowUp: true,
        minorDisorderIndication: false,
        signsAndSymptoms: 'Acompanhamento de uso de medicamento',
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Medicamento A',
            batch: 'B1',
            expirationDate: '2027-02-02',
            dosage: '1 vez ao dia',
          },
        ],
        recordNumber: 'F-001',
        attendanceDate: '2026-08-16',
      },
      followUp: {
        returnIntervalDays: 7,
        returnCount: 3,
      },
    });
    const concluded = store.createAttendance({
      patient: {
        name: 'Ana Lima',
        cpf: '11122233344',
        birthDate: '1995-01-01',
        cellPhone: '44966666666',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '100',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    expect(withFollowUp.status).toBe('AGUARDANDO_RETORNO');
    expect(concluded.status).toBe('CONCLUIDO');

    store.markAttendanceExpired(withFollowUp.id);
    expect(store.getAttendance(withFollowUp.id)?.status).toBe('EXPIRADO');
    expect(store.closeExpiredAttendance(concluded.id)).toBe(false);
    expect(store.closeExpiredAttendance(withFollowUp.id)).toBe(true);
    expect(store.getAttendance(withFollowUp.id)?.status).toBe('CONCLUIDO');
  });

  it('creates follow-up returns as new linked attendances with independent business codes', () => {
    const initial = store.createAttendance({
      patient: {
        name: 'João Pereira',
        cpf: '98765432100',
        birthDate: '1970-09-20',
        cellPhone: '44977777777',
        gender: 'masculino',
        address: 'Rua A',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['servicos-farmaceuticos'],
      care: null,
      injectable: null,
      inhalotherapy: null,
      complementaryServices: {
        homeCare: false,
        pharmacotherapeuticFollowUp: true,
        minorDisorderIndication: false,
        signsAndSymptoms: 'Acompanhamento',
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Medicamento A',
            batch: 'B1',
            expirationDate: '2027-02-02',
            dosage: '1 vez ao dia',
          },
        ],
        recordNumber: '',
        attendanceDate: '2026-08-16',
      },
      followUp: {
        returnIntervalDays: 7,
        returnCount: 2,
      },
    });

    const firstReturn = store.createFollowUpReturn(initial.id, {
      patient: {
        ...initial.patient,
        name: 'João Pereira Atualizado',
        cellPhone: '44988888888',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '100',
        systolicPressure: '120',
        diastolicPressure: '80',
        bodyTemperature: '36.5',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    expect(firstReturn).toBeTruthy();
    expect(firstReturn?.id).not.toBe(initial.id);
    expect(firstReturn?.codigo).toBeGreaterThan(initial.codigo);
    expect(firstReturn?.patient.id).toBe(initial.patient.id);
    expect(firstReturn?.patient.name).toBe('João Pereira Atualizado');
    expect(firstReturn?.followUp).toEqual(initial.followUp);
    expect(firstReturn?.followUpLink?.chainId).toBe(initial.followUpLink?.chainId);
    expect(firstReturn?.followUpLink?.originAttendanceId).toBe(initial.id);
    expect(firstReturn?.followUpLink?.previousAttendanceId).toBe(initial.id);
    expect(firstReturn?.followUpLink?.returnNumber).toBe(1);
    expect(firstReturn?.status).toBe('AGUARDANDO_RETORNO');
    expect(store.getAttendance(initial.id)?.status).toBe('CONCLUIDO');
    expect(store.followUpProgress(firstReturn!.id)).toEqual({
      returnCount: 2,
      completedReturns: 1,
      nextReturnNumber: 2,
      canContinue: true,
    });

    const secondReturn = store.createFollowUpReturn(firstReturn!.id, {
      patient: firstReturn!.patient,
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '98',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    expect(secondReturn?.followUpLink?.returnNumber).toBe(2);
    expect(secondReturn?.status).toBe('CONCLUIDO');
    expect(store.followUpProgress(secondReturn!.id)).toEqual({
      returnCount: 2,
      completedReturns: 2,
      nextReturnNumber: null,
      canContinue: false,
    });
    expect(
      store.createFollowUpReturn(firstReturn!.id, {
        patient: firstReturn!.patient,
        selectedServices: ['cuidados-farmaceuticos'],
        care: {
          bloodGlucose: '99',
          systolicPressure: '',
          diastolicPressure: '',
          bodyTemperature: '',
        },
        injectable: null,
        inhalotherapy: null,
        complementaryServices: null,
        followUp: null,
      }),
    ).toBeUndefined();
  });

  it('summarizes follow-up history with registered and pending returns', () => {
    const initial = store.createAttendance({
      patient: {
        name: 'Maria Souza',
        cpf: '12345678901',
        birthDate: '1988-04-10',
        cellPhone: '44999999999',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '95',
        systolicPressure: '120',
        diastolicPressure: '80',
        bodyTemperature: '36.5',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: {
        returnIntervalDays: 7,
        returnCount: 3,
      },
    });
    const firstReturn = store.createFollowUpReturn(initial.id, {
      patient: initial.patient,
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '96',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    expect(store.followUpHistory(firstReturn!.id)).toEqual([
      expect.objectContaining({
        label: 'Atendimento inicial',
        attendanceId: initial.id,
        codigo: initial.codigo,
        status: 'CONCLUIDO',
      }),
      expect.objectContaining({
        label: '1º retorno',
        attendanceId: firstReturn?.id,
        codigo: firstReturn?.codigo,
        status: 'AGUARDANDO_RETORNO',
      }),
      expect.objectContaining({
        label: '2º retorno',
        attendanceId: null,
        codigo: null,
        status: 'PENDENTE',
      }),
      expect.objectContaining({
        label: '3º retorno',
        attendanceId: null,
        codigo: null,
        status: 'PENDENTE',
      }),
    ]);
  });

  it('searches attendances by patient, CPF and service while respecting status filters', () => {
    store.createAttendance({
      patient: {
        name: 'Carla Rocha',
        cpf: '22233344455',
        birthDate: '1980-03-03',
        cellPhone: '44955555555',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['aplicacao-injetaveis'],
      care: null,
      injectable: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Vacina A',
            batch: 'L1',
            expirationDate: '2027-03-03',
            dosage: 'Dose única',
          },
        ],
        administrationRoute: 'Intramuscular',
        prescriberName: 'Dr. Paulo',
        crmCro: 'CRM 456',
      },
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });
    const waiting = store.createAttendance({
      patient: {
        name: 'Bruno Santos',
        cpf: '33344455566',
        birthDate: '1975-04-04',
        cellPhone: '44944444444',
        gender: 'masculino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['inaloterapia'],
      care: null,
      injectable: null,
      inhalotherapy: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Soro fisiológico',
            batch: 'S1',
            expirationDate: '2027-04-04',
            dosage: 'Nebulização',
          },
        ],
        prescriberName: '',
        crmCro: '',
      },
      complementaryServices: null,
      followUp: {
        returnIntervalDays: 5,
        returnCount: 2,
      },
    });

    expect(store.searchAttendances('carla', 'TODOS')).toHaveLength(1);
    expect(store.searchAttendances('33344455566', 'TODOS')).toEqual([waiting]);
    expect(store.searchAttendances('inaloterapia', 'AGUARDANDO_RETORNO')).toEqual([waiting]);
    expect(store.searchAttendances('', 'CONCLUIDO')).toHaveLength(1);
  });
});
