import {
  CareServiceData,
  ComplementaryServicesData,
  InjectableServiceData,
  InhalotherapyServiceData,
  PharmaceuticalServiceAttendance,
  ServiceMedicationItem,
} from './clinical-records';

export interface AtendimentoPrintData {
  codigo: number;
  fileName: string;
  createdAt: string;
  patient: AtendimentoPrintPatient;
  selectedServices: AtendimentoPrintServiceSelection[];
  care: AtendimentoPrintCare | null;
  injectable: AtendimentoPrintMedicationService | null;
  inhalotherapy: AtendimentoPrintMedicationService | null;
  complementaryServices: AtendimentoPrintComplementaryServices | null;
  followUp: AtendimentoPrintFollowUp | null;
}

export interface AtendimentoPrintPatient {
  name: string;
  cpf: string;
  birthDate: string;
  cellPhone: string;
  gender: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  responsibleName: string;
}

export interface AtendimentoPrintServiceSelection {
  label: string;
  selected: boolean;
}

export interface AtendimentoPrintCare {
  bloodGlucose: string;
  bloodPressure: string;
  bodyTemperature: string;
}

export interface AtendimentoPrintMedication {
  medicationConcentration: string;
  batch: string;
  expirationDate: string;
  dosage: string;
  administrationRoute: string;
}

export interface AtendimentoPrintMedicationService {
  medications: AtendimentoPrintMedication[];
  prescriberName: string;
  crmCro: string;
  administrationRoute: string;
}

export interface AtendimentoPrintComplementaryServices {
  selectedItems: string[];
  signsAndSymptoms: string;
  medications: AtendimentoPrintMedication[];
  recordNumber: string;
  attendanceDate: string;
}

export interface AtendimentoPrintFollowUp {
  returnIntervalDays: number;
  returnCount: number;
  contextLabel: string;
}

const SERVICE_SELECTIONS = [
  { key: 'cuidados-farmaceuticos', label: 'Cuidados farmacêuticos' },
  { key: 'aplicacao-injetaveis', label: 'Aplicação de injetáveis' },
  { key: 'inaloterapia', label: 'Inaloterapia' },
  { key: 'servicos-farmaceuticos', label: 'Serviços farmacêuticos' },
] as const;

export function buildAtendimentoPrintData(
  attendance: PharmaceuticalServiceAttendance,
): AtendimentoPrintData {
  return {
    codigo: attendance.codigo,
    fileName: `atendimento-${attendance.codigo}.pdf`,
    createdAt: formatDate(attendance.createdAt),
    patient: {
      name: attendance.patient.name,
      cpf: formatCpf(attendance.patient.cpf),
      birthDate: formatDate(attendance.patient.birthDate),
      cellPhone: formatPhone(attendance.patient.cellPhone),
      gender: formatGender(attendance.patient.gender),
      cep: formatCep(attendance.patient.cep ?? ''),
      address: attendance.patient.address,
      neighborhood: attendance.patient.neighborhood ?? '',
      city: attendance.patient.city,
      state: attendance.patient.state,
      phone: formatPhone(attendance.patient.phone),
      responsibleName: attendance.patient.responsibleName,
    },
    selectedServices: SERVICE_SELECTIONS.map((service) => ({
      label: service.label,
      selected: attendance.selectedServices.includes(service.key),
    })),
    care: attendance.care ? mapCare(attendance.care) : null,
    injectable: attendance.injectable ? mapInjectable(attendance.injectable) : null,
    inhalotherapy: attendance.inhalotherapy ? mapInhalotherapy(attendance.inhalotherapy) : null,
    complementaryServices: attendance.complementaryServices
      ? mapComplementaryServices(attendance.complementaryServices)
      : null,
    followUp: attendance.followUp
      ? {
          returnIntervalDays: attendance.followUp.returnIntervalDays,
          returnCount: attendance.followUp.returnCount,
          contextLabel:
            (attendance.followUpLink?.returnNumber ?? 0) > 0
              ? `Retorno ${attendance.followUpLink?.returnNumber} de ${attendance.followUp.returnCount}`
              : '',
        }
      : null,
  };
}

function mapCare(care: CareServiceData): AtendimentoPrintCare {
  return {
    bloodGlucose: care.bloodGlucose ? `${care.bloodGlucose} mg/dl` : '',
    bloodPressure:
      care.systolicPressure || care.diastolicPressure
        ? `${care.systolicPressure || '-'} x ${care.diastolicPressure || '-'} mmHg`
        : '',
    bodyTemperature: care.bodyTemperature ? `${care.bodyTemperature} °C` : '',
  };
}

function mapInjectable(service: InjectableServiceData): AtendimentoPrintMedicationService {
  return {
    medications: service.medications.map((item) =>
      mapMedication(item, service.administrationRoute),
    ),
    prescriberName: service.prescriberName,
    crmCro: service.crmCro,
    administrationRoute: service.administrationRoute,
  };
}

function mapInhalotherapy(service: InhalotherapyServiceData): AtendimentoPrintMedicationService {
  return {
    medications: service.medications.map((item) => mapMedication(item, '')),
    prescriberName: service.prescriberName,
    crmCro: service.crmCro,
    administrationRoute: '',
  };
}

function mapComplementaryServices(
  service: ComplementaryServicesData,
): AtendimentoPrintComplementaryServices {
  const selectedItems: string[] = [];

  if (service.homeCare) {
    selectedItems.push('Assistência farmacêutica domiciliar');
  }

  if (service.pharmacotherapeuticFollowUp) {
    selectedItems.push('Acompanhamento farmacoterapêutico');
  }

  if (service.minorDisorderIndication) {
    selectedItems.push('Indicação farmacêutica em transtornos menores');
  }

  return {
    selectedItems,
    signsAndSymptoms: service.signsAndSymptoms,
    medications: service.medications.map((item) => mapMedication(item, '')),
    recordNumber: service.recordNumber,
    attendanceDate: formatDate(service.attendanceDate),
  };
}

function mapMedication(
  item: ServiceMedicationItem,
  administrationRoute: string,
): AtendimentoPrintMedication {
  return {
    medicationConcentration: item.medicationConcentration,
    batch: item.batch,
    expirationDate: formatDate(item.expirationDate),
    dosage: item.dosage,
    administrationRoute,
  };
}

function formatDate(value: string): string {
  if (!value) {
    return '';
  }

  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return value;
  }

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function formatCep(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length !== 8) {
    return value;
  }

  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  return value;
}

function formatGender(value: string): string {
  if (!value) {
    return '';
  }

  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1).toLocaleLowerCase('pt-BR');
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
