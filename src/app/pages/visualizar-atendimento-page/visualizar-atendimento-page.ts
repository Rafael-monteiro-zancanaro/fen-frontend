import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapDownload, bootstrapPaperclip, bootstrapPrinter, bootstrapTrash, bootstrapUpload } from '@ng-icons/bootstrap-icons';
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
  AttendanceAttachment,
} from '../../domain/clinical-records';
import { ServicoFarmaceuticoService } from '../../domain/servico-farmaceutico.service';

@Component({
  selector: 'app-visualizar-atendimento-page',
  imports: [CommonModule, NgIcon, RouterLink],
  providers: [
    provideIcons({
      bootstrapPrinter,
      bootstrapDownload, bootstrapPaperclip, bootstrapTrash, bootstrapUpload,
    }),
  ],
  templateUrl: './visualizar-atendimento-page.html',
})
export class VisualizarAtendimentoPage {
  protected readonly isLoading = signal(true);
  protected readonly isPrinting = signal(false);
  protected readonly printErrorMessage = signal('');
  protected readonly attendance = signal<PharmaceuticalServiceAttendance | null>(null);
  protected readonly attachments = signal<AttendanceAttachment[]>([]);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly isUploading = signal(false);
  protected readonly attachmentMessage = signal('');
  protected readonly attachmentPendingDelete = signal<AttendanceAttachment | null>(null);

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
        this.loadAttachments(id);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected selectAttachments(event: Event): void {
    this.selectedFiles.set(Array.from((event.target as HTMLInputElement).files ?? []));
  }

  protected uploadAttachments(id: string): void {
    const files = [...this.selectedFiles()];
    if (!files.length || this.isUploading()) return;
    this.isUploading.set(true); this.attachmentMessage.set('');
    const next = (success: string[], failed: string[]) => {
      const file = files.shift();
      if (!file) { this.isUploading.set(false); this.selectedFiles.set([]); this.attachmentMessage.set([success.length ? `${success.length} anexo(s) enviado(s).` : '', failed.length ? `${failed.length} arquivo(s) não puderam ser enviados.` : ''].filter(Boolean).join(' ')); this.loadAttachments(id); return; }
      this.servicoFarmaceuticoService.uploadAttachment(id, file).subscribe({ next: () => next([...success, file.name], failed), error: () => next(success, [...failed, file.name]) });
    };
    next([], []);
  }

  protected askDeleteAttachment(attachment: AttendanceAttachment): void { this.attachmentPendingDelete.set(attachment); }
  protected cancelDeleteAttachment(): void { this.attachmentPendingDelete.set(null); }
  protected confirmDeleteAttachment(id: string): void {
    const attachment = this.attachmentPendingDelete(); if (!attachment) return;
    this.servicoFarmaceuticoService.deleteAttachment(id, attachment.id).subscribe({ next: () => { this.attachmentPendingDelete.set(null); this.loadAttachments(id); }, error: () => this.attachmentMessage.set('Não foi possível remover o anexo.') });
  }
  protected downloadAttachment(id: string, attachment: AttendanceAttachment): void {
    this.servicoFarmaceuticoService.downloadAttachment(id, attachment.id).subscribe({ next: blob => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = attachment.nomeOriginal; link.click(); URL.revokeObjectURL(url); }, error: () => this.attachmentMessage.set('Não foi possível baixar o anexo.') });
  }
  protected formatSize(size: number): string { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`; }
  private loadAttachments(id: string): void { this.servicoFarmaceuticoService.listAttachments(id).subscribe({ next: attachments => this.attachments.set(attachments), error: () => this.attachments.set([]) }); }

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
