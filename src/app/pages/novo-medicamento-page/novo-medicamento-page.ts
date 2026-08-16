import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

@Component({
  selector: 'app-novo-medicamento-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './novo-medicamento-page.html',
})
export class NovoMedicamentoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly submitted = signal(false);
  protected readonly recordNotFound = signal(false);
  private readonly medicationId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.medicationId));
  protected name = '';
  protected measurementUnit = '';
  protected administrationRoute = '';

  constructor(
    private readonly router: Router,
    private readonly store: TemporaryClinicalRecordsStore,
  ) {}

  ngOnInit(): void {
    if (!this.medicationId) {
      return;
    }

    const medication = this.store.getMedication(this.medicationId);

    if (!medication) {
      this.recordNotFound.set(true);
      return;
    }

    this.name = medication.name;
    this.measurementUnit = medication.measurementUnit;
    this.administrationRoute = medication.administrationRoute;
  }

  protected saveMedication(): void {
    this.submitted.set(true);

    if (!this.isValid()) {
      return;
    }

    const input = {
      name: this.name,
      measurementUnit: this.measurementUnit,
      administrationRoute: this.administrationRoute,
    };

    if (this.medicationId) {
      this.store.updateMedication(this.medicationId, input);
    } else {
      this.store.createMedication(input);
    }

    void this.router.navigateByUrl('/medicamentos');
  }

  protected isNameInvalid(): boolean {
    return this.submitted() && !this.name.trim();
  }

  protected isMeasurementUnitInvalid(): boolean {
    return this.submitted() && !this.measurementUnit.trim();
  }

  protected isAdministrationRouteInvalid(): boolean {
    return this.submitted() && !this.administrationRoute.trim();
  }

  private isValid(): boolean {
    return Boolean(
      this.name.trim() && this.measurementUnit.trim() && this.administrationRoute.trim(),
    );
  }
}
