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
import {
  CareServiceData,
  ComplementaryServicesData,
  FollowUpData,
  InjectableServiceData,
  InhalotherapyServiceData,
  PatientInput,
  PharmaceuticalServiceKey,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import { TemporaryPharmaceuticalServiceStore } from '../../domain/temporary-pharmaceutical-service-store';

type OptionalStep =
  | 'cuidados-farmaceuticos'
  | 'aplicacao-injetaveis'
  | 'inaloterapia'
  | 'servicos-acompanhamento'
  | 'acompanhamento';

type MedicationSection = 'injectable' | 'inhalotherapy' | 'complementary';

interface MedicationDraft {
  medicationConcentration: string;
  batch: string;
  expirationDate: string;
  dosage: string;
}

@Component({
  selector: 'app-servicos-farmaceuticos-page',
  imports: [FormsModule, NgIcon, RouterLink],
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
    address: '',
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
  protected readonly medicationErrors: Record<MedicationSection, Partial<Record<keyof MedicationDraft, string>>> = {
    injectable: {},
    inhalotherapy: {},
    complementary: {},
  };
  protected patientLookupMessage = '';
  protected patientLookupVariant: 'info' | 'success' = 'info';

  constructor(
    private readonly store: TemporaryPharmaceuticalServiceStore,
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

  protected consultPatientByCpf(): void {
    const cpfInput = document.getElementById('cpfUsuario') as HTMLInputElement | null;
    const cpf = this.onlyDigits(this.patient.cpf || cpfInput?.value || '');
    this.patient.cpf = cpf;

    if (cpf.length !== 11) {
      this.errors['patient.cpf'] = 'Informe um CPF com 11 dígitos para consultar.';
      this.patientLookupMessage = '';
      return;
    }

    delete this.errors['patient.cpf'];
    const existingPatient = this.store.findPatientByCpf(cpf);

    if (existingPatient) {
      this.patient.name = existingPatient.name;
      this.patient.birthDate = existingPatient.birthDate;
      this.patient.cellPhone = existingPatient.cellPhone;
      this.patient.gender = existingPatient.gender;
      this.patient.address = existingPatient.address;
      this.patient.city = existingPatient.city;
      this.patient.state = existingPatient.state;
      this.patient.phone = existingPatient.phone;
      this.patient.responsibleName = existingPatient.responsibleName;
      this.syncPatientInputs();
      this.patientLookupVariant = 'info';
      this.patientLookupMessage = 'Paciente encontrado. Os dados foram preenchidos automaticamente.';
      return;
    }

    this.patientLookupVariant = 'success';
    this.patientLookupMessage = 'CPF não encontrado. Preencha os dados para cadastrar um novo paciente.';
  }

  protected updateCpf(value: string): void {
    this.patient.cpf = this.onlyDigits(value);

    if (this.patient.cpf.length === 11) {
      this.consultPatientByCpf();
    }
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
        cpf: this.onlyDigits(this.patient.cpf),
        cellPhone: this.onlyDigits(this.patient.cellPhone),
        phone: this.onlyDigits(this.patient.phone),
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
    this.patient.cpf = this.onlyDigits(this.patient.cpf);

    if (this.patient.cpf.length !== 11) {
      this.errors['patient.cpf'] = 'Informe um CPF com 11 dígitos.';
    }

    if (!this.patient.name.trim()) {
      this.errors['patient.name'] = 'Nome do paciente é obrigatório.';
    }

    if (!this.patient.birthDate) {
      this.errors['patient.birthDate'] = 'Data de nascimento é obrigatória.';
    }

    if (this.onlyDigits(this.patient.cellPhone).length < 10) {
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

    if (!draft.medicationConcentration.trim()) {
      errors.medicationConcentration = 'Informe o medicamento/concentração.';
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
      medicationConcentration: '',
      batch: '',
      expirationDate: '',
      dosage: '',
    };
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private syncPatientInputs(): void {
    const values: Record<string, string> = {
      nomeUsuario: this.patient.name,
      dataNascimentoUsuario: this.patient.birthDate,
      celularUsuario: this.patient.cellPhone,
      telefoneUsuario: this.patient.phone,
      enderecoUsuario: this.patient.address,
      cidadeUsuario: this.patient.city,
      estadoUsuario: this.patient.state,
      responsavelUsuario: this.patient.responsibleName,
    };

    for (const [id, value] of Object.entries(values)) {
      const input = document.getElementById(id) as HTMLInputElement | null;

      if (input) {
        input.value = value;
      }
    }
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }
}
