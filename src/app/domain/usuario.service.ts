import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioRegisterRequest {
  nome: string;
  cpf: string;
  dataNascimento?: string;
  email: string;
  senha: string;
  role: 'FARMACEUTICO' | 'ESTAGIARIO';
  crf?: string;
  tipoEstagio?: 'OBRIGATORIO' | 'NAO_OBRIGATORIO';
  supervisorId?: string;
  inicioVigencia?: string;
  fimVigencia?: string;
}
export interface Supervisor {
  id: string;
  nome: string;
}
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;
  register(request: UsuarioRegisterRequest): Observable<unknown> {
    return this.http.post(`${this.base}/auth/register`, request);
  }
  supervisores(): Observable<Supervisor[]> {
    return this.http.get<Supervisor[]>(`${this.base}/public/supervisores`);
  }
}
