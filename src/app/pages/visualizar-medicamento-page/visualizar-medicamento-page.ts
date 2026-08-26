import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { Medication } from '../../domain/clinical-records';
import { MedicationService } from '../../domain/medication.service';

@Component({
  selector: 'app-visualizar-medicamento-page',
  imports: [RouterLink],
  templateUrl: './visualizar-medicamento-page.html',
})
export class VisualizarMedicamentoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(MedicationService);
  private readonly medicationId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly medication = signal<Medication | undefined>(undefined);
  protected readonly loading = signal(true);

  constructor() { this.service.get(this.medicationId).subscribe({
    next: (value) => { this.medication.set(value); this.loading.set(false); },
    error: () => this.loading.set(false),
  }); }
}
