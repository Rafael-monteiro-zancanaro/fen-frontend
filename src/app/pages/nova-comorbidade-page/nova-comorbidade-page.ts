import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Medication } from '../../domain/clinical-records';
import { ComorbidityService } from '../../domain/comorbidity.service';
import { MEDICATION_AUTOCOMPLETE_DEBOUNCE, MedicationService } from '../../domain/medication.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-nova-comorbidade-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './nova-comorbidade-page.html',
})
export class NovaComorbidadePage {
  private readonly route = inject(ActivatedRoute);
  protected readonly submitted = signal(false);
  protected readonly recordNotFound = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);
  protected readonly medicationSearchTerm = signal('');
  protected readonly selectedMedicationIds = signal<string[]>([]);
  private readonly selectedMedicationItems = signal<Medication[]>([]);
  private readonly medicationTerms = new Subject<string>();
  private readonly medicationDebounceMs = inject(MEDICATION_AUTOCOMPLETE_DEBOUNCE);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly medicationResults = signal<Medication[]>([]);
  private readonly comorbidityId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.comorbidityId));
  protected name = '';

  protected readonly selectedMedications = computed(() => this.selectedMedicationItems());

  constructor(
    private readonly router: Router,
    private readonly service: ComorbidityService,
    private readonly medications: MedicationService,
  ) {
    this.medicationTerms.pipe(debounceTime(this.medicationDebounceMs), distinctUntilChanged(),
      switchMap((term) => this.medications.autocomplete(term, 8)), takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => this.medicationResults.set(items));
  }

  ngOnInit(): void {
    if (!this.comorbidityId) {
      return;
    }

    this.service.get(this.comorbidityId).subscribe({
      next: (comorbidity) => {
        this.name = comorbidity.name;
        this.selectedMedicationIds.set([...comorbidity.medicationInteractionIds]);
        this.selectedMedicationItems.set(comorbidity.interactionMedications ?? []);
      }, error: () => this.recordNotFound.set(true),
    });
  }

  protected updateMedicationSearch(term: string): void {
    this.medicationSearchTerm.set(term);
    if (!term.trim()) {
      this.medicationResults.set([]);
    } else if (this.medicationDebounceMs === 0) {
      this.medications.autocomplete(term.trim(), 8).subscribe((items) => this.medicationResults.set(items));
    } else {
      this.medicationTerms.next(term.trim());
    }
  }

  protected addInteraction(medication: Medication): void {
    if (this.selectedMedicationIds().includes(medication.id)) {
      return;
    }

    this.selectedMedicationIds.set([...this.selectedMedicationIds(), medication.id]);
    this.selectedMedicationItems.set([...this.selectedMedicationItems(), medication]);
  }

  protected removeInteraction(medicationId: string): void {
    this.selectedMedicationIds.set(
      this.selectedMedicationIds().filter((selectedId) => selectedId !== medicationId),
    );
    this.selectedMedicationItems.set(this.selectedMedicationItems().filter((item) => item.id !== medicationId));
  }

  protected isSelected(medicationId: string): boolean {
    return this.selectedMedicationIds().includes(medicationId);
  }

  protected saveComorbidity(): void {
    this.submitted.set(true);

    if (!this.name.trim()) {
      return;
    }
    if (this.saving()) return;
    this.saving.set(true); this.saveError.set(false);

    const input = {
      name: this.name,
      medicationInteractionIds: this.selectedMedicationIds(),
    };

    if (this.comorbidityId) {
      this.service.update(this.comorbidityId, input).subscribe({ next: () => void this.router.navigateByUrl('/comorbidades'), error: () => { this.saving.set(false); this.saveError.set(true); } });
    } else {
      this.service.create(input).subscribe({ next: () => void this.router.navigateByUrl('/comorbidades'), error: () => { this.saving.set(false); this.saveError.set(true); } });
    }
  }

  protected isNameInvalid(): boolean {
    return this.submitted() && !this.name.trim();
  }
}
