import { Injectable, computed, signal } from '@angular/core';
import {
  AttendanceStatus,
  AttendanceStatusFilter,
  Comorbidity,
  CreatePharmaceuticalServiceAttendanceInput,
  FollowUpHistoryEntry,
  FollowUpProgress,
  Medication,
  Patient,
  PatientInput,
  PharmaceuticalServiceAttendance,
  PharmaceuticalServiceKey,
} from './clinical-records';
import { TemporaryClinicalRecordsStore } from './temporary-clinical-records-store';

interface TemporaryPharmaceuticalServiceState {
  patients: Patient[];
  attendances: PharmaceuticalServiceAttendance[];
}

const STORAGE_KEY = 'fen-temporary-pharmaceutical-services';

export const PHARMACEUTICAL_SERVICE_LABELS: Record<PharmaceuticalServiceKey, string> = {
  'cuidados-farmaceuticos': 'Cuidados farmacêuticos',
  'aplicacao-injetaveis': 'Aplicação de injetáveis',
  inaloterapia: 'Inaloterapia',
  'servicos-farmaceuticos': 'Serviços farmacêuticos',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  CONCLUIDO: 'Concluído',
  AGUARDANDO_RETORNO: 'Aguardando retorno',
  EXPIRADO: 'Expirado',
};

export interface PatientMedicationInteraction {
  medication: Medication;
  comorbidity: Comorbidity;
}

@Injectable({ providedIn: 'root' })
export class TemporaryPharmaceuticalServiceStore {
  private readonly state = signal<TemporaryPharmaceuticalServiceState>(this.readInitialState());

  readonly patients = computed(() => this.state().patients);
  readonly attendances = computed(() => this.state().attendances);

  constructor(private readonly clinicalRecordsStore: TemporaryClinicalRecordsStore) {}

  findPatientByCpf(cpf: string): Patient | undefined {
    const normalizedCpf = this.onlyDigits(cpf);

    return this.state().patients.find((patient) => patient.cpf === normalizedCpf);
  }

  getPatient(id: string): Patient | undefined {
    return this.state().patients.find((patient) => patient.id === id);
  }

  createPatient(input: PatientInput): Patient {
    return this.upsertPatient(input);
  }

  updatePatient(id: string, input: PatientInput): Patient | undefined {
    const existingPatient = this.getPatient(id);

    if (!existingPatient) {
      return undefined;
    }

    const normalizedCpf = this.onlyDigits(input.cpf);
    const patientWithCpf = this.findPatientByCpf(normalizedCpf);

    if (patientWithCpf && patientWithCpf.id !== id) {
      return undefined;
    }

    const patient = this.buildPatient(input, existingPatient);

    this.updateState({
      ...this.state(),
      patients: this.state().patients.map((currentPatient) =>
        currentPatient.id === id ? patient : currentPatient,
      ),
      attendances: this.state().attendances.map((attendance) =>
        attendance.patient.id === id ? { ...attendance, patient } : attendance,
      ),
    });

    return patient;
  }

  updatePatientComorbidities(id: string, comorbidityIds: string[]): Patient | undefined {
    const patient = this.getPatient(id);

    if (!patient) {
      return undefined;
    }

    return this.updatePatient(id, {
      ...patient,
      comorbidityIds,
    });
  }

  searchPatients(term: string): Patient[] {
    const query = this.normalize(term);

    if (!query) {
      return this.state().patients;
    }

    return this.state().patients.filter((patient) =>
      this.normalize(`${patient.name} ${patient.cpf}`).includes(query),
    );
  }

  getPatientComorbidities(id: string): Comorbidity[] {
    const patient = this.getPatient(id);

    if (!patient) {
      return [];
    }

    return patient.comorbidityIds.flatMap((comorbidityId) => {
      const comorbidity = this.clinicalRecordsStore.getComorbidity(comorbidityId);
      return comorbidity ? [comorbidity] : [];
    });
  }

  getPatientMedicationInteractions(
    patientId: string,
    medicationId: string,
  ): PatientMedicationInteraction[] {
    const medication = this.clinicalRecordsStore.getMedication(medicationId);

    if (!medication) {
      return [];
    }

    return this.getPatientComorbidities(patientId)
      .filter((comorbidity) => comorbidity.medicationInteractionIds.includes(medication.id))
      .map((comorbidity) => ({
        medication,
        comorbidity,
      }));
  }

  createAttendance(
    input: CreatePharmaceuticalServiceAttendanceInput,
  ): PharmaceuticalServiceAttendance {
    const patient = this.upsertPatient(input.patient);
    const id = this.createId();
    const attendance: PharmaceuticalServiceAttendance = {
      id,
      codigo: this.nextBusinessCode(),
      patient,
      selectedServices: input.selectedServices,
      status: input.followUp ? 'AGUARDANDO_RETORNO' : 'CONCLUIDO',
      createdAt: new Date().toISOString(),
      care: input.care,
      injectable: input.injectable,
      inhalotherapy: input.inhalotherapy,
      complementaryServices: input.complementaryServices,
      followUp: input.followUp,
      followUpLink: input.followUp
        ? {
            chainId: this.createId(),
            originAttendanceId: id,
            previousAttendanceId: null,
            returnNumber: 0,
          }
        : null,
    };

    this.updateState({
      ...this.state(),
      attendances: [attendance, ...this.state().attendances],
    });

    return attendance;
  }

  getAttendance(id: string): PharmaceuticalServiceAttendance | undefined {
    return this.state().attendances.find((attendance) => attendance.id === id);
  }

  createFollowUpReturn(
    previousAttendanceId: string,
    input: CreatePharmaceuticalServiceAttendanceInput,
  ): PharmaceuticalServiceAttendance | undefined {
    const previousAttendance = this.getAttendance(previousAttendanceId);
    const progress = this.followUpProgress(previousAttendanceId);

    if (
      !previousAttendance?.followUp ||
      !previousAttendance.followUpLink ||
      !progress.canContinue
    ) {
      return undefined;
    }

    const nextReturnNumber = progress.nextReturnNumber;

    if (!nextReturnNumber) {
      return undefined;
    }

    const patient = this.upsertPatient(input.patient);
    const id = this.createId();
    const attendance: PharmaceuticalServiceAttendance = {
      id,
      codigo: this.nextBusinessCode(),
      patient,
      selectedServices: input.selectedServices,
      status:
        nextReturnNumber < previousAttendance.followUp.returnCount
          ? 'AGUARDANDO_RETORNO'
          : 'CONCLUIDO',
      createdAt: new Date().toISOString(),
      care: input.care,
      injectable: input.injectable,
      inhalotherapy: input.inhalotherapy,
      complementaryServices: input.complementaryServices,
      followUp: previousAttendance.followUp,
      followUpLink: {
        chainId: previousAttendance.followUpLink.chainId,
        originAttendanceId: previousAttendance.followUpLink.originAttendanceId,
        previousAttendanceId: previousAttendance.id,
        returnNumber: nextReturnNumber,
      },
    };

    this.updateState({
      ...this.state(),
      attendances: [
        attendance,
        ...this.state().attendances.map((currentAttendance) =>
          currentAttendance.id === previousAttendance.id
            ? { ...currentAttendance, status: 'CONCLUIDO' as AttendanceStatus }
            : currentAttendance,
        ),
      ],
    });

    return attendance;
  }

  followUpProgress(id: string): FollowUpProgress {
    const attendance = this.getAttendance(id);
    const emptyProgress: FollowUpProgress = {
      returnCount: 0,
      completedReturns: 0,
      nextReturnNumber: null,
      canContinue: false,
    };

    if (!attendance?.followUp || !attendance.followUpLink) {
      return emptyProgress;
    }

    const chain = this.followUpChain(attendance);
    const completedReturns = chain.filter(
      (chainAttendance) => (chainAttendance.followUpLink?.returnNumber ?? 0) > 0,
    ).length;
    const returnCount = attendance.followUp.returnCount;
    const latestAttendance = chain.at(-1);
    const canContinue =
      latestAttendance?.id === attendance.id &&
      (attendance.status === 'AGUARDANDO_RETORNO' || attendance.status === 'EXPIRADO') &&
      completedReturns < returnCount;

    return {
      returnCount,
      completedReturns,
      nextReturnNumber: canContinue ? completedReturns + 1 : null,
      canContinue,
    };
  }

  followUpHistory(id: string): FollowUpHistoryEntry[] {
    const attendance = this.getAttendance(id);

    if (!attendance?.followUp || !attendance.followUpLink) {
      return [];
    }

    const chain = this.followUpChain(attendance);
    const registeredEntries = chain.map((chainAttendance) => {
      const returnNumber = chainAttendance.followUpLink?.returnNumber ?? 0;

      return {
        label: returnNumber === 0 ? 'Atendimento inicial' : `${returnNumber}º retorno`,
        attendanceId: chainAttendance.id,
        codigo: chainAttendance.codigo,
        status: chainAttendance.status,
        createdAt: chainAttendance.createdAt,
      };
    });

    const pendingEntries: FollowUpHistoryEntry[] = [];

    for (
      let returnNumber = registeredEntries.length;
      returnNumber <= attendance.followUp.returnCount;
      returnNumber += 1
    ) {
      pendingEntries.push({
        label: `${returnNumber}º retorno`,
        attendanceId: null,
        codigo: null,
        status: 'PENDENTE',
        createdAt: null,
      });
    }

    return [...registeredEntries, ...pendingEntries];
  }

  searchAttendances(
    term: string,
    statusFilter: AttendanceStatusFilter,
  ): PharmaceuticalServiceAttendance[] {
    const query = this.normalize(term);

    return this.state().attendances.filter((attendance) => {
      if (statusFilter !== 'TODOS' && attendance.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const services = attendance.selectedServices
        .map((service) => PHARMACEUTICAL_SERVICE_LABELS[service])
        .join(' ');

      return this.normalize(
        `${attendance.codigo} ${attendance.patient.name} ${attendance.patient.cpf} ${services}`,
      ).includes(query);
    });
  }

  markAttendanceExpired(id: string): boolean {
    return this.updateAttendanceStatus(id, 'EXPIRADO');
  }

  closeExpiredAttendance(id: string): boolean {
    const attendance = this.getAttendance(id);

    if (!attendance || attendance.status !== 'EXPIRADO') {
      return false;
    }

    return this.updateAttendanceStatus(id, 'CONCLUIDO');
  }

  private upsertPatient(input: PatientInput): Patient {
    const normalizedCpf = this.onlyDigits(input.cpf);
    const existingPatient = this.findPatientByCpf(normalizedCpf);
    const patient = this.buildPatient(input, existingPatient);

    const nextPatients = existingPatient
      ? this.state().patients.map((currentPatient) =>
          currentPatient.id === existingPatient.id ? patient : currentPatient,
        )
      : [...this.state().patients, patient];

    this.updateState({
      ...this.state(),
      patients: nextPatients,
    });

    return patient;
  }

  private buildPatient(input: PatientInput, existingPatient?: Patient): Patient {
    return {
      id: existingPatient?.id ?? this.createId(),
      name: input.name.trim(),
      cpf: this.onlyDigits(input.cpf),
      birthDate: input.birthDate,
      cellPhone: this.onlyDigits(input.cellPhone),
      gender: input.gender,
      cep: this.onlyDigits(input.cep ?? ''),
      address: input.address.trim(),
      neighborhood: input.neighborhood?.trim() ?? '',
      city: input.city.trim(),
      state: input.state.trim().toLocaleUpperCase('pt-BR'),
      phone: this.onlyDigits(input.phone),
      responsibleName: input.responsibleName.trim(),
      comorbidityIds: this.uniqueComorbidityIds(
        input.comorbidityIds ?? existingPatient?.comorbidityIds ?? [],
      ),
      createdAt: existingPatient?.createdAt ?? new Date().toISOString(),
    };
  }

  private uniqueComorbidityIds(ids: string[]): string[] {
    const uniqueIds: string[] = [];

    for (const id of ids) {
      if (this.clinicalRecordsStore.getComorbidity(id) && !uniqueIds.includes(id)) {
        uniqueIds.push(id);
      }
    }

    return uniqueIds;
  }

  private updateAttendanceStatus(id: string, status: AttendanceStatus): boolean {
    const attendance = this.getAttendance(id);

    if (!attendance) {
      return false;
    }

    this.updateState({
      ...this.state(),
      attendances: this.state().attendances.map((currentAttendance) =>
        currentAttendance.id === id ? { ...currentAttendance, status } : currentAttendance,
      ),
    });

    return true;
  }

  private updateState(nextState: TemporaryPharmaceuticalServiceState): void {
    this.state.set(nextState);
    this.writeState(nextState);
  }

  private readInitialState(): TemporaryPharmaceuticalServiceState {
    const fallback: TemporaryPharmaceuticalServiceState = {
      patients: [],
      attendances: [],
    };

    try {
      const rawState = globalThis.localStorage?.getItem(STORAGE_KEY);

      if (!rawState) {
        return fallback;
      }

      const parsedState = JSON.parse(rawState) as Partial<TemporaryPharmaceuticalServiceState>;

      return {
        patients: Array.isArray(parsedState.patients)
          ? parsedState.patients.map((patient) => ({
              ...patient,
              comorbidityIds: Array.isArray(patient.comorbidityIds)
                ? this.uniqueComorbidityIds(patient.comorbidityIds)
                : [],
            }))
          : [],
        attendances: Array.isArray(parsedState.attendances)
          ? this.hydrateAttendances(parsedState.attendances)
          : [],
      };
    } catch {
      return fallback;
    }
  }

  private writeState(state: TemporaryPharmaceuticalServiceState): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      return;
    }
  }

  private normalize(value: string): string {
    return this.onlyDigits(value) === value.trim() && value.trim()
      ? this.onlyDigits(value)
      : value
          .trim()
          .toLocaleLowerCase('pt-BR')
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '');
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }

  private nextBusinessCode(): number {
    const greatestCode = this.state().attendances.reduce(
      (maxCode, attendance) => Math.max(maxCode, attendance.codigo || 0),
      1000,
    );

    return greatestCode + 1;
  }

  private followUpChain(
    attendance: PharmaceuticalServiceAttendance,
  ): PharmaceuticalServiceAttendance[] {
    if (!attendance.followUpLink) {
      return [];
    }

    return this.state()
      .attendances.filter(
        (currentAttendance) =>
          currentAttendance.followUpLink?.chainId === attendance.followUpLink?.chainId,
      )
      .sort(
        (firstAttendance, secondAttendance) =>
          (firstAttendance.followUpLink?.returnNumber ?? 0) -
          (secondAttendance.followUpLink?.returnNumber ?? 0),
      );
  }

  private hydrateAttendances(
    attendances: Partial<PharmaceuticalServiceAttendance>[],
  ): PharmaceuticalServiceAttendance[] {
    let nextCode = attendances.reduce(
      (maxCode, attendance) =>
        typeof attendance.codigo === 'number' ? Math.max(maxCode, attendance.codigo) : maxCode,
      1000,
    );

    return attendances.map((attendance) => {
      const id = attendance.id ?? this.createId();
      const codigo = typeof attendance.codigo === 'number' ? attendance.codigo : (nextCode += 1);

      return {
        ...attendance,
        id,
        codigo,
        followUpLink:
          attendance.followUp && !attendance.followUpLink
            ? {
                chainId: id,
                originAttendanceId: id,
                previousAttendanceId: null,
                returnNumber: 0,
              }
            : (attendance.followUpLink ?? null),
      } as PharmaceuticalServiceAttendance;
    });
  }
}
