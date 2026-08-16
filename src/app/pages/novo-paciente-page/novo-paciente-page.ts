import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientForm } from '../../components/patient-form/patient-form';
import { Comorbidity, PatientInput } from '../../domain/clinical-records';
import { onlyDigits } from '../../domain/text-masks';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';
import { TemporaryPharmaceuticalServiceStore } from '../../domain/temporary-pharmaceutical-service-store';

@Component({
  selector: 'app-novo-paciente-page',
  imports: [FormsModule, PatientForm, RouterLink],
  templateUrl: './novo-paciente-page.html',
})
export class NovoPacientePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.patientId));
  protected readonly recordNotFound = signal(false);
  protected readonly comorbiditySearchTerm = signal('');
  protected readonly selectedComorbidityIds = signal<string[]>([]);
  protected readonly errors: Record<string, string> = {};
  protected saveError = '';
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
    comorbidityIds: [],
  };

  protected readonly comorbidityResults = computed(() =>
    this.clinicalStore.searchComorbidities(this.comorbiditySearchTerm()),
  );

  protected readonly selectedComorbidities = computed(() =>
    this.selectedComorbidityIds().flatMap((comorbidityId) => {
      const comorbidity = this.clinicalStore.getComorbidity(comorbidityId);
      return comorbidity ? [comorbidity] : [];
    }),
  );

  constructor(
    private readonly router: Router,
    private readonly patientStore: TemporaryPharmaceuticalServiceStore,
    protected readonly clinicalStore: TemporaryClinicalRecordsStore,
  ) {}

  ngOnInit(): void {
    if (!this.patientId) {
      return;
    }

    const patient = this.patientStore.getPatient(this.patientId);

    if (!patient) {
      this.recordNotFound.set(true);
      return;
    }

    Object.assign(this.patient, {
      ...patient,
      comorbidityIds: [...patient.comorbidityIds],
    });
    this.selectedComorbidityIds.set([...patient.comorbidityIds]);
  }

  protected updateComorbiditySearch(term: string): void {
    this.comorbiditySearchTerm.set(term);
  }

  protected addComorbidity(comorbidity: Comorbidity): void {
    if (this.selectedComorbidityIds().includes(comorbidity.id)) {
      return;
    }

    this.selectedComorbidityIds.set([...this.selectedComorbidityIds(), comorbidity.id]);
  }

  protected removeComorbidity(comorbidityId: string): void {
    this.selectedComorbidityIds.set(
      this.selectedComorbidityIds().filter((selectedId) => selectedId !== comorbidityId),
    );
  }

  protected isSelected(comorbidityId: string): boolean {
    return this.selectedComorbidityIds().includes(comorbidityId);
  }

  protected savePatient(): void {
    this.clearErrors();
    this.saveError = '';

    if (!this.validatePatient()) {
      return;
    }

    const input = {
      ...this.patient,
      cpf: onlyDigits(this.patient.cpf),
      cellPhone: onlyDigits(this.patient.cellPhone),
      cep: onlyDigits(this.patient.cep ?? ''),
      phone: onlyDigits(this.patient.phone),
      comorbidityIds: this.selectedComorbidityIds(),
    };

    if (this.patientId) {
      const patient = this.patientStore.updatePatient(this.patientId, input);

      if (!patient) {
        this.saveError = 'Não foi possível salvar. Verifique se o CPF já pertence a outro paciente.';
        return;
      }

      void this.router.navigateByUrl('/pacientes');
      return;
    }

    const patient = this.patientStore.createPatient(input);
    void this.router.navigateByUrl(`/pacientes/${patient.id}/editar`);
  }

  private validatePatient(): boolean {
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

    return Object.keys(this.errors).length === 0;
  }

  private clearErrors(): void {
    for (const key of Object.keys(this.errors)) {
      delete this.errors[key];
    }
  }
}
