import { PharmaceuticalServiceAttendance, ServiceMedicationItem } from './clinical-records';
import { buildAtendimentoPrintData } from './atendimento-print-data';

describe('buildAtendimentoPrintData', () => {
  it('maps attendance data for the patient print copy without dropping optional services', () => {
    const injectableMedication: ServiceMedicationItem = {
      id: 'injectable-med-1',
      medicationId: 'med-1',
      medicationConcentration: 'Dipirona 500 mg/ml',
      batch: 'L123',
      expirationDate: '2027-02-10',
      dosage: '1 ampola',
    };
    const inhalotherapyMedication: ServiceMedicationItem = {
      id: 'inhalotherapy-med-1',
      medicationId: 'med-2',
      medicationConcentration: 'Soro fisiologico 0,9%',
      batch: 'N456',
      expirationDate: '2027-03-20',
      dosage: '5 ml',
    };
    const complementaryMedication: ServiceMedicationItem = {
      id: 'complementary-med-1',
      medicationId: 'med-3',
      medicationConcentration: 'Paracetamol 750 mg',
      batch: 'P789',
      expirationDate: '2027-04-30',
      dosage: '1 comprimido a cada 8 horas',
    };
    const attendance: PharmaceuticalServiceAttendance = {
      id: 'attendance-1',
      codigo: 1042,
      patient: {
        id: 'patient-1',
        name: 'Maria Souza',
        cpf: '12345678901',
        birthDate: '1988-04-10',
        cellPhone: '44999999999',
        gender: 'feminino',
        cep: '87020025',
        address: 'Avenida Colombo, 5790',
        neighborhood: 'Jardim Universitario',
        city: 'Maringa',
        state: 'PR',
        phone: '4430114300',
        responsibleName: 'Ana Souza',
        comorbidityIds: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      selectedServices: [
        'cuidados-farmaceuticos',
        'aplicacao-injetaveis',
        'inaloterapia',
        'servicos-farmaceuticos',
      ],
      status: 'CONCLUIDO',
      createdAt: '2026-08-18T15:30:00.000Z',
      care: {
        bloodGlucose: '99',
        systolicPressure: '120',
        diastolicPressure: '80',
        bodyTemperature: '36.5',
      },
      injectable: {
        medications: [injectableMedication],
        administrationRoute: 'Intramuscular',
        prescriberName: 'Dra. Julia',
        crmCro: 'CRM 1234',
      },
      inhalotherapy: {
        medications: [inhalotherapyMedication],
        prescriberName: 'Dr. Pedro',
        crmCro: 'CRM 5678',
      },
      complementaryServices: {
        homeCare: true,
        pharmacotherapeuticFollowUp: false,
        minorDisorderIndication: true,
        signsAndSymptoms: 'Dor leve e febre baixa.',
        medications: [complementaryMedication],
        recordNumber: 'F-001',
        attendanceDate: '2026-08-18',
      },
      followUp: {
        returnIntervalDays: 7,
        returnCount: 3,
      },
      followUpLink: {
        chainId: 'chain-1',
        originAttendanceId: 'origin-1',
        previousAttendanceId: 'attendance-0',
        returnNumber: 2,
      },
    };

    const data = buildAtendimentoPrintData(attendance);

    expect(data.codigo).toBe(1042);
    expect(data.fileName).toBe('atendimento-1042.pdf');
    expect(data.createdAt).toBe('18/08/2026');
    expect(data.patient).toEqual({
      name: 'Maria Souza',
      cpf: '123.456.789-01',
      birthDate: '10/04/1988',
      cellPhone: '(44) 99999-9999',
      gender: 'Feminino',
      cep: '87020-025',
      address: 'Avenida Colombo, 5790',
      neighborhood: 'Jardim Universitario',
      city: 'Maringa',
      state: 'PR',
      phone: '(44) 3011-4300',
      responsibleName: 'Ana Souza',
    });
    expect(data.care).toEqual({
      bloodGlucose: '99 mg/dl',
      bloodPressure: '120 x 80 mmHg',
      bodyTemperature: '36.5 °C',
    });
    expect(data.injectable?.medications).toEqual([
      {
        medicationConcentration: 'Dipirona 500 mg/ml',
        batch: 'L123',
        expirationDate: '10/02/2027',
        dosage: '1 ampola',
        administrationRoute: 'Intramuscular',
      },
    ]);
    expect(data.inhalotherapy?.medications).toEqual([
      {
        medicationConcentration: 'Soro fisiologico 0,9%',
        batch: 'N456',
        expirationDate: '20/03/2027',
        dosage: '5 ml',
        administrationRoute: '',
      },
    ]);
    expect(data.complementaryServices?.medications).toEqual([
      {
        medicationConcentration: 'Paracetamol 750 mg',
        batch: 'P789',
        expirationDate: '30/04/2027',
        dosage: '1 comprimido a cada 8 horas',
        administrationRoute: '',
      },
    ]);
    expect(data.complementaryServices?.selectedItems).toEqual([
      'Assistência farmacêutica domiciliar',
      'Indicação farmacêutica em transtornos menores',
    ]);
    expect(data.followUp).toEqual({
      returnIntervalDays: 7,
      returnCount: 3,
      contextLabel: 'Retorno 2 de 3',
    });
  });
});
