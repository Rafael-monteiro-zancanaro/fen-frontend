import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';
import { AtendimentoPdfService } from '../../domain/atendimento-pdf.service';
import { ServicoFarmaceuticoService } from '../../domain/servico-farmaceutico.service';
import { AtendimentosPage } from './atendimentos-page';

describe('AtendimentosPage', () => {
  it('reflete retornoHoje da URL e o envia para a listagem', () => {
    const queryParams = new BehaviorSubject(convertToParamMap({ retornoHoje: 'true' }));
    const list = vi.fn(() =>
      of({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
    );

    TestBed.configureTestingModule({
      imports: [AtendimentosPage],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ServicoFarmaceuticoService,
          useValue: { list, close: vi.fn(), get: vi.fn() },
        },
        { provide: AtendimentoPdfService, useValue: { generate: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(AtendimentosPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-returns-today-filter]')?.textContent).toContain(
      'Reconsultas hoje',
    );
    expect(list).toHaveBeenCalledWith('', 'TODOS', true, 0, 10);
  });
});
