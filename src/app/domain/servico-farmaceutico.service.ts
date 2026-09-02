import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AttendanceStatus,
  AttendanceStatusFilter,
  CreatePharmaceuticalServiceAttendanceInput,
  Patient,
  PharmaceuticalServiceAttendance,
  ServiceMedicationItem,
} from './clinical-records';
import { ApiPage } from './api-page';

export interface ServicoFarmaceuticoSummary {
  id: string;
  codigo: number;
  patientId: string;
  patientName: string;
  patientCpf: string;
  attendanceDate: string;
  status: AttendanceStatus;
  selectedServices: string[];
  canContinue: boolean;
  nextReturnNumber: number | null;
  returnCount: number | null;
  editAllowed: boolean;
}

export interface ContinuationContext {
  previousAttendanceId: string;
  previousAttendanceCode: number;
  patient: Patient;
  followUpProgress: {
    returnCount: number;
    completedReturns: number;
    nextReturnNumber: number | null;
    canContinue: boolean;
  };
}

export interface ServicoFarmaceuticoAdvancedResult {
  attendance: ServicoFarmaceuticoSummary;
  matchedMedications: ServiceMedicationItem[];
}

export type ServicoFarmaceuticoRequest = Omit<
  CreatePharmaceuticalServiceAttendanceInput,
  'selectedServices'
>;

@Injectable({ providedIn: 'root' })
export class ServicoFarmaceuticoService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/servicos-farmaceuticos`;

  list(
    query: string,
    status: AttendanceStatusFilter,
    retornoHoje: boolean,
    page: number,
    size: number,
  ): Observable<ApiPage<ServicoFarmaceuticoSummary>> {
    let params = new HttpParams().set('query', query.trim()).set('page', page).set('size', size);

    if (status !== 'TODOS') {
      params = params.set('status', status);
    }
    if (retornoHoje) {
      params = params.set('retornoHoje', true);
    }

    return this.http.get<ApiPage<ServicoFarmaceuticoSummary>>(this.resourceUrl, { params });
  }

  get(id: string): Observable<PharmaceuticalServiceAttendance> {
    return this.http.get<PharmaceuticalServiceAttendance>(`${this.resourceUrl}/${id}`);
  }

  advancedSearch(
    cpf: string,
    medicationId: string,
    batch: string,
    attendanceDate: string,
    page: number,
    size: number,
  ): Observable<ApiPage<ServicoFarmaceuticoAdvancedResult>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (cpf) {
      params = params.set('cpf', cpf);
    }
    if (medicationId) {
      params = params.set('medicamentoId', medicationId);
    }
    if (batch.trim()) {
      params = params.set('lote', batch.trim());
    }
    if (attendanceDate) {
      params = params.set('dataAtendimento', attendanceDate);
    }
    return this.http.get<ApiPage<ServicoFarmaceuticoAdvancedResult>>(
      `${this.resourceUrl}/busca-avancada`,
      { params },
    );
  }

  create(input: ServicoFarmaceuticoRequest): Observable<PharmaceuticalServiceAttendance> {
    return this.http.post<PharmaceuticalServiceAttendance>(this.resourceUrl, input);
  }

  update(
    id: string,
    input: ServicoFarmaceuticoRequest,
  ): Observable<PharmaceuticalServiceAttendance> {
    return this.http.put<PharmaceuticalServiceAttendance>(`${this.resourceUrl}/${id}`, input);
  }

  continuation(id: string): Observable<ContinuationContext> {
    return this.http.get<ContinuationContext>(`${this.resourceUrl}/${id}/continuacao`);
  }

  createReturn(
    previousAttendanceId: string,
    input: ServicoFarmaceuticoRequest,
  ): Observable<PharmaceuticalServiceAttendance> {
    return this.http.post<PharmaceuticalServiceAttendance>(
      `${this.resourceUrl}/${previousAttendanceId}/retornos`,
      input,
    );
  }

  close(id: string): Observable<PharmaceuticalServiceAttendance> {
    return this.http.post<PharmaceuticalServiceAttendance>(
      `${this.resourceUrl}/${id}/encerrar`,
      {},
    );
  }
}
