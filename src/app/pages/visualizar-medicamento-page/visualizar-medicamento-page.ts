import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

@Component({
  selector: 'app-visualizar-medicamento-page',
  imports: [RouterLink],
  templateUrl: './visualizar-medicamento-page.html',
})
export class VisualizarMedicamentoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(TemporaryClinicalRecordsStore);
  private readonly medicationId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly medication = computed(() => this.store.getMedication(this.medicationId));
}
