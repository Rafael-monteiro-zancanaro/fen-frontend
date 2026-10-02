import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientForm } from '../../components/patient-form/patient-form';
import { ComorbiditySummary, PatientInput } from '../../domain/clinical-records';
import { maskBrazilianPhone, maskCep, maskCpf, onlyDigits } from '../../domain/text-masks';
import { ComorbidityService } from '../../domain/comorbidity.service';
import { PatientService } from '../../domain/patient.service';
import { focusFirstInvalidField } from '../../domain/form-validation-focus';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-novo-paciente-page',
  imports: [FormsModule, PatientForm, RouterLink],
  templateUrl: './novo-paciente-page.html',
})
export class NovoPacientePage implements OnInit {
  @ViewChild('patientFormElement') private patientFormElement?: ElementRef<HTMLFormElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly patientId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.patientId));
  protected readonly recordNotFound = signal(false);
  protected readonly comorbiditySearchTerm = signal('');
  protected readonly selectedComorbidityIds = signal<string[]>([]);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saveError = signal('');
  protected readonly isSubmitting = signal(false);
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
    comorbidityIds: [],
  });

  protected readonly comorbidityResults = signal<ComorbiditySummary[]>([]);
  private readonly selectedItems = signal<ComorbiditySummary[]>([]);
  protected readonly selectedComorbidities = computed(() => this.selectedItems());

  constructor(
    private readonly router: Router,
    private readonly patientService: PatientService,
    private readonly comorbidityService: ComorbidityService,
  ) {
    this.loadComorbidities('');
  }

  ngOnInit(): void {
    if (!this.patientId) {
      return;
    }

    this.patientService.get(this.patientId).subscribe({
      next: (patient) => {
        this.patient.set({
          name: patient.name,
          cpf: maskCpf(patient.cpf),
          birthDate: patient.birthDate,
          cellPhone: maskBrazilianPhone(patient.cellPhone),
          gender: patient.gender,
          cep: maskCep(patient.cep ?? ''),
          address: patient.address,
          neighborhood: patient.neighborhood,
          city: patient.city,
          state: patient.state,
          phone: maskBrazilianPhone(patient.phone),
          responsibleName: patient.responsibleName,
          comorbidityIds: [...patient.comorbidityIds],
        });
        this.selectedComorbidityIds.set([...patient.comorbidityIds]);
        this.selectedItems.set([...(patient.comorbidities ?? [])]);
        this.loadComorbidities(this.comorbiditySearchTerm());
      },
      error: () => this.recordNotFound.set(true),
    });
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
      const selectedItems = new Map(this.selectedItems().map((item) => [item.id, item]));
      page.content
        .filter((item) => selected.has(item.id))
        .forEach((item) => selectedItems.set(item.id, item));
      this.selectedItems.set([...selectedItems.values()].filter((item) => selected.has(item.id)));
    });
  }

  protected isSelected(comorbidityId: string): boolean {
    return this.selectedComorbidityIds().includes(comorbidityId);
  }

  protected savePatient(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.clearErrors();
    this.saveError.set('');

    if (!this.validatePatient()) {
      this.focusFirstInvalidField();
      return;
    }

    this.isSubmitting.set(true);

    const input = {
      ...this.patient(),
      cpf: onlyDigits(this.patient().cpf),
      cellPhone: onlyDigits(this.patient().cellPhone),
      cep: onlyDigits(this.patient().cep ?? ''),
      phone: onlyDigits(this.patient().phone),
      comorbidityIds: this.selectedComorbidityIds(),
    };

    if (this.patientId) {
      this.patientService.update(this.patientId, input).pipe(
        finalize(() => this.isSubmitting.set(false)),
      ).subscribe({
        next: () => void this.router.navigateByUrl('/pacientes'),
        error: () => this.saveError.set(
          'Não foi possível salvar. Verifique se o CPF já pertence a outro paciente.',
        ),
      });
      return;
    }

    this.patientService.create(input).pipe(
      finalize(() => this.isSubmitting.set(false)),
    ).subscribe({
      next: (patient) => void this.router.navigateByUrl(`/pacientes/${patient.id}/editar`),
      error: () => this.saveError.set('Não foi possível salvar. Verifique os dados informados.'),
    });
  }

  private validatePatient(): boolean {
    const patient = this.patient();
    const cpf = onlyDigits(patient.cpf);
    const errors: Record<string, string> = {};

    if (cpf.length !== 11) {
      errors['patient.cpf'] = 'Informe um CPF com 11 dígitos.';
    }

    if (!patient.name.trim()) {
      errors['patient.name'] = 'Nome do paciente é obrigatório.';
    }

    if (!patient.birthDate) {
      errors['patient.birthDate'] = 'Data de nascimento é obrigatória.';
    }

    if (onlyDigits(patient.cellPhone).length < 10) {
      errors['patient.cellPhone'] = 'Telefone celular é obrigatório.';
    }

    this.errors.set(errors);
    return Object.keys(errors).length === 0;
  }

  private clearErrors(): void {
    this.errors.set({});
  }

  private focusFirstInvalidField(): void {
    if (this.patientFormElement) {
      focusFirstInvalidField(this.patientFormElement.nativeElement);
    }
  }
}
