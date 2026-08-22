import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { InternshipType, RegisterRequest } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';
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

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('senha')?.value === control.get('confirmarSenha')?.value
    ? null
    : { passwordMismatch: true };
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
  protected readonly registrationFailed = signal(false);
  protected readonly registrationSucceeded = signal(false);

  protected readonly registrationForm = this.formBuilder.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: [''],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
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
    this.registrationFailed.set(false);
    this.registrationSucceeded.set(false);
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }

    this.submitted.set(true);
    this.registrationFailed.set(false);
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
        error: () => this.registrationFailed.set(true),
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
