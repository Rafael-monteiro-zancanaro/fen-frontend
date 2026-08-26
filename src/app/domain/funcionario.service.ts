import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiPage } from './api-page';
import { UserRole } from './auth.service';

export type InternshipType = 'Obrigatório' | 'Não obrigatório';
export type EmployeeStatus = 'Ativo' | 'Pendente';
export interface BasePharmacyEmployee {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  role: UserRole;
  status: EmployeeStatus;
}
export interface PharmacistEmployee extends BasePharmacyEmployee {
  role: 'ADMIN' | 'FARMACEUTICO';
  crf: string;
  isTechnicalResponsible: boolean;
}
export interface InternEmployee extends BasePharmacyEmployee {
  role: 'ESTAGIARIO';
  internshipType: InternshipType;
  supervisorName: string;
  internshipStartDate: string;
  internshipEndDate: string;
}
export type PharmacyEmployee = PharmacistEmployee | InternEmployee;
interface ApiEmployee {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  role: UserRole;
  situacao: 'ATIVO' | 'PENDENTE';
  crf?: string;
  responsavelTecnico?: boolean;
  tipoEstagio?: 'OBRIGATORIO' | 'NAO_OBRIGATORIO';
  supervisor?: { nome: string };
  inicioVigencia?: string;
  fimVigencia?: string;
}

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/funcionarios`;
  list(query: string, page: number, size: number): Observable<ApiPage<PharmacyEmployee>> {
    const params = new HttpParams().set('query', query.trim()).set('page', page).set('size', size);
    return this.http
      .get<ApiPage<ApiEmployee>>(this.url, { params })
      .pipe(map((p) => ({ ...p, content: p.content.map((e) => this.toEmployee(e)) })));
  }
  get(id: string): Observable<PharmacyEmployee> {
    return this.http.get<ApiEmployee>(`${this.url}/${id}`).pipe(map((e) => this.toEmployee(e)));
  }
  alterarResponsavelTecnico(id: string, responsavelTecnico: boolean): Observable<PharmacyEmployee> {
    return this.http
      .patch<ApiEmployee>(`${this.url}/${id}/responsavel-tecnico`, { responsavelTecnico })
      .pipe(map((e) => this.toEmployee(e)));
  }
  private toEmployee(e: ApiEmployee): PharmacyEmployee {
    const base: BasePharmacyEmployee = {
      id: e.id,
      name: e.nome,
      email: e.email,
      cpf: e.cpf ?? '',
      birthDate: e.dataNascimento ?? '',
      role: e.role,
      status: e.situacao === 'ATIVO' ? 'Ativo' : 'Pendente',
    };
    if (e.role === 'ESTAGIARIO')
      return {
        ...base,
        role: 'ESTAGIARIO',
        internshipType: e.tipoEstagio === 'NAO_OBRIGATORIO' ? 'Não obrigatório' : 'Obrigatório',
        supervisorName: e.supervisor?.nome ?? '',
        internshipStartDate: e.inicioVigencia ?? '',
        internshipEndDate: e.fimVigencia ?? '',
      };
    return {
      ...base,
      role: e.role,
      crf: e.crf ?? '',
      isTechnicalResponsible: !!e.responsavelTecnico,
    };
  }
}
