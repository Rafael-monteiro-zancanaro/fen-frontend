import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PasswordRecoveryRequest, PasswordRecoveryService } from '../../domain/password-recovery.service';

@Component({
  selector: 'app-visualizar-recuperacao-senha-page',
  imports: [RouterLink],
  templateUrl: './visualizar-recuperacao-senha-page.html',
})
export class VisualizarRecuperacaoSenhaPage {
  private readonly route = inject(ActivatedRoute);
  private readonly recoveryService = inject(PasswordRecoveryService);
  private readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly request = signal<PasswordRecoveryRequest | null>(null);

  constructor() { if (this.requestId) this.recoveryService.get(this.requestId).subscribe({ next: (value) => this.request.set(value) }); }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
