import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowDownCircle,
  bootstrapCapsule,
  bootstrapClipboard,
  bootstrapClipboardPulse,
  bootstrapDroplet,
  bootstrapHouseHeart,
  bootstrapLungs,
  bootstrapSave,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-servicos-farmaceuticos-page',
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapArrowDownCircle,
      bootstrapCapsule,
      bootstrapClipboard,
      bootstrapClipboardPulse,
      bootstrapDroplet,
      bootstrapHouseHeart,
      bootstrapLungs,
      bootstrapSave,
    }),
  ],
  templateUrl: './servicos-farmaceuticos-page.html',
})
export class ServicosFarmaceuticosPage {
  protected readonly steps = [
    { number: '01', title: 'Identificação do usuário', id: 'identificacao-usuario' },
    { number: '02', title: 'Cuidados farmacêuticos', id: 'cuidados-farmaceuticos' },
    { number: '03', title: 'Aplicação de injetáveis', id: 'aplicacao-injetaveis' },
    { number: '04', title: 'Inaloterapia', id: 'inaloterapia' },
    { number: '05', title: 'Serviços e acompanhamento', id: 'servicos-acompanhamento' },
    { number: '06', title: 'Revisão e assinatura', id: 'revisao-assinatura' },
  ];

  protected scrollToStep(stepId: string): void {
    document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
