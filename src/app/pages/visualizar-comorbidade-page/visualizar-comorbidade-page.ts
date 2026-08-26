import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Comorbidity } from '../../domain/clinical-records';
import { ComorbidityService } from '../../domain/comorbidity.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-visualizar-comorbidade-page',
  imports: [RouterLink],
  templateUrl: './visualizar-comorbidade-page.html',
})
export class VisualizarComorbidadePage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ComorbidityService);
  private readonly comorbidityId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly comorbidity = signal<Comorbidity | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly interactionMedications = computed(() => {
    const currentComorbidity = this.comorbidity();

    if (!currentComorbidity) {
      return [];
    }

    return currentComorbidity.interactionMedications ?? [];
  });

  constructor() { this.service.get(this.comorbidityId).subscribe({
    next: (value) => { this.comorbidity.set(value); this.loading.set(false); },
    error: () => this.loading.set(false),
  }); }
}
