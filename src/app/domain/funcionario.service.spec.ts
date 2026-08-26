import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { FuncionarioService } from './funcionario.service';

describe('FuncionarioService', () => {
  it('sends pagination filters and the minimal technical-responsibility payload', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(FuncionarioService);
    const http = TestBed.inject(HttpTestingController);
    service.list('ana', 1, 20).subscribe();
    const list = http.expectOne(
      `${environment.apiUrl}/api/admin/funcionarios?query=ana&page=1&size=20`,
    );
    expect(list.request.method).toBe('GET');
    list.flush({ content: [], number: 1, size: 20, totalElements: 0, totalPages: 0 });
    service.alterarResponsavelTecnico('uuid', true).subscribe();
    const patch = http.expectOne(
      `${environment.apiUrl}/api/admin/funcionarios/uuid/responsavel-tecnico`,
    );
    expect(patch.request.body).toEqual({ responsavelTecnico: true });
    patch.flush({
      id: 'uuid',
      nome: 'Ana',
      email: 'ana@fen.br',
      role: 'FARMACEUTICO',
      situacao: 'ATIVO',
      crf: 'PR-1',
      responsavelTecnico: true,
    });
    http.verify();
  });
});
