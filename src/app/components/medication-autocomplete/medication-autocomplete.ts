import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Medication } from '../../domain/clinical-records';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

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
  protected results(): Medication[] {
    const term = this.value.trim();

    return term ? this.store.searchMedications(term).slice(0, 8) : [];
  }

  constructor(private readonly store: TemporaryClinicalRecordsStore) {}

  protected updateValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.isOpen.set(Boolean(value.trim()));
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
