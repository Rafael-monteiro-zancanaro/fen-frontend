import { Injectable, computed, signal } from '@angular/core';
import {
  AttendanceStatus,
  AttendanceStatusFilter,
  CreatePharmaceuticalServiceAttendanceInput,
  Patient,
  PatientInput,
  PharmaceuticalServiceAttendance,
  PharmaceuticalServiceKey,
} from './clinical-records';

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

@Injectable({ providedIn: 'root' })
export class TemporaryPharmaceuticalServiceStore {
  private readonly state = signal<TemporaryPharmaceuticalServiceState>(this.readInitialState());

  readonly patients = computed(() => this.state().patients);
  readonly attendances = computed(() => this.state().attendances);

  findPatientByCpf(cpf: string): Patient | undefined {
    const normalizedCpf = this.onlyDigits(cpf);

    return this.state().patients.find((patient) => patient.cpf === normalizedCpf);
  }

  createAttendance(
    input: CreatePharmaceuticalServiceAttendanceInput,
  ): PharmaceuticalServiceAttendance {
    const patient = this.upsertPatient(input.patient);
    const attendance: PharmaceuticalServiceAttendance = {
      id: this.createId(),
      patient,
      selectedServices: input.selectedServices,
      status: input.followUp ? 'AGUARDANDO_RETORNO' : 'CONCLUIDO',
      createdAt: new Date().toISOString(),
      care: input.care,
      injectable: input.injectable,
      inhalotherapy: input.inhalotherapy,
      complementaryServices: input.complementaryServices,
      followUp: input.followUp,
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

      return this.normalize(`${attendance.patient.name} ${attendance.patient.cpf} ${services}`).includes(
        query,
      );
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
    const patient: Patient = {
      id: existingPatient?.id ?? this.createId(),
      name: input.name.trim(),
      cpf: normalizedCpf,
      birthDate: input.birthDate,
      cellPhone: this.onlyDigits(input.cellPhone),
      gender: input.gender,
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim().toLocaleUpperCase('pt-BR'),
      phone: this.onlyDigits(input.phone),
      responsibleName: input.responsibleName.trim(),
      createdAt: existingPatient?.createdAt ?? new Date().toISOString(),
    };

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
        patients: Array.isArray(parsedState.patients) ? parsedState.patients : [],
        attendances: Array.isArray(parsedState.attendances) ? parsedState.attendances : [],
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
}
