import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { MedicationService } from './medication.service';

describe('MedicationService', () => {
  it('lista medicamentos com filtro e paginação server-side', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(MedicationService);
    const http = TestBed.inject(HttpTestingController);
    service.list('dipi', 0, 10).subscribe();
    const request = http.expectOne(
      `${environment.apiUrl}/api/medicamentos?query=dipi&page=0&size=10`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 });
    http.verify();
  });
});
