import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from './api-page';
import { CreateMedicationInput, Medication } from './clinical-records';

export const MEDICATION_AUTOCOMPLETE_DEBOUNCE = new InjectionToken<number>(
  'MEDICATION_AUTOCOMPLETE_DEBOUNCE', { providedIn: 'root', factory: () => 300 },
);

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/medicamentos`;

  list(query: string, page: number, size: number): Observable<ApiPage<Medication>> {
    const params = new HttpParams().set('query', query.trim()).set('page', page).set('size', size);
    return this.http.get<ApiPage<Medication>>(this.resourceUrl, { params });
  }
  get(id: string): Observable<Medication> { return this.http.get<Medication>(`${this.resourceUrl}/${id}`); }
  create(input: CreateMedicationInput): Observable<Medication> { return this.http.post<Medication>(this.resourceUrl, input); }
  update(id: string, input: CreateMedicationInput): Observable<Medication> { return this.http.put<Medication>(`${this.resourceUrl}/${id}`, input); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.resourceUrl}/${id}`); }
  autocomplete(query: string, limit = 8): Observable<Medication[]> {
    const params = new HttpParams().set('query', query.trim()).set('limit', limit);
    return this.http.get<Medication[]>(`${this.resourceUrl}/autocomplete`, { params });
  }
}
