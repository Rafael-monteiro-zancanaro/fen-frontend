import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comorbidity, Medication } from './clinical-records';

export interface MedicationInteractionPair { medication: Medication; comorbidity: Comorbidity; }

@Injectable({ providedIn: 'root' })
export class InteractionService {
  private readonly http = inject(HttpClient);
  findPairs(medicationIds: string[], comorbidityIds: string[]): Observable<MedicationInteractionPair[]> {
    if (!medicationIds.length || !comorbidityIds.length) return of([]);
    const params = new HttpParams()
      .set('medicamentoIds', medicationIds.join(','))
      .set('comorbidadeIds', comorbidityIds.join(','));
    return this.http.get<MedicationInteractionPair[]>(`${environment.apiUrl}/api/interacoes`, { params });
  }
}
