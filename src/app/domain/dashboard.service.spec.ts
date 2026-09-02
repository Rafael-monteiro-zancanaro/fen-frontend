import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('obtém em uma requisição o resumo agregado do dashboard', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(DashboardService);
    const http = TestBed.inject(HttpTestingController);
    let response: unknown;

    service.getSummary().subscribe((summary) => (response = summary));

    const request = http.expectOne(`${environment.apiUrl}/api/dashboard`);
    expect(request.request.method).toBe('GET');
    request.flush({
      indicators: { awaitingReturn: 2, returnsToday: 1, totalAttendances: 8, expired: 3 },
      serviceTypes: [{ type: 'cuidados-farmaceuticos', count: 4 }],
      statuses: [{ status: 'EXPIRADO', count: 3 }],
    });

    expect(response).toEqual({
      indicators: { awaitingReturn: 2, returnsToday: 1, totalAttendances: 8, expired: 3 },
      serviceTypes: [{ type: 'cuidados-farmaceuticos', count: 4 }],
      statuses: [{ status: 'EXPIRADO', count: 3 }],
    });
    http.verify();
  });
});
