import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupervisorOption {
  id: string;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  findSupervisores(): Observable<SupervisorOption[]> {
    return this.http.get<SupervisorOption[]>(`${environment.apiUrl}/api/public/supervisores`);
  }
}
