import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import {
  AdminRegistrationService,
  PendingRegistrationDetail,
  PendingRegistrationSummary,
} from './admin-registration.service';

describe('AdminRegistrationService', () => {
  let http: HttpTestingController;
  let service: AdminRegistrationService;

  const registrationId = '00000000-0000-0000-0000-000000000301';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AdminRegistrationService],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AdminRegistrationService);
  });

  afterEach(() => http.verify());

  it('lists pending registrations through the exact admin endpoint', () => {
    const registrations: PendingRegistrationSummary[] = [
      {
        id: registrationId,
        nome: 'Bia Estagiária',
        email: 'bia@fen.br',
        cpf: '98765432100',
        role: 'ESTAGIARIO',
        solicitadoEm: '2026-08-21T10:30:00',
      },
    ];
    let result: PendingRegistrationSummary[] | undefined;

    service.findPendentes().subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/api/admin/usuarios/pendentes`);
    expect(request.request.method).toBe('GET');
    request.flush(registrations);

    expect(result).toEqual(registrations);
  });

  it('loads one pending registration through the exact admin endpoint', () => {
    const registration: PendingRegistrationDetail = {
      id: registrationId,
      funcionarioId: '00000000-0000-0000-0000-000000000302',
      nome: 'Bia Estagiária',
      email: 'bia@fen.br',
      cpf: '98765432100',
      dataNascimento: '2002-02-03',
      role: 'ESTAGIARIO',
      situacao: 'PENDENTE',
      solicitadoEm: '2026-08-21T10:30:00',
      crf: null,
      responsavelTecnico: null,
      tipoEstagio: 'NAO_OBRIGATORIO',
      supervisor: {
        id: '00000000-0000-0000-0000-000000000303',
        nome: 'Ana Supervisora',
      },
      inicioVigencia: '2026-08-01',
      fimVigencia: '2026-12-15',
    };
    let result: PendingRegistrationDetail | undefined;

    service.findPendente(registrationId).subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/api/admin/usuarios/${registrationId}`);
    expect(request.request.method).toBe('GET');
    request.flush(registration);

    expect(result).toEqual(registration);
  });

  it('approves through POST without sending a request body', () => {
    service.aprovar(registrationId).subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/api/admin/usuarios/${registrationId}/aprovar`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(null);
  });

  it('rejects through DELETE on the explicit rejection endpoint', () => {
    service.rejeitar(registrationId).subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/api/admin/usuarios/${registrationId}/rejeitar`,
    );
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null);
  });
});
