import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientForm } from '../../components/patient-form/patient-form';
import { ComorbiditySummary, PatientInput } from '../../domain/clinical-records';
import { onlyDigits } from '../../domain/text-masks';
import { ComorbidityService } from '../../domain/comorbidity.service';
import { PatientService } from '../../domain/patient.service';

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

  protected readonly comorbidityResults = signal<ComorbiditySummary[]>([]);
  private readonly selectedItems = signal<ComorbiditySummary[]>([]);
  protected readonly selectedComorbidities = computed(() => this.selectedItems());

  constructor(
    private readonly router: Router,
    private readonly patientService: PatientService,
    private readonly comorbidityService: ComorbidityService,
  ) { this.loadComorbidities(''); }

  ngOnInit(): void {
    if (!this.patientId) {
      return;
    }

    this.patientService.get(this.patientId).subscribe({ next: (patient) => { Object.assign(this.patient, { ...patient, comorbidityIds: [...patient.comorbidityIds] }); this.selectedComorbidityIds.set([...patient.comorbidityIds]); this.loadComorbidities(this.comorbiditySearchTerm()); }, error: () => this.recordNotFound.set(true) });
  }

  protected updateComorbiditySearch(term: string): void {
    this.comorbiditySearchTerm.set(term);
    this.loadComorbidities(term);
  }

  protected addComorbidity(comorbidity: ComorbiditySummary): void {
    if (this.selectedComorbidityIds().includes(comorbidity.id)) {
      return;
    }

    this.selectedComorbidityIds.set([...this.selectedComorbidityIds(), comorbidity.id]);
    this.selectedItems.set([...this.selectedItems(), comorbidity]);
  }

  protected removeComorbidity(comorbidityId: string): void {
    this.selectedComorbidityIds.set(
      this.selectedComorbidityIds().filter((selectedId) => selectedId !== comorbidityId),
    );
    this.selectedItems.set(this.selectedItems().filter((item) => item.id !== comorbidityId));
  }

  private loadComorbidities(term: string): void {
    this.comorbidityService.list(term, 0, 100).subscribe((page) => {
      this.comorbidityResults.set(page.content);
      const selected = new Set(this.selectedComorbidityIds());
      const additions = page.content.filter((item) => selected.has(item.id));
      if (additions.length) this.selectedItems.set(additions);
    });
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
      this.patientService.update(this.patientId, input).subscribe({ next: () => void this.router.navigateByUrl('/pacientes'), error: () => this.saveError = 'Não foi possível salvar. Verifique se o CPF já pertence a outro paciente.' });
      return;
    }

    this.patientService.create(input).subscribe({ next: (patient) => void this.router.navigateByUrl(`/pacientes/${patient.id}/editar`), error: () => this.saveError = 'Não foi possível salvar. Verifique os dados informados.' });
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
