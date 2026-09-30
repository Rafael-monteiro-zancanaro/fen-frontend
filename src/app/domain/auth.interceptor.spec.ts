import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: () => 'jwt-token' } },
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('anexa Bearer às chamadas da API FEN', () => {
    http.get(`${environment.apiUrl}/api/pacientes`).subscribe();

    const request = requests.expectOne(`${environment.apiUrl}/api/pacientes`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('não envia Bearer para uma API externa', () => {
    http.get('https://viacep.com.br/ws/87000000/json/').subscribe();

    const request = requests.expectOne('https://viacep.com.br/ws/87000000/json/');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
