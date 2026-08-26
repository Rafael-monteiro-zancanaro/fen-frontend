import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Medication } from '../../domain/clinical-records';
import { MEDICATION_AUTOCOMPLETE_DEBOUNCE, MedicationService } from '../../domain/medication.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-medication-autocomplete',
  imports: [FormsModule],
  templateUrl: './medication-autocomplete.html',
})
export class MedicationAutocomplete {
  @Input({ required: true }) inputId = '';
  @Input({ required: true }) inputName = '';
  @Input({ required: true }) section = '';
  @Input() describedBy: string | null = null;
  @Input() invalid = false;
  @Input() value = '';
  @Input() selectedMedicationId = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() medicationSelected = new EventEmitter<Medication>();

  protected readonly isOpen = signal(false);
  protected readonly results = signal<Medication[]>([]);
  private readonly terms = new Subject<string>();
  private readonly debounceMs = inject(MEDICATION_AUTOCOMPLETE_DEBOUNCE);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly service: MedicationService) {
    this.terms.pipe(debounceTime(this.debounceMs), distinctUntilChanged(),
      switchMap((term) => this.service.autocomplete(term, 8)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (items) => this.results.set(items), error: () => this.results.set([]) });
  }

  protected updateValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.isOpen.set(Boolean(value.trim()));
    if (!value.trim()) {
      this.results.set([]);
    } else if (this.debounceMs === 0) {
      this.service.autocomplete(value.trim(), 8).subscribe((items) => this.results.set(items));
    } else {
      this.terms.next(value.trim());
    }
  }

  protected selectMedication(medication: Medication): void {
    this.value = this.formatMedication(medication);
    this.valueChange.emit(this.value);
    this.medicationSelected.emit(medication);
    this.isOpen.set(false);
  }

  protected formatMedication(medication: Medication): string {
    return medication.measurementUnit
      ? `${medication.name} — ${medication.measurementUnit}`
      : medication.name;
  }
}
