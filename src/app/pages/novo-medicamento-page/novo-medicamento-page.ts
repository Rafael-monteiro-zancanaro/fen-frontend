import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MedicationService } from '../../domain/medication.service';

@Component({
  selector: 'app-novo-medicamento-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './novo-medicamento-page.html',
})
export class NovoMedicamentoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly submitted = signal(false);
  protected readonly recordNotFound = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);
  private readonly medicationId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = computed(() => Boolean(this.medicationId));
  protected name = '';
  protected measurementUnit = '';
  protected administrationRoute = '';

  constructor(
    private readonly router: Router,
    private readonly service: MedicationService,
  ) {}

  ngOnInit(): void {
    if (!this.medicationId) {
      return;
    }

    this.service.get(this.medicationId).subscribe({
      next: (medication) => {
        this.name = medication.name;
        this.measurementUnit = medication.measurementUnit;
        this.administrationRoute = medication.administrationRoute;
      },
      error: () => this.recordNotFound.set(true),
    });
  }

  protected saveMedication(): void {
    this.submitted.set(true);

    if (!this.isValid()) {
      return;
    }
    if (this.saving()) return;
    this.saving.set(true); this.saveError.set(false);

    const input = {
      name: this.name,
      measurementUnit: this.measurementUnit,
      administrationRoute: this.administrationRoute,
    };

    if (this.medicationId) {
      this.service.update(this.medicationId, input).subscribe({ next: () => void this.router.navigateByUrl('/medicamentos'), error: () => { this.saving.set(false); this.saveError.set(true); } });
    } else {
      this.service.create(input).subscribe({ next: () => void this.router.navigateByUrl('/medicamentos'), error: () => { this.saving.set(false); this.saveError.set(true); } });
    }
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
