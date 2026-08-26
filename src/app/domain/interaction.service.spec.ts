import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { InteractionService } from './interaction.service';

describe('InteractionService', () => {
  it('consulta vários pares em uma única requisição', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(InteractionService);
    const http = TestBed.inject(HttpTestingController);
    service.findPairs(['m1', 'm2'], ['c1', 'c2']).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/api/interacoes?medicamentoIds=m1,m2&comorbidadeIds=c1,c2`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
    http.verify();
  });
});
