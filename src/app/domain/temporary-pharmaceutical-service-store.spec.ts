import { TestBed } from '@angular/core/testing';
import { TemporaryPharmaceuticalServiceStore } from './temporary-pharmaceutical-service-store';

describe('TemporaryPharmaceuticalServiceStore', () => {
  let store: TemporaryPharmaceuticalServiceStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [TemporaryPharmaceuticalServiceStore],
    });

    store = TestBed.inject(TemporaryPharmaceuticalServiceStore);
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
