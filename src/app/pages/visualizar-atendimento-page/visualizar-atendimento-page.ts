import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPrinter } from '@ng-icons/bootstrap-icons';
import { AtendimentoPdfService } from '../../domain/atendimento-pdf.service';
import {
  ATTENDANCE_STATUS_LABELS,
  PHARMACEUTICAL_SERVICE_LABELS,
} from '../../domain/attendance-labels';
import {
  AttendanceStatus,
  FollowUpHistoryEntry,
  FollowUpHistoryStatus,
  PharmaceuticalServiceAttendance,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import { ServicoFarmaceuticoService } from '../../domain/servico-farmaceutico.service';

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
  protected readonly isLoading = signal(true);
  protected readonly isPrinting = signal(false);
  protected readonly printErrorMessage = signal('');
  protected readonly attendance = signal<PharmaceuticalServiceAttendance | null>(null);

  constructor(
    route: ActivatedRoute,
    private readonly servicoFarmaceuticoService: ServicoFarmaceuticoService,
    private readonly atendimentoPdfService: AtendimentoPdfService,
  ) {
    route.paramMap.subscribe((params) => this.loadAttendance(params.get('id')));
  }

  private loadAttendance(id: string | null): void {
    this.isLoading.set(true);
    this.attendance.set(null);

    if (!id) {
      this.isLoading.set(false);
      return;
    }

    this.servicoFarmaceuticoService.get(id).subscribe({
      next: (attendance) => {
        this.attendance.set(attendance);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string): string {
    const dateTime = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(dateTime));
  }

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }

  protected historyStatusLabel(status: FollowUpHistoryStatus): string {
    return status === 'PENDENTE' ? 'Pendente' : this.statusLabel(status);
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
    return attendance.followUpHistory ?? [];
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
