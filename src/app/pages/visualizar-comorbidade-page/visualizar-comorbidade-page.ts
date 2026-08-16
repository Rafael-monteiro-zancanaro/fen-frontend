import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

@Component({
  selector: 'app-visualizar-comorbidade-page',
  imports: [RouterLink],
  templateUrl: './visualizar-comorbidade-page.html',
})
export class VisualizarComorbidadePage {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(TemporaryClinicalRecordsStore);
  private readonly comorbidityId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly comorbidity = computed(() => this.store.getComorbidity(this.comorbidityId));
  protected readonly interactionMedications = computed(() => {
    const currentComorbidity = this.comorbidity();

    if (!currentComorbidity) {
      return [];
    }

    return this.store.getInteractionMedications(currentComorbidity);
  });
}
