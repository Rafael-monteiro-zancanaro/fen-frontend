import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ServicoFarmaceuticoService } from './servico-farmaceutico.service';

describe('ServicoFarmaceuticoService', () => {
  it('envia o critério retornoHoje somente quando ele está ativo', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ServicoFarmaceuticoService);
    const http = TestBed.inject(HttpTestingController);

    service.list('', 'TODOS', true, 0, 10).subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/api/servicos-farmaceuticos?query=&page=0&size=10&retornoHoje=true`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 });
    http.verify();
  });

  it('envia arquivo em multipart para o atendimento específico', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ServicoFarmaceuticoService);
    const http = TestBed.inject(HttpTestingController);
    const file = new File(['receita'], 'receita.pdf', { type: 'application/pdf' });

    service.uploadAttachment('attendance-1', file).subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/api/servicos-farmaceuticos/attendance-1/anexos`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    expect((request.request.body as FormData).get('file')).toBe(file);
    request.flush({
      id: 'attachment-1',
      nomeOriginal: 'receita.pdf',
      contentType: 'application/pdf',
      tamanho: 7,
      createdAt: '2026-09-17T00:00:00Z',
    });
    http.verify();
  });
});
