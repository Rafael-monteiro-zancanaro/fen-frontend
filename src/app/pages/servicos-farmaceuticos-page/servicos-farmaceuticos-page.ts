import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  FollowUpExtensionData,
  FollowUpProgress,
  InjectableServiceData,
  InhalotherapyServiceData,
  Medication,
  Patient,
  PatientInput,
  PharmacotherapeuticFollowUpServiceData,
  PharmaceuticalServiceAttendance,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import { maskBrazilianPhone, maskCep, maskCpf, onlyDigits } from '../../domain/text-masks';
import { InteractionService, MedicationInteractionPair } from '../../domain/interaction.service';
import { ATTENDANCE_FORM_MODES, AttendanceFormMode } from '../../domain/attendance-form-mode';
import { ServicoFarmaceuticoService } from '../../domain/servico-farmaceutico.service';

type OptionalStep =
  | 'cuidados-farmaceuticos'
  | 'aplicacao-injetaveis'
  | 'inaloterapia'
  | 'servicos-acompanhamento'
  | 'acompanhamento-farmacoterapeutico'
  | 'acompanhamento';

type MedicationSection =
  | 'injectable'
  | 'inhalotherapy'
  | 'complementary'
  | 'pharmacotherapeuticFollowUp';

interface MedicationDraft {
  medicationId: string;
  medicationConcentration: string;
  batch: string;
  expirationDate: string;
  dosage: string;
  administrationRoute: string;
  prescriberName: string;
  prescriberRegistration: string;
}

@Component({
  selector: 'app-servicos-farmaceuticos-page',
  imports: [DatePipe, FormsModule, MedicationAutocomplete, NgIcon, NgTemplateOutlet, PatientForm, RouterLink],
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
  protected readonly allSteps = [
    { number: '01', title: 'Identificação do usuário', id: 'identificacao-usuario' },
    { number: '02', title: 'Cuidados farmacêuticos', id: 'cuidados-farmaceuticos' },
    { number: '03', title: 'Aplicação de injetáveis', id: 'aplicacao-injetaveis' },
    { number: '04', title: 'Inaloterapia', id: 'inaloterapia' },
    { number: '05', title: 'Serviços farmacêuticos', id: 'servicos-acompanhamento' },
    {
      number: '06',
      title: 'Farmacoterapia',
      id: 'acompanhamento-farmacoterapeutico',
    },
    { number: '07', title: 'Acompanhamento', id: 'acompanhamento' },
  ];
  protected readonly enabledSteps: Record<OptionalStep, boolean> = {
    'cuidados-farmaceuticos': false,
    'aplicacao-injetaveis': false,
    inaloterapia: false,
    'servicos-acompanhamento': false,
    'acompanhamento-farmacoterapeutico': false,
    acompanhamento: false,
  };
  protected readonly patient = signal<PatientInput>({
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
  });
  protected readonly care: CareServiceData = {
    bloodGlucose: '',
    systolicPressure: '',
    diastolicPressure: '',
    bodyTemperature: '',
  };
  protected readonly complementary = {
    homeCare: false,
    minorDisorderIndication: false,
    signsAndSymptoms: '',
  };
  protected readonly pharmacotherapy = {
    signsAndSymptoms: '',
  };
  protected readonly followUp = {
    returnIntervalDays: '',
    returnCount: '',
  };
  protected readonly medicationDrafts: Record<MedicationSection, MedicationDraft> = {
    injectable: this.createEmptyMedicationDraft(),
    inhalotherapy: this.createEmptyMedicationDraft(),
    complementary: this.createEmptyMedicationDraft(),
    pharmacotherapeuticFollowUp: this.createEmptyMedicationDraft(),
  };
  protected readonly medicationItems: Record<MedicationSection, ServiceMedicationItem[]> = {
    injectable: [],
    inhalotherapy: [],
    complementary: [],
    pharmacotherapeuticFollowUp: [],
  };
  private readonly selectedMedications: Partial<Record<MedicationSection, Medication>> = {};
  private readonly interactionWarnings: Record<MedicationSection, MedicationInteractionPair[]> = {
    injectable: [],
    inhalotherapy: [],
    complementary: [],
    pharmacotherapeuticFollowUp: [],
  };
  protected readonly errors: Record<string, string> = {};
  protected readonly medicationErrors: Record<
    MedicationSection,
    Partial<Record<keyof MedicationDraft, string>>
  > = {
    injectable: {},
    inhalotherapy: {},
    complementary: {},
    pharmacotherapeuticFollowUp: {},
  };
  protected previousAttendance: PharmaceuticalServiceAttendance | undefined;
  protected followUpContext: FollowUpProgress | undefined;
  protected selectedPatientId = '';
  protected isSubmitting = false;
  protected readonly isInitialRecordLoading = signal(false);
  private readonly formMode: AttendanceFormMode;
  private editingAttendanceId = '';
  private editingReturn = false;
  private nextLocalMedicationKey = 1;

  constructor(
    private readonly service: ServicoFarmaceuticoService,
    private readonly interactions: InteractionService,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    this.formMode =
      (route.snapshot.data['attendanceFormMode'] as AttendanceFormMode | undefined) ??
      ATTENDANCE_FORM_MODES.CREATE;
    const attendanceId = route.snapshot.paramMap.get('id');
    if (this.formMode === ATTENDANCE_FORM_MODES.EDIT && attendanceId) {
      this.isInitialRecordLoading.set(true);
      this.loadForEdit(attendanceId);
    } else if (this.formMode === ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN && attendanceId) {
      this.isInitialRecordLoading.set(true);
      const previousAttendanceId = attendanceId;
      this.service.continuation(previousAttendanceId).subscribe({
        next: (context) => {
          this.previousAttendance = {
            id: context.previousAttendanceId,
            codigo: context.previousAttendanceCode,
            patient: context.patient,
          } as PharmaceuticalServiceAttendance;
          this.followUpContext = {
            ...context.followUpProgress,
            canExtendFollowUp: context.canExtendFollowUp,
          };
          this.fillPatientFromCurrentRecord(context.patient);
          this.selectedPatientId = context.patient.id;
          this.isInitialRecordLoading.set(false);
        },
        error: () => {
          this.errors['submit'] =
            'Não foi possível prosseguir o atendimento. Atualize a listagem e tente novamente.';
          this.isInitialRecordLoading.set(false);
        },
      });
    }
  }

  protected steps(): typeof this.allSteps {
    if (
      (this.formMode !== ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN || this.canExtendFollowUp()) &&
      !this.editingReturn
    ) {
      return this.allSteps;
    }

    return this.allSteps.filter((step) => step.id !== 'acompanhamento');
  }

  protected isFollowUpContinuation(): boolean {
    return this.formMode === ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN;
  }

  protected hasFollowUpContext(): boolean {
    return Boolean(this.previousAttendance && this.followUpContext);
  }

  protected isEditing(): boolean {
    return this.formMode === ATTENDANCE_FORM_MODES.EDIT;
  }

  protected isPatientLocked(): boolean {
    return this.formMode !== ATTENDANCE_FORM_MODES.CREATE;
  }

  protected isEditingReturn(): boolean {
    return this.editingReturn;
  }

  protected canExtendFollowUp(): boolean {
    return this.isFollowUpContinuation() && this.followUpContext?.canExtendFollowUp === true;
  }

  protected pageTitle(): string {
    if (this.isEditing()) {
      return 'Editar atendimento';
    }

    return this.isFollowUpContinuation() ? 'Continuar atendimento' : 'Novo atendimento';
  }

  protected pageDescription(): string {
    if (this.isFollowUpContinuation()) {
      return 'Registre os serviços realizados neste retorno. O acompanhamento original será preservado.';
    }

    if (this.isEditing()) {
      return 'Atualize os serviços realizados. Os dados cadastrais do paciente permanecem vinculados ao atendimento original.';
    }

    return 'Identifique o paciente e selecione apenas os serviços realizados neste atendimento. Estes procedimentos não substituem consulta médica ou exames laboratoriais.';
  }

  protected followUpContextLabel(): string {
    if (!this.followUpContext?.nextReturnNumber || !this.previousAttendance) {
      return '';
    }

    return `Retorno ${this.followUpContext.nextReturnNumber} de ${this.followUpContext.returnCount}`;
  }

  protected previousAttendanceCodeLabel(): string {
    return this.previousAttendance
      ? `Atendimento anterior: #${this.previousAttendance.codigo}`
      : '';
  }

  protected scrollToStep(stepId: string): void {
    document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected toggleOptionalStep(step: OptionalStep, enabled: boolean): void {
    if (
      ((this.formMode === ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN && !this.canExtendFollowUp()) ||
        this.editingReturn) &&
      step === 'acompanhamento'
    ) {
      return;
    }

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
    this.medicationDrafts[section].administrationRoute = medication.administrationRoute;
    delete this.medicationErrors[section].medicationConcentration;
    this.selectedMedications[section] = medication;
    this.loadInteractionWarnings(section);
  }

  protected updateMedicationQuery(section: MedicationSection, value: string): void {
    const draft = this.medicationDrafts[section];
    draft.medicationConcentration = value;
    const selectedMedication = this.selectedMedications[section] ?? null;

    if (
      selectedMedication &&
      draft.medicationConcentration === this.formatMedication(selectedMedication)
    ) {
      return;
    }

    draft.medicationId = '';
    delete this.selectedMedications[section];
    this.interactionWarnings[section] = [];
  }

  protected medicationInteractionWarnings(section: MedicationSection): MedicationInteractionPair[] {
    const medicationId = this.medicationDrafts[section].medicationId;

    if (!this.selectedPatientId || !medicationId) {
      return [];
    }

    return this.interactionWarnings[section];
  }

  private loadInteractionWarnings(section: MedicationSection): void {
    const medicationId = this.medicationDrafts[section].medicationId;
    this.interactions
      .findPairs(medicationId ? [medicationId] : [], this.patient().comorbidityIds ?? [])
      .subscribe((pairs) => (this.interactionWarnings[section] = pairs));
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
        id: this.createLocalMedicationKey(),
        medicationId: draft.medicationId,
        medicationConcentration: draft.medicationConcentration.trim(),
        batch: draft.batch.trim(),
        expirationDate: draft.expirationDate,
        dosage: draft.dosage.trim(),
        administrationRoute: draft.administrationRoute,
        prescriberName: draft.prescriberName.trim(),
        prescriberRegistration: draft.prescriberRegistration.trim(),
      },
    ];
    this.medicationDrafts[section] = this.createEmptyMedicationDraft();
    this.medicationErrors[section] = {};
  }

  protected removeMedication(section: MedicationSection, id: string | undefined): void {
    this.medicationItems[section] = this.medicationItems[section].filter((item) => item.id !== id);
  }

  protected followUpPreview(): string {
    const interval = Number(this.followUp.returnIntervalDays);
    const count = Number(this.followUp.returnCount);

    if (!Number.isInteger(interval) || interval <= 0 || !Number.isInteger(count) || count <= 0) {
      return '';
    }

    return this.canExtendFollowUp()
      ? `O acompanhamento será prolongado com mais ${count} retornos, a cada ${interval} dias.`
      : `O paciente deverá retornar a cada ${interval} dias, ${count} vezes.`;
  }

  protected submit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.formMode === ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN && !this.previousAttendance) {
      this.errors['submit'] =
        'Não foi possível carregar o contexto do retorno. Volte à listagem e tente novamente.';
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    const patient = this.patient();
    const input = {
      patientId: this.selectedPatientId || undefined,
      patient: this.selectedPatientId
        ? undefined
        : {
            ...patient,
            cpf: onlyDigits(patient.cpf),
            cellPhone: onlyDigits(patient.cellPhone),
            cep: onlyDigits(patient.cep ?? ''),
            phone: onlyDigits(patient.phone),
          },
      care: this.enabledSteps['cuidados-farmaceuticos'] ? { ...this.care } : null,
      injectable: this.enabledSteps['aplicacao-injetaveis'] ? this.injectableData() : null,
      inhalotherapy: this.enabledSteps.inaloterapia ? this.inhalotherapyData() : null,
      complementaryServices: this.enabledSteps['servicos-acompanhamento']
        ? this.complementaryServicesData()
        : null,
      pharmacotherapeuticFollowUp: this.enabledSteps['acompanhamento-farmacoterapeutico']
        ? this.pharmacotherapeuticFollowUpData()
        : null,
      followUp:
        this.formMode !== ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN &&
        !this.editingReturn &&
        this.enabledSteps.acompanhamento
          ? this.followUpData()
          : null,
      ...((this.canExtendFollowUp() && this.enabledSteps.acompanhamento)
        ? {
            followUpExtension: this.followUpExtensionData(),
          }
        : {}),
    };

    const request = this.isEditing()
      ? this.service.update(this.editingAttendanceId, input)
      : this.formMode === ATTENDANCE_FORM_MODES.FOLLOW_UP_RETURN && this.previousAttendance
        ? this.service.createReturn(this.previousAttendance.id, input)
        : this.service.create(input);
    request.subscribe({
      next: (attendance) => void this.router.navigate(['/atendimentos', attendance.id]),
      error: () => {
        this.errors['submit'] =
          'Não foi possível salvar o atendimento. Verifique os dados e tente novamente.';
        this.isSubmitting = false;
      },
    });
  }

  private injectableData(): InjectableServiceData {
    return {
      medications: this.medicationItems.injectable.map((item) =>
        this.requestMedication(item, true),
      ),
    };
  }

  private inhalotherapyData(): InhalotherapyServiceData {
    return {
      medications: this.medicationItems.inhalotherapy.map((item) =>
        this.requestMedication(item, true),
      ),
    };
  }

  private complementaryServicesData(): ComplementaryServicesData {
    return {
      homeCare: this.complementary.homeCare,
      minorDisorderIndication: this.complementary.minorDisorderIndication,
      signsAndSymptoms: this.complementary.signsAndSymptoms,
      medications: this.medicationItems.complementary.map((item) =>
        this.requestMedication(item, false),
      ),
    };
  }

  private pharmacotherapeuticFollowUpData(): PharmacotherapeuticFollowUpServiceData {
    return {
      signsAndSymptoms: this.pharmacotherapy.signsAndSymptoms,
      medications: this.medicationItems.pharmacotherapeuticFollowUp.map((item) =>
        this.requestMedication(item, false),
      ),
    };
  }

  private followUpData(): FollowUpData {
    return {
      returnIntervalDays: Number(this.followUp.returnIntervalDays),
      returnCount: Number(this.followUp.returnCount),
    };
  }

  private followUpExtensionData(): FollowUpExtensionData {
    return {
      additionalReturns: Number(this.followUp.returnCount),
      returnIntervalDays: Number(this.followUp.returnIntervalDays),
    };
  }

  private validateForm(): boolean {
    this.clearErrors();
    const patient = this.patient();
    const cpf = onlyDigits(patient.cpf);

    if (cpf.length !== 11) {
      this.errors['patient.cpf'] = 'Informe um CPF com 11 dígitos.';
    }

    if (!patient.name.trim()) {
      this.errors['patient.name'] = 'Nome do paciente é obrigatório.';
    }

    if (!patient.birthDate) {
      this.errors['patient.birthDate'] = 'Data de nascimento é obrigatória.';
    }

    if (onlyDigits(patient.cellPhone).length < 10) {
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

    if (
      this.enabledSteps['acompanhamento-farmacoterapeutico'] &&
      this.medicationItems.pharmacotherapeuticFollowUp.length === 0
    ) {
      this.errors['pharmacotherapeuticFollowUpMedications'] = 'Adicione ao menos um medicamento.';
    }

    if (this.enabledSteps.acompanhamento) {
      const interval = Number(this.followUp.returnIntervalDays);
      const count = Number(this.followUp.returnCount);

      if (!Number.isInteger(interval) || interval <= 0) {
        this.errors['returnIntervalDays'] = 'Informe um intervalo positivo em dias.';
      }

      if (!Number.isInteger(count) || count <= 0) {
        this.errors['returnCount'] = this.canExtendFollowUp()
          ? 'Informe uma quantidade positiva de retornos adicionais.'
          : 'Informe uma quantidade positiva de retornos.';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  private fillPatientFromCurrentRecord(patient: Patient): void {
    this.patient.set({
      name: patient.name,
      cpf: maskCpf(patient.cpf),
      birthDate: patient.birthDate,
      cellPhone: maskBrazilianPhone(patient.cellPhone),
      gender: patient.gender,
      cep: maskCep(patient.cep ?? ''),
      address: patient.address,
      neighborhood: patient.neighborhood ?? '',
      city: patient.city,
      state: patient.state,
      phone: maskBrazilianPhone(patient.phone),
      responsibleName: patient.responsibleName,
      comorbidityIds: [...patient.comorbidityIds],
    });
  }

  private loadForEdit(id: string): void {
    this.service.get(id).subscribe({
      next: (attendance) => {
        if (attendance.editAllowed === false) {
          this.errors['submit'] = 'Este atendimento não pode ser editado.';
          return;
        }

        this.editingAttendanceId = attendance.id;
        this.editingReturn = (attendance.followUpLink?.returnNumber ?? 0) > 0;
        this.selectedPatientId = attendance.patient.id;
        this.fillPatientFromCurrentRecord(attendance.patient);
        this.enabledSteps['cuidados-farmaceuticos'] = Boolean(attendance.care);
        this.enabledSteps['aplicacao-injetaveis'] = Boolean(attendance.injectable);
        this.enabledSteps.inaloterapia = Boolean(attendance.inhalotherapy);
        this.enabledSteps['servicos-acompanhamento'] = Boolean(attendance.complementaryServices);
        this.enabledSteps['acompanhamento-farmacoterapeutico'] = Boolean(
          attendance.pharmacotherapeuticFollowUp,
        );
        this.enabledSteps.acompanhamento = Boolean(
          attendance.followUp && attendance.followUpLink?.returnNumber === 0,
        );

        if (attendance.care) {
          Object.assign(this.care, attendance.care);
        }
        if (attendance.injectable) {
          this.medicationItems.injectable = [...attendance.injectable.medications];
        }
        if (attendance.inhalotherapy) {
          this.medicationItems.inhalotherapy = [...attendance.inhalotherapy.medications];
        }
        if (attendance.complementaryServices) {
          Object.assign(this.complementary, {
            homeCare: attendance.complementaryServices.homeCare,
            minorDisorderIndication: attendance.complementaryServices.minorDisorderIndication,
            signsAndSymptoms: attendance.complementaryServices.signsAndSymptoms,
          });
          this.medicationItems.complementary = [...attendance.complementaryServices.medications];
        }
        if (attendance.pharmacotherapeuticFollowUp) {
          this.pharmacotherapy.signsAndSymptoms =
            attendance.pharmacotherapeuticFollowUp.signsAndSymptoms;
          this.medicationItems.pharmacotherapeuticFollowUp = [
            ...attendance.pharmacotherapeuticFollowUp.medications,
          ];
        }
        if (attendance.followUp && this.enabledSteps.acompanhamento) {
          this.followUp.returnIntervalDays = String(attendance.followUp.returnIntervalDays);
          this.followUp.returnCount = String(attendance.followUp.returnCount);
        }
        this.isInitialRecordLoading.set(false);
      },
      error: () => {
        this.errors['submit'] = 'Não foi possível carregar o atendimento para edição.';
        this.isInitialRecordLoading.set(false);
      },
    });
  }

  private requestMedication(
    item: ServiceMedicationItem,
    includesPrescriber: boolean,
  ): ServiceMedicationItem {
    const payload = { ...item };
    delete payload.administrationRoute;

    if (payload.id?.startsWith('new-')) {
      delete payload.id;
    }

    if (includesPrescriber) {
      return payload;
    }

    delete payload.prescriberName;
    delete payload.prescriberRegistration;
    return payload;
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
      administrationRoute: '',
      prescriberName: '',
      prescriberRegistration: '',
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

  private createLocalMedicationKey(): string {
    const key = `new-${this.nextLocalMedicationKey}`;
    this.nextLocalMedicationKey += 1;
    return key;
  }
}
