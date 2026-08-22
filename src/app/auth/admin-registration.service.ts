import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InternshipType, RegistrationRole } from './auth.models';

export interface PendingRegistrationSummary {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  role: RegistrationRole;
  solicitadoEm: string;
}

export interface PendingRegistrationSupervisor {
  id: string;
  nome: string;
}

export interface PendingRegistrationDetail extends PendingRegistrationSummary {
  funcionarioId: string;
  dataNascimento: string | null;
  situacao: 'PENDENTE';
  crf: string | null;
  responsavelTecnico: boolean | null;
  tipoEstagio: InternshipType | null;
  supervisor: PendingRegistrationSupervisor | null;
  inicioVigencia: string | null;
  fimVigencia: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminRegistrationService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/admin/usuarios`;

  findPendentes(): Observable<PendingRegistrationSummary[]> {
    return this.http.get<PendingRegistrationSummary[]>(`${this.resourceUrl}/pendentes`);
  }

  findPendente(id: string): Observable<PendingRegistrationDetail> {
    return this.http.get<PendingRegistrationDetail>(`${this.resourceUrl}/${id}`);
  }

  aprovar(id: string): Observable<void> {
    return this.http.post<void>(`${this.resourceUrl}/${id}/aprovar`, null);
  }

  rejeitar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}/rejeitar`);
  }
}
