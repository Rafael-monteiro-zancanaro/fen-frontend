import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TemporaryPharmaceuticalServiceStore } from '../../domain/temporary-pharmaceutical-service-store';

@Component({
  selector: 'app-visualizar-paciente-page',
  imports: [RouterLink],
  templateUrl: './visualizar-paciente-page.html',
})
export class VisualizarPacientePage {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(TemporaryPharmaceuticalServiceStore);
  private readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly patient = computed(() => this.store.getPatient(this.patientId));
  protected readonly comorbidities = computed(() => this.store.getPatientComorbidities(this.patientId));

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatPhone(phone: string): string {
    if (!phone) {
      return '';
    }

    return phone.length === 11
      ? phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      : phone;
  }

  protected formatCep(cep?: string): string {
    return cep ? cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
  }

  protected formatDate(value: string): string {
    return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '';
  }
}
