import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BRAZILIAN_STATES } from '../../domain/br-address';
import { Patient, PatientInput } from '../../domain/clinical-records';
import { maskBrazilianPhone, maskCep, maskCpf, onlyDigits } from '../../domain/text-masks';
import { TemporaryPharmaceuticalServiceStore } from '../../domain/temporary-pharmaceutical-service-store';
import { ViaCepAddress, ViaCepService } from '../../domain/via-cep.service';

@Component({
  selector: 'app-patient-form',
  imports: [FormsModule],
  templateUrl: './patient-form.html',
})
export class PatientForm {
  @Input({ required: true }) patient!: PatientInput;
  @Input() errors: Record<string, string> = {};
  @Input() cpfLookupEnabled = true;
  @Output() readonly patientSelected = new EventEmitter<Patient | null>();

  protected readonly brazilianStates = BRAZILIAN_STATES;
  protected patientLookupMessage = '';
  protected patientLookupVariant: 'info' | 'success' = 'info';
  protected cepLookupMessage = '';
  protected cepLookupVariant: 'info' | 'warning' = 'info';
  private lastCepLookup = '';
  private lastAutoFilledAddress: ViaCepAddress | null = null;

  constructor(
    private readonly store: TemporaryPharmaceuticalServiceStore,
    private readonly viaCep: ViaCepService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  protected consultPatientByCpf(): void {
    const cpfInput = document.getElementById('cpfUsuario') as HTMLInputElement | null;
    const cpf = onlyDigits(this.patient.cpf || cpfInput?.value || '');
    this.patient.cpf = maskCpf(cpf);

    if (cpf.length !== 11) {
      this.errors['patient.cpf'] = 'Informe um CPF com 11 dígitos para consultar.';
      this.patientLookupMessage = '';
      this.patientSelected.emit(null);
      return;
    }

    delete this.errors['patient.cpf'];
    const existingPatient = this.store.findPatientByCpf(cpf);

    if (existingPatient) {
      this.patient.name = existingPatient.name;
      this.patient.birthDate = existingPatient.birthDate;
      this.patient.cellPhone = maskBrazilianPhone(existingPatient.cellPhone);
      this.patient.gender = existingPatient.gender;
      this.patient.cep = maskCep(existingPatient.cep ?? '');
      this.patient.address = existingPatient.address;
      this.patient.neighborhood = existingPatient.neighborhood ?? '';
      this.patient.city = existingPatient.city;
      this.patient.state = existingPatient.state;
      this.patient.phone = maskBrazilianPhone(existingPatient.phone);
      this.patient.responsibleName = existingPatient.responsibleName;
      this.patient.comorbidityIds = [...existingPatient.comorbidityIds];
      this.syncPatientInputs();
      this.patientLookupVariant = 'info';
      this.patientLookupMessage =
        'Paciente encontrado. Os dados foram preenchidos automaticamente.';
      this.patientSelected.emit(existingPatient);
      return;
    }

    this.patientLookupVariant = 'success';
    this.patientLookupMessage =
      'CPF não encontrado. Preencha os dados para cadastrar um novo paciente.';
    this.patientSelected.emit(null);
  }

  protected updateCpf(input: HTMLInputElement): void {
    const cpf = onlyDigits(input.value);
    this.patient.cpf = maskCpf(cpf);
    input.value = this.patient.cpf;
    this.patientSelected.emit(null);

    if (cpf.length === 11 && this.cpfLookupEnabled) {
      this.consultPatientByCpf();
    }
  }

  protected updateCellPhone(input: HTMLInputElement): void {
    this.patient.cellPhone = maskBrazilianPhone(input.value);
    input.value = this.patient.cellPhone;
  }

  protected updatePhone(input: HTMLInputElement): void {
    this.patient.phone = maskBrazilianPhone(input.value);
    input.value = this.patient.phone;
  }

  protected async updateCep(input: HTMLInputElement): Promise<void> {
    const cep = onlyDigits(input.value);
    this.patient.cep = maskCep(cep);
    input.value = this.patient.cep;

    if (cep.length !== 8) {
      if (this.lastCepLookup && cep !== this.lastCepLookup) {
        this.clearPreviousAutoFilledAddress();
        this.lastCepLookup = '';
      }

      this.cepLookupMessage = '';
      return;
    }

    if (cep === this.lastCepLookup) {
      return;
    }

    this.clearPreviousAutoFilledAddress();
    this.lastCepLookup = cep;
    this.cepLookupMessage = '';
    const address = await this.viaCep.findAddressByCep(cep);

    if (this.lastCepLookup !== cep) {
      return;
    }

    if (!address) {
      this.lastAutoFilledAddress = null;
      this.cepLookupVariant = 'warning';
      this.cepLookupMessage =
        'O endereço não pôde ser preenchido automaticamente. Preencha os dados manualmente.';
      this.changeDetector.detectChanges();
      return;
    }

    this.applyAutoFilledAddress(address);
    this.lastAutoFilledAddress = address;
    this.cepLookupMessage = '';
    this.syncPatientInputs();
    this.changeDetector.detectChanges();
  }

  private syncPatientInputs(): void {
    const values: Record<string, string> = {
      nomeUsuario: this.patient.name,
      dataNascimentoUsuario: this.patient.birthDate,
      celularUsuario: this.patient.cellPhone,
      telefoneUsuario: this.patient.phone,
      cepUsuario: this.patient.cep ?? '',
      enderecoUsuario: this.patient.address,
      bairroUsuario: this.patient.neighborhood ?? '',
      cidadeUsuario: this.patient.city,
      estadoUsuario: this.patient.state,
      responsavelUsuario: this.patient.responsibleName,
    };

    for (const [id, value] of Object.entries(values)) {
      const input = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;

      if (input) {
        input.value = value;
      }
    }
  }

  private applyAutoFilledAddress(address: ViaCepAddress): void {
    this.updateAutoFilledField('address', address.street, this.lastAutoFilledAddress?.street);
    this.updateAutoFilledField(
      'neighborhood',
      address.neighborhood,
      this.lastAutoFilledAddress?.neighborhood,
    );
    this.updateAutoFilledField('city', address.city, this.lastAutoFilledAddress?.city);
    this.updateAutoFilledField('state', address.state, this.lastAutoFilledAddress?.state);
  }

  private updateAutoFilledField(
    field: 'address' | 'neighborhood' | 'city' | 'state',
    value: string,
    previousValue?: string,
  ): void {
    if (!value) {
      return;
    }

    const currentValue = this.patient[field] ?? '';

    if (!currentValue || currentValue === previousValue) {
      this.patient[field] = value;
    }
  }

  private clearPreviousAutoFilledAddress(): void {
    if (!this.lastAutoFilledAddress) {
      return;
    }

    const previousAddress = this.lastAutoFilledAddress;

    if (this.patient.address === previousAddress.street) {
      this.patient.address = '';
    }

    if (this.patient.neighborhood === previousAddress.neighborhood) {
      this.patient.neighborhood = '';
    }

    if (this.patient.city === previousAddress.city) {
      this.patient.city = '';
    }

    if (this.patient.state === previousAddress.state) {
      this.patient.state = '';
    }

    this.lastAutoFilledAddress = null;
  }
}
