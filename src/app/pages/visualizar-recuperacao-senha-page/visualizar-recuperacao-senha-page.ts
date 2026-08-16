import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TemporaryPasswordRecoveryStore } from '../../domain/temporary-password-recovery-store';

@Component({
  selector: 'app-visualizar-recuperacao-senha-page',
  imports: [RouterLink],
  templateUrl: './visualizar-recuperacao-senha-page.html',
})
export class VisualizarRecuperacaoSenhaPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly recoveryStore = inject(TemporaryPasswordRecoveryStore);
  private readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly request = computed(() => this.recoveryStore.getRequest(this.requestId));

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
