import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from './api-page';
import { Comorbidity, ComorbiditySummary, CreateComorbidityInput } from './clinical-records';

@Injectable({ providedIn: 'root' })
export class ComorbidityService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/comorbidades`;
  list(query: string, page: number, size: number): Observable<ApiPage<ComorbiditySummary>> {
    const params = new HttpParams().set('query', query.trim()).set('page', page).set('size', size);
    return this.http.get<ApiPage<ComorbiditySummary>>(this.resourceUrl, { params });
  }
  get(id: string): Observable<Comorbidity> { return this.http.get<Comorbidity>(`${this.resourceUrl}/${id}`); }
  create(input: CreateComorbidityInput): Observable<Comorbidity> { return this.http.post<Comorbidity>(this.resourceUrl, input); }
  update(id: string, input: CreateComorbidityInput): Observable<Comorbidity> { return this.http.put<Comorbidity>(`${this.resourceUrl}/${id}`, input); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.resourceUrl}/${id}`); }
}
