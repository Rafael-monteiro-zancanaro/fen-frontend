import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPrinter } from '@ng-icons/bootstrap-icons';
import { AtendimentoPdfService } from '../../domain/atendimento-pdf.service';
import {
  AttendanceStatus,
  FollowUpHistoryEntry,
  FollowUpHistoryStatus,
  PharmaceuticalServiceAttendance,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import {
  ATTENDANCE_STATUS_LABELS,
  PHARMACEUTICAL_SERVICE_LABELS,
  TemporaryPharmaceuticalServiceStore,
} from '../../domain/temporary-pharmaceutical-service-store';

@Component({
  selector: 'app-visualizar-atendimento-page',
  imports: [CommonModule, NgIcon, RouterLink],
  providers: [
    provideIcons({
      bootstrapPrinter,
    }),
  ],
  templateUrl: './visualizar-atendimento-page.html',
})
export class VisualizarAtendimentoPage {
  protected readonly isPrinting = signal(false);
  protected readonly printErrorMessage = signal('');
  protected readonly attendance = computed(() =>
    this.store.getAttendance(this.route.snapshot.paramMap.get('id') ?? ''),
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: TemporaryPharmaceuticalServiceStore,
    private readonly atendimentoPdfService: AtendimentoPdfService,
  ) {}

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
  }

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }

  protected historyStatusLabel(status: FollowUpHistoryStatus): string {
    if (status === 'PENDENTE') {
      return 'Pendente';
    }

    return this.statusLabel(status);
  }

  protected statusBadgeClass(status: AttendanceStatus): string {
    if (status === 'CONCLUIDO') {
      return 'badge badge-success';
    }

    if (status === 'EXPIRADO') {
      return 'badge badge-warning';
    }

    return 'badge badge-secondary';
  }

  protected serviceLabels(attendance: PharmaceuticalServiceAttendance): string {
    return attendance.selectedServices
      .map((service) => PHARMACEUTICAL_SERVICE_LABELS[service])
      .join(', ');
  }

  protected hasMedicationItems(items: ServiceMedicationItem[] | undefined): boolean {
    return Boolean(items?.length);
  }

  protected followUpHistory(attendance: PharmaceuticalServiceAttendance): FollowUpHistoryEntry[] {
    return this.store.followUpHistory(attendance.id);
  }

  protected async printAttendance(attendance: PharmaceuticalServiceAttendance): Promise<void> {
    if (this.isPrinting()) {
      return;
    }

    this.printErrorMessage.set('');
    this.isPrinting.set(true);

    try {
      await this.atendimentoPdfService.generate(attendance);
    } catch {
      this.printErrorMessage.set('Não foi possível gerar a via do paciente. Tente novamente.');
    } finally {
      this.isPrinting.set(false);
    }
  }
}
