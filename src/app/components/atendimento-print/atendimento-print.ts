import { Component, input } from '@angular/core';
import { AtendimentoPrintData } from '../../domain/atendimento-print-data';

@Component({
  selector: 'app-atendimento-print',
  templateUrl: './atendimento-print.html',
  styleUrl: './atendimento-print.css',
})
export class AtendimentoPrint {
  readonly data = input.required<AtendimentoPrintData>();
}
