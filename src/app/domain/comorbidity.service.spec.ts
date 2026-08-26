import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ComorbidityService } from './comorbidity.service';

describe('ComorbidityService', () => {
  it('envia somente ids ao atualizar interações', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ComorbidityService);
    const http = TestBed.inject(HttpTestingController);
    service.update('c1', { name: 'Hipertensão', medicationInteractionIds: ['m1'] }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/api/comorbidades/c1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Hipertensão', medicationInteractionIds: ['m1'] });
    request.flush({});
    http.verify();
  });
});
