import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from './api-page';
export type PasswordRecoveryStatus = 'PENDENTE' | 'APROVADA' | 'REJEITADA';
export interface PasswordRecoveryRequest { id: string; email: string; status: PasswordRecoveryStatus; createdAt: string; }
@Injectable({ providedIn: 'root' }) export class PasswordRecoveryService {
 private readonly http = inject(HttpClient); private readonly url = `${environment.apiUrl}/api/recuperacoes-senha`;
 create(email: string, novaSenha: string): Observable<PasswordRecoveryRequest> { return this.http.post<PasswordRecoveryRequest>(this.url, { email, novaSenha }); }
 list(email: string, status: PasswordRecoveryStatus | '', page: number, size: number): Observable<ApiPage<PasswordRecoveryRequest>> { let params = new HttpParams().set('email', email).set('page', page).set('size', size); if (status) params = params.set('status', status); return this.http.get<ApiPage<PasswordRecoveryRequest>>(this.url, { params }); }
 get(id: string): Observable<PasswordRecoveryRequest> { return this.http.get<PasswordRecoveryRequest>(`${this.url}/${id}`); }
 approve(id: string): Observable<PasswordRecoveryRequest> { return this.http.post<PasswordRecoveryRequest>(`${this.url}/${id}/aprovar`, {}); }
 reject(id: string): Observable<PasswordRecoveryRequest> { return this.http.post<PasswordRecoveryRequest>(`${this.url}/${id}/rejeitar`, {}); }
}
