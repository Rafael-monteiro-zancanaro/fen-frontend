export interface Medication {
  id: string;
  name: string;
  measurementUnit: string;
  administrationRoute: string;
  createdAt: string;
}

export interface Comorbidity {
  id: string;
  name: string;
  medicationInteractionIds: string[];
  createdAt: string;
}

export interface CreateMedicationInput {
  name: string;
  measurementUnit: string;
  administrationRoute: string;
}

export interface CreateComorbidityInput {
  name: string;
  medicationInteractionIds: string[];
}

export type AttendanceStatus = 'CONCLUIDO' | 'AGUARDANDO_RETORNO' | 'EXPIRADO';

export type AttendanceStatusFilter = AttendanceStatus | 'TODOS';

export type PharmaceuticalServiceKey =
  'cuidados-farmaceuticos' | 'aplicacao-injetaveis' | 'inaloterapia' | 'servicos-farmaceuticos';

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  cellPhone: string;
  gender: string;
  cep?: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  phone: string;
  responsibleName: string;
  comorbidityIds: string[];
  createdAt: string;
}

export interface PatientInput {
  name: string;
  cpf: string;
  birthDate: string;
  cellPhone: string;
  gender: string;
  cep?: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  phone: string;
  responsibleName: string;
  comorbidityIds?: string[];
}

export interface CareServiceData {
  bloodGlucose: string;
  systolicPressure: string;
  diastolicPressure: string;
  bodyTemperature: string;
}

export interface ServiceMedicationItem {
  id: string;
  medicationId?: string;
  medicationConcentration: string;
  batch: string;
  expirationDate: string;
  dosage: string;
}

export interface InjectableServiceData {
  medications: ServiceMedicationItem[];
  administrationRoute: string;
  prescriberName: string;
  crmCro: string;
}

export interface InhalotherapyServiceData {
  medications: ServiceMedicationItem[];
  prescriberName: string;
  crmCro: string;
}

export interface ComplementaryServicesData {
  homeCare: boolean;
  pharmacotherapeuticFollowUp: boolean;
  minorDisorderIndication: boolean;
  signsAndSymptoms: string;
  medications: ServiceMedicationItem[];
  recordNumber: string;
  attendanceDate: string;
}

export interface FollowUpData {
  returnIntervalDays: number;
  returnCount: number;
}

export interface FollowUpLink {
  chainId: string;
  originAttendanceId: string;
  previousAttendanceId: string | null;
  returnNumber: number;
}

export interface FollowUpProgress {
  returnCount: number;
  completedReturns: number;
  nextReturnNumber: number | null;
  canContinue: boolean;
}

export type FollowUpHistoryStatus = AttendanceStatus | 'PENDENTE';

export interface FollowUpHistoryEntry {
  label: string;
  attendanceId: string | null;
  codigo: number | null;
  status: FollowUpHistoryStatus;
  createdAt: string | null;
}

export interface PharmaceuticalServiceAttendance {
  id: string;
  codigo: number;
  patient: Patient;
  selectedServices: PharmaceuticalServiceKey[];
  status: AttendanceStatus;
  createdAt: string;
  care: CareServiceData | null;
  injectable: InjectableServiceData | null;
  inhalotherapy: InhalotherapyServiceData | null;
  complementaryServices: ComplementaryServicesData | null;
  followUp: FollowUpData | null;
  followUpLink: FollowUpLink | null;
}

export interface CreatePharmaceuticalServiceAttendanceInput {
  patient: PatientInput;
  selectedServices: PharmaceuticalServiceKey[];
  care: CareServiceData | null;
  injectable: InjectableServiceData | null;
  inhalotherapy: InhalotherapyServiceData | null;
  complementaryServices: ComplementaryServicesData | null;
  followUp: FollowUpData | null;
}
