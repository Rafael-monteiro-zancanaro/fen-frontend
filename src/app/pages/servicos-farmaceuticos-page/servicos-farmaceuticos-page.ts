import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowDownCircle,
  bootstrapCapsule,
  bootstrapClipboard,
  bootstrapClipboardPulse,
  bootstrapDroplet,
  bootstrapHouseHeart,
  bootstrapLungs,
  bootstrapSave,
} from '@ng-icons/bootstrap-icons';
import { MedicationAutocomplete } from '../../components/medication-autocomplete/medication-autocomplete';
import { PatientForm } from '../../components/patient-form/patient-form';
import {
  CareServiceData,
  ComplementaryServicesData,
  FollowUpData,
  InjectableServiceData,
  InhalotherapyServiceData,
  Medication,
  Patient,
  PatientInput,
  PharmaceuticalServiceKey,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import { onlyDigits } from '../../domain/text-masks';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';
import {
  PatientMedicationInteraction,
  TemporaryPharmaceuticalServiceStore,
} from '../../domain/temporary-pharmaceutical-service-store';

type OptionalStep =
  | 'cuidados-farmaceuticos'
  | 'aplicacao-injetaveis'
  | 'inaloterapia'
  | 'servicos-acompanhamento'
  | 'acompanhamento';

type MedicationSection = 'injectable' | 'inhalotherapy' | 'complementary';

interface MedicationDraft {
  medicationId: string;
  medicationConcentration: string;
  batch: string;
  expirationDate: string;
  dosage: string;
}

@Component({
  selector: 'app-servicos-farmaceuticos-page',
  imports: [FormsModule, MedicationAutocomplete, NgIcon, PatientForm, RouterLink],
  providers: [
    provideIcons({
      bootstrapArrowDownCircle,
      bootstrapCapsule,
      bootstrapClipboard,
      bootstrapClipboardPulse,
      bootstrapDroplet,
      bootstrapHouseHeart,
      bootstrapLungs,
      bootstrapSave,
    }),
  ],
  templateUrl: './servicos-farmaceuticos-page.html',
})
export class ServicosFarmaceuticosPage {
  protected readonly steps = [
    { number: '01', title: 'Identificação do usuário', id: 'identificacao-usuario' },
    { number: '02', title: 'Cuidados farmacêuticos', id: 'cuidados-farmaceuticos' },
    { number: '03', title: 'Aplicação de injetáveis', id: 'aplicacao-injetaveis' },
    { number: '04', title: 'Inaloterapia', id: 'inaloterapia' },
    { number: '05', title: 'Serviços farmacêuticos', id: 'servicos-acompanhamento' },
    { number: '06', title: 'Acompanhamento', id: 'acompanhamento' },
  ];
  protected readonly enabledSteps: Record<OptionalStep, boolean> = {
    'cuidados-farmaceuticos': false,
    'aplicacao-injetaveis': false,
    inaloterapia: false,
    'servicos-acompanhamento': false,
    acompanhamento: false,
  };
  protected readonly patient: PatientInput = {
    name: '',
    cpf: '',
    birthDate: '',
    cellPhone: '',
    gender: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    phone: '',
    responsibleName: '',
  };
  protected readonly care: CareServiceData = {
    bloodGlucose: '',
    systolicPressure: '',
    diastolicPressure: '',
    bodyTemperature: '',
  };
  protected readonly injectable = {
    administrationRoute: '',
    prescriberName: '',
    crmCro: '',
  };
  protected readonly inhalotherapy = {
    prescriberName: '',
    crmCro: '',
  };
  protected readonly complementary = {
    homeCare: false,
    pharmacotherapeuticFollowUp: false,
    minorDisorderIndication: false,
    signsAndSymptoms: '',
    recordNumber: '',
    attendanceDate: '',
  };
  protected readonly followUp = {
    returnIntervalDays: '',
    returnCount: '',
  };
  protected readonly medicationDrafts: Record<MedicationSection, MedicationDraft> = {
    injectable: this.createEmptyMedicationDraft(),
    inhalotherapy: this.createEmptyMedicationDraft(),
    complementary: this.createEmptyMedicationDraft(),
  };
  protected readonly medicationItems: Record<MedicationSection, ServiceMedicationItem[]> = {
    injectable: [],
    inhalotherapy: [],
    complementary: [],
  };
  protected readonly errors: Record<string, string> = {};
  protected readonly medicationErrors: Record<
    MedicationSection,
    Partial<Record<keyof MedicationDraft, string>>
  > = {
    injectable: {},
    inhalotherapy: {},
    complementary: {},
  };
  protected selectedPatientId = '';

  constructor(
    private readonly store: TemporaryPharmaceuticalServiceStore,
    private readonly clinicalRecordsStore: TemporaryClinicalRecordsStore,
    private readonly router: Router,
  ) {}

  protected scrollToStep(stepId: string): void {
    document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected toggleOptionalStep(step: OptionalStep, enabled: boolean): void {
    this.enabledSteps[step] = enabled;
  }

  protected isStepEnabled(step: OptionalStep): boolean {
    return this.enabledSteps[step];
  }

  protected selectPatient(patient: Patient | null): void {
    this.selectedPatientId = patient?.id ?? '';
  }

  protected selectMedication(section: MedicationSection, medication: Medication): void {
    this.medicationDrafts[section].medicationId = medication.id;
    this.medicationDrafts[section].medicationConcentration = this.formatMedication(medication);
    delete this.medicationErrors[section].medicationConcentration;
  }

  protected updateMedicationQuery(section: MedicationSection, value: string): void {
    const draft = this.medicationDrafts[section];
    draft.medicationConcentration = value;
    const selectedMedication = draft.medicationId
      ? this.clinicalRecordsStore.getMedication(draft.medicationId)
      : null;

    if (
      selectedMedication &&
      draft.medicationConcentration === this.formatMedication(selectedMedication)
    ) {
      return;
    }

    draft.medicationId = '';
  }

  protected medicationInteractionWarnings(section: MedicationSection): PatientMedicationInteraction[] {
    const medicationId = this.medicationDrafts[section].medicationId;

    if (!this.selectedPatientId || !medicationId) {
      return [];
    }

    return this.store.getPatientMedicationInteractions(this.selectedPatientId, medicationId);
  }

  protected hasBloodGlucoseWarning(): boolean {
    const value = this.parseNumericValue(this.care.bloodGlucose);

    return value !== null && value > 110;
  }

  protected systolicPressureWarning(): string {
    return this.referenceWarningMessage(
      this.care.systolicPressure,
      120,
      'A pressão sistólica',
      '120 mmHg',
    );
  }

  protected diastolicPressureWarning(): string {
    return this.referenceWarningMessage(
      this.care.diastolicPressure,
      80,
      'A pressão diastólica',
      '80 mmHg',
    );
  }

  protected hasBodyTemperatureWarning(): boolean {
    const value = this.parseNumericValue(this.care.bodyTemperature);

    return value !== null && value > 37;
  }

  protected updateCareField(field: keyof CareServiceData, value: string): void {
    this.care[field] = value;
  }

  protected addMedication(section: MedicationSection): void {
    if (!this.validateMedicationDraft(section)) {
      return;
    }

    const draft = this.medicationDrafts[section];
    this.medicationItems[section] = [
      ...this.medicationItems[section],
      {
        id: this.createId(),
        medicationId: draft.medicationId,
        medicationConcentration: draft.medicationConcentration.trim(),
        batch: draft.batch.trim(),
        expirationDate: draft.expirationDate,
        dosage: draft.dosage.trim(),
      },
    ];
    this.medicationDrafts[section] = this.createEmptyMedicationDraft();
    this.medicationErrors[section] = {};
  }

  protected removeMedication(section: MedicationSection, id: string): void {
    this.medicationItems[section] = this.medicationItems[section].filter((item) => item.id !== id);
  }

  protected followUpPreview(): string {
    const interval = Number(this.followUp.returnIntervalDays);
    const count = Number(this.followUp.returnCount);

    if (!Number.isInteger(interval) || interval <= 0 || !Number.isInteger(count) || count <= 0) {
      return '';
    }

    return `O paciente deverá retornar a cada ${interval} dias, ${count} vezes.`;
  }

  protected submit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.store.createAttendance({
      patient: {
        ...this.patient,
        cpf: onlyDigits(this.patient.cpf),
        cellPhone: onlyDigits(this.patient.cellPhone),
        cep: onlyDigits(this.patient.cep ?? ''),
        phone: onlyDigits(this.patient.phone),
      },
      selectedServices: this.selectedServices(),
      care: this.enabledSteps['cuidados-farmaceuticos'] ? { ...this.care } : null,
      injectable: this.enabledSteps['aplicacao-injetaveis'] ? this.injectableData() : null,
      inhalotherapy: this.enabledSteps.inaloterapia ? this.inhalotherapyData() : null,
      complementaryServices: this.enabledSteps['servicos-acompanhamento']
        ? this.complementaryServicesData()
        : null,
      followUp: this.enabledSteps.acompanhamento ? this.followUpData() : null,
    });

    void this.router.navigateByUrl('/atendimentos');
  }

  private selectedServices(): PharmaceuticalServiceKey[] {
    const services: PharmaceuticalServiceKey[] = [];

    if (this.enabledSteps['cuidados-farmaceuticos']) {
      services.push('cuidados-farmaceuticos');
    }

    if (this.enabledSteps['aplicacao-injetaveis']) {
      services.push('aplicacao-injetaveis');
    }

    if (this.enabledSteps.inaloterapia) {
      services.push('inaloterapia');
    }

    if (this.enabledSteps['servicos-acompanhamento']) {
      services.push('servicos-farmaceuticos');
    }

    return services;
  }

  private injectableData(): InjectableServiceData {
    return {
      medications: this.medicationItems.injectable,
      administrationRoute: this.injectable.administrationRoute,
      prescriberName: this.injectable.prescriberName,
      crmCro: this.injectable.crmCro,
    };
  }

  private inhalotherapyData(): InhalotherapyServiceData {
    return {
      medications: this.medicationItems.inhalotherapy,
      prescriberName: this.inhalotherapy.prescriberName,
      crmCro: this.inhalotherapy.crmCro,
    };
  }

  private complementaryServicesData(): ComplementaryServicesData {
    return {
      homeCare: this.complementary.homeCare,
      pharmacotherapeuticFollowUp: this.complementary.pharmacotherapeuticFollowUp,
      minorDisorderIndication: this.complementary.minorDisorderIndication,
      signsAndSymptoms: this.complementary.signsAndSymptoms,
      medications: this.medicationItems.complementary,
      recordNumber: this.complementary.recordNumber,
      attendanceDate: this.complementary.attendanceDate,
    };
  }

  private followUpData(): FollowUpData {
    return {
      returnIntervalDays: Number(this.followUp.returnIntervalDays),
      returnCount: Number(this.followUp.returnCount),
    };
  }

  private validateForm(): boolean {
    this.clearErrors();
    const cpf = onlyDigits(this.patient.cpf);

    if (cpf.length !== 11) {
      this.errors['patient.cpf'] = 'Informe um CPF com 11 dígitos.';
    }

    if (!this.patient.name.trim()) {
      this.errors['patient.name'] = 'Nome do paciente é obrigatório.';
    }

    if (!this.patient.birthDate) {
      this.errors['patient.birthDate'] = 'Data de nascimento é obrigatória.';
    }

    if (onlyDigits(this.patient.cellPhone).length < 10) {
      this.errors['patient.cellPhone'] = 'Telefone celular é obrigatório.';
    }

    if (this.enabledSteps['aplicacao-injetaveis'] && this.medicationItems.injectable.length === 0) {
      this.errors['injectableMedications'] = 'Adicione ao menos um medicamento.';
    }

    if (this.enabledSteps.inaloterapia && this.medicationItems.inhalotherapy.length === 0) {
      this.errors['inhalotherapyMedications'] = 'Adicione ao menos um medicamento.';
    }

    if (
      this.enabledSteps['servicos-acompanhamento'] &&
      this.medicationItems.complementary.length === 0
    ) {
      this.errors['complementaryMedications'] = 'Adicione ao menos um medicamento.';
    }

    if (this.enabledSteps.acompanhamento) {
      const interval = Number(this.followUp.returnIntervalDays);
      const count = Number(this.followUp.returnCount);

      if (!Number.isInteger(interval) || interval <= 0) {
        this.errors['returnIntervalDays'] = 'Informe um intervalo positivo em dias.';
      }

      if (!Number.isInteger(count) || count <= 0) {
        this.errors['returnCount'] = 'Informe uma quantidade positiva de retornos.';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  private validateMedicationDraft(section: MedicationSection): boolean {
    const draft = this.medicationDrafts[section];
    const errors: Partial<Record<keyof MedicationDraft, string>> = {};

    if (!draft.medicationId) {
      errors.medicationConcentration = 'Selecione um medicamento cadastrado.';
    }

    if (!draft.batch.trim()) {
      errors.batch = 'Informe o lote.';
    }

    if (!draft.expirationDate) {
      errors.expirationDate = 'Informe a validade.';
    }

    if (!draft.dosage.trim()) {
      errors.dosage = 'Informe a posologia.';
    }

    this.medicationErrors[section] = errors;

    return Object.keys(errors).length === 0;
  }

  private clearErrors(): void {
    for (const key of Object.keys(this.errors)) {
      delete this.errors[key];
    }
  }

  private createEmptyMedicationDraft(): MedicationDraft {
    return {
      medicationId: '',
      medicationConcentration: '',
      batch: '',
      expirationDate: '',
      dosage: '',
    };
  }

  private formatMedication(medication: Medication): string {
    return medication.measurementUnit
      ? `${medication.name} — ${medication.measurementUnit}`
      : medication.name;
  }

  private parseNumericValue(value: string): number | null {
    const normalizedValue = String(value).trim().replace(',', '.');

    if (!normalizedValue) {
      return null;
    }

    const parsed = Number(normalizedValue);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private referenceWarningMessage(
    value: string,
    reference: number,
    label: string,
    referenceLabel: string,
  ): string {
    const parsed = this.parseNumericValue(value);

    if (parsed === null || parsed === reference) {
      return '';
    }

    const direction = parsed > reference ? 'maior' : 'menor';

    return `${label} está ${direction} que o valor de referência (${referenceLabel}).`;
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }
}
