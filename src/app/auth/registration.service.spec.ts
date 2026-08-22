import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { RegistrationService, SupervisorOption } from './registration.service';

describe('RegistrationService', () => {
  let http: HttpTestingController;
  let service: RegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RegistrationService],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(RegistrationService);
  });

  afterEach(() => http.verify());

  it('loads the public supervisor options with their backend UUIDs', () => {
    const supervisors: SupervisorOption[] = [
      { id: '00000000-0000-0000-0000-000000000101', nome: 'Ana Supervisora' },
      { id: '00000000-0000-0000-0000-000000000102', nome: 'Bruno Supervisor' },
    ];
    let result: SupervisorOption[] | undefined;

    service.findSupervisores().subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/api/public/supervisores`);
    expect(request.request.method).toBe('GET');
    request.flush(supervisors);

    expect(result).toEqual(supervisors);
  });
});
