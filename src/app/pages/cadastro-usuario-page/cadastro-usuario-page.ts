import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiError, InternshipType, RegisterRequest } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';
import { utf8ByteLength } from '../../auth/password.validators';
import { RegistrationService, SupervisorOption } from '../../auth/registration.service';

type UserProfile = 'farmaceutico' | 'estagiario';
type RegistrationControlName =
  | 'nome'
  | 'cpf'
  | 'email'
  | 'senha'
  | 'confirmarSenha'
  | 'crf'
  | 'tipoEstagio'
  | 'supervisorId'
  | 'inicioVigencia'
  | 'fimVigencia';

const GENERIC_REGISTRATION_ERROR = 'Revise os dados informados e tente novamente.';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('senha')?.value === control.get('confirmarSenha')?.value
    ? null
    : { passwordMismatch: true };
}

function registrationErrorMessages(error: unknown): string[] {
  if (
    !(error instanceof HttpErrorResponse) ||
    ![400, 409].includes(error.status) ||
    !isApiError(error.error, error.status)
  ) {
    return [GENERIC_REGISTRATION_ERROR];
  }

  const messages = [error.error.message, ...Object.values(error.error.fieldErrors)]
    .map((message) => message.trim())
    .filter((message) => message.length > 0);

  return messages.length > 0 ? Array.from(new Set(messages)) : [GENERIC_REGISTRATION_ERROR];
}

function isApiError(value: unknown, expectedStatus: number): value is ApiError {
  if (!isRecord(value) || !isRecord(value['fieldErrors'])) {
    return false;
  }

  return (
    typeof value['timestamp'] === 'string' &&
    value['status'] === expectedStatus &&
    typeof value['code'] === 'string' &&
    typeof value['message'] === 'string' &&
    Object.values(value['fieldErrors']).every((message) => typeof message === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Component({
  selector: 'app-cadastro-usuario-page',
  imports: [ReactiveFormsModule],
  templateUrl: './cadastro-usuario-page.html',
})
export class CadastroUsuarioPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly registration = inject(RegistrationService);

  protected readonly selectedProfile = signal<UserProfile>('farmaceutico');
  protected readonly supervisors = signal<SupervisorOption[]>([]);
  protected readonly supervisorsLoading = signal(true);
  protected readonly supervisorsFailed = signal(false);
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly registrationErrorMessages = signal<string[]>([]);
  protected readonly registrationSucceeded = signal(false);

  protected readonly registrationForm = this.formBuilder.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: [''],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      senha: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          utf8ByteLength(72),
        ],
      ],
      confirmarSenha: ['', Validators.required],
      crf: ['', [Validators.required, Validators.maxLength(20)]],
      responsavelTecnico: [false],
      tipoEstagio: ['' as InternshipType | ''],
      supervisorId: [''],
      inicioVigencia: [''],
      fimVigencia: [''],
    },
    { validators: matchingPasswords },
  );

  constructor() {
    this.registration
      .findSupervisores()
      .pipe(finalize(() => this.supervisorsLoading.set(false)))
      .subscribe({
        next: (supervisors) => this.supervisors.set(supervisors),
        error: () => this.supervisorsFailed.set(true),
      });
  }

  protected selectProfile(profile: UserProfile): void {
    if (profile === this.selectedProfile()) {
      return;
    }

    this.selectedProfile.set(profile);
    this.updateRoleValidators(profile);
    this.registrationErrorMessages.set([]);
    this.registrationSucceeded.set(false);
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }

    this.submitted.set(true);
    this.registrationErrorMessages.set([]);
    this.registrationSucceeded.set(false);

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.auth
      .register(this.buildRequest())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.registrationSucceeded.set(true),
        error: (error: unknown) =>
          this.registrationErrorMessages.set(registrationErrorMessages(error)),
      });
  }

  protected hasError(controlName: RegistrationControlName, error: string): boolean {
    const control = this.registrationForm.controls[controlName];
    return control.hasError(error) && (control.touched || this.submitted());
  }

  protected hasPasswordMismatch(): boolean {
    const confirmation = this.registrationForm.controls.confirmarSenha;
    return (
      this.registrationForm.hasError('passwordMismatch') &&
      (confirmation.touched || this.submitted())
    );
  }

  private updateRoleValidators(profile: UserProfile): void {
    const controls = this.registrationForm.controls;
    const internControls = [
      controls.tipoEstagio,
      controls.supervisorId,
      controls.inicioVigencia,
      controls.fimVigencia,
    ];

    if (profile === 'farmaceutico') {
      controls.crf.setValidators([Validators.required, Validators.maxLength(20)]);
      controls.crf.updateValueAndValidity({ emitEvent: false });
      for (const control of internControls) {
        control.clearValidators();
        control.reset('', { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      controls.crf.clearValidators();
      controls.crf.reset('', { emitEvent: false });
      controls.crf.updateValueAndValidity({ emitEvent: false });
      controls.responsavelTecnico.reset(false, { emitEvent: false });
      for (const control of internControls) {
        control.setValidators(Validators.required);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private buildRequest(): RegisterRequest {
    const value = this.registrationForm.getRawValue();
    const common = {
      nome: value.nome.trim(),
      cpf: value.cpf,
      ...(value.dataNascimento ? { dataNascimento: value.dataNascimento } : {}),
      email: value.email.trim(),
      senha: value.senha,
    };

    if (this.selectedProfile() === 'farmaceutico') {
      return {
        ...common,
        role: 'FARMACEUTICO',
        crf: value.crf.trim(),
        responsavelTecnico: value.responsavelTecnico,
      };
    }

    return {
      ...common,
      role: 'ESTAGIARIO',
      tipoEstagio: value.tipoEstagio as InternshipType,
      supervisorId: value.supervisorId,
      inicioVigencia: value.inicioVigencia,
      fimVigencia: value.fimVigencia,
    };
  }
}
