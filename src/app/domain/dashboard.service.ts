import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AttendanceStatus, PharmaceuticalServiceKey } from './clinical-records';

export interface DashboardSummary {
  indicators: {
    awaitingReturn: number;
    returnsToday: number;
    totalAttendances: number;
    expired: number;
  };
  serviceTypes: { type: PharmaceuticalServiceKey; count: number }[];
  statuses: { status: AttendanceStatus; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/api/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.resourceUrl);
  }
}
