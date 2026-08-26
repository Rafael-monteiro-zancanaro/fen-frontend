import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from './api-page';
import { Patient, PatientInput } from './clinical-records';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/pacientes`;
  list(query: string, page: number, size: number): Observable<ApiPage<Patient>> {
    const params = new HttpParams().set('query', query.trim()).set('page', page).set('size', size);
    return this.http.get<ApiPage<Patient>>(this.resourceUrl, { params });
  }
  get(id: string): Observable<Patient> { return this.http.get<Patient>(`${this.resourceUrl}/${id}`); }
  findByCpf(cpf: string): Observable<Patient> { return this.http.get<Patient>(`${this.resourceUrl}/cpf/${cpf.replace(/\D/g, '')}`); }
  create(input: PatientInput): Observable<Patient> { return this.http.post<Patient>(this.resourceUrl, input); }
  update(id: string, input: PatientInput): Observable<Patient> { return this.http.put<Patient>(`${this.resourceUrl}/${id}`, input); }
}
