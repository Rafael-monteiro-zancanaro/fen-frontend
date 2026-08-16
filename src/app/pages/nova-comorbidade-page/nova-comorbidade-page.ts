import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Medication } from '../../domain/clinical-records';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

@Component({
  selector: 'app-nova-comorbidade-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './nova-comorbidade-page.html',
})
export class NovaComorbidadePage {
  private readonly route = inject(ActivatedRoute);
  protected readonly submitted = signal(false);
  protected readonly recordNotFound = signal(false);
  protected readonly medicationSearchTerm = signal('');
  protected readonly selectedMedicationIds = signal<string[]>([]);
  private readonly comorbidityId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.comorbidityId));
  protected name = '';

  protected readonly medicationResults = computed(() =>
    this.store.searchMedications(this.medicationSearchTerm()),
  );

  protected readonly selectedMedications = computed(() => {
    const selectedIds = this.selectedMedicationIds();

    return selectedIds.flatMap((medicationId) => {
      const medication = this.store.getMedication(medicationId);
      return medication ? [medication] : [];
    });
  });

  constructor(
    private readonly router: Router,
    protected readonly store: TemporaryClinicalRecordsStore,
  ) {}

  ngOnInit(): void {
    if (!this.comorbidityId) {
      return;
    }

    const comorbidity = this.store.getComorbidity(this.comorbidityId);

    if (!comorbidity) {
      this.recordNotFound.set(true);
      return;
    }

    this.name = comorbidity.name;
    this.selectedMedicationIds.set([...comorbidity.medicationInteractionIds]);
  }

  protected updateMedicationSearch(term: string): void {
    this.medicationSearchTerm.set(term);
  }

  protected addInteraction(medication: Medication): void {
    if (this.selectedMedicationIds().includes(medication.id)) {
      return;
    }

    this.selectedMedicationIds.set([...this.selectedMedicationIds(), medication.id]);
  }

  protected removeInteraction(medicationId: string): void {
    this.selectedMedicationIds.set(
      this.selectedMedicationIds().filter((selectedId) => selectedId !== medicationId),
    );
  }

  protected isSelected(medicationId: string): boolean {
    return this.selectedMedicationIds().includes(medicationId);
  }

  protected saveComorbidity(): void {
    this.submitted.set(true);

    if (!this.name.trim()) {
      return;
    }

    const input = {
      name: this.name,
      medicationInteractionIds: this.selectedMedicationIds(),
    };

    if (this.comorbidityId) {
      this.store.updateComorbidity(this.comorbidityId, input);
    } else {
      this.store.createComorbidity(input);
    }

    void this.router.navigateByUrl('/comorbidades');
  }

  protected isNameInvalid(): boolean {
    return this.submitted() && !this.name.trim();
  }
}
