import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { onlyDigits, maskCpf } from '../../domain/text-masks';
import { Supervisor, UsuarioRegisterRequest, UsuarioService } from '../../domain/usuario.service';

type UserProfile = 'farmaceutico' | 'estagiario';

interface RegistrationForm {
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  crf: string;
  tipoEstagio: '' | 'obrigatorio' | 'nao-obrigatorio';
  supervisor: string;
  inicioVigencia: string;
  fimVigencia: string;
}

interface ApiError {
  message?: string;
  fieldErrors?: Record<string, string>;
}

@Component({
  selector: 'app-cadastro-usuario-page',
  imports: [FormsModule],
  templateUrl: './cadastro-usuario-page.html',
})
export class CadastroUsuarioPage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  @ViewChild('cadastroForm') private cadastroForm?: NgForm;
  @ViewChild('cadastroFormElement') private cadastroFormElement?: ElementRef<HTMLFormElement>;

  protected readonly selectedProfile = signal<UserProfile>('farmaceutico');
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly supervisors = signal<Supervisor[]>([]);
  protected form: RegistrationForm = this.emptyForm();

  constructor() {
    this.usuarioService.supervisores().subscribe({ next: (items) => this.supervisors.set(items) });
  }

  protected selectProfile(profile: UserProfile): void {
    if (this.selectedProfile() === profile) {
      return;
    }
    this.selectedProfile.set(profile);
    this.fieldErrors.set({});
    if (profile === 'farmaceutico') {
      this.form.tipoEstagio = '';
      this.form.supervisor = '';
      this.form.inicioVigencia = '';
      this.form.fimVigencia = '';
    } else {
      this.form.crf = '';
    }
  }

  protected updateCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cpf = maskCpf(input.value);
    this.form.cpf = cpf;
    input.value = cpf;
  }

  protected shouldShowError(control: NgModel): boolean {
    return Boolean(control.invalid && (control.touched || this.submitted()));
  }

  protected fieldError(control: NgModel, field: string, messages: Record<string, string>): string {
    if (this.fieldErrors()[field]) {
      return this.fieldErrors()[field];
    }
    if (!this.shouldShowError(control)) {
      return '';
    }
    return Object.entries(messages).find(([error]) => control.errors?.[error])?.[1] ?? '';
  }

  protected passwordsDiffer(): boolean {
    return Boolean(this.form.senha || this.form.confirmarSenha) && this.form.senha !== this.form.confirmarSenha;
  }

  protected invalidInternshipDates(): boolean {
    return Boolean(this.form.inicioVigencia && this.form.fimVigencia)
      && this.form.fimVigencia < this.form.inicioVigencia;
  }

  protected submit(): void {
    if (this.loading()) {
      return;
    }
    this.submitted.set(true);
    this.error.set('');
    this.fieldErrors.set({});
    this.cadastroForm?.control.markAllAsTouched();

    if (this.hasInvalidRegistration()) {
      this.error.set('Há erros no formulário. Revise os campos indicados.');
      this.focusFirstInvalidField();
      return;
    }

    this.loading.set(true);
    this.usuarioService.register(this.toRequest()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/login'], {
          state: { registrationMessage: 'Cadastro realizado com sucesso e enviado para aprovação.' },
        });
      },
      error: (response: HttpErrorResponse) => {
        const body = response.error as ApiError | undefined;
        this.fieldErrors.set(body?.fieldErrors ?? {});
        this.error.set(body?.message ?? 'Não foi possível realizar o cadastro.');
        this.loading.set(false);
        this.focusFirstInvalidField();
      },
    });
  }

  private toRequest(): UsuarioRegisterRequest {
    const base = {
      nome: this.form.nome.trim(),
      cpf: onlyDigits(this.form.cpf),
      dataNascimento: this.form.dataNascimento || undefined,
      email: this.form.email.trim(),
      senha: this.form.senha,
    };
    if (this.selectedProfile() === 'farmaceutico') {
      return { ...base, role: 'FARMACEUTICO', crf: this.form.crf.trim() };
    }
    return {
      ...base,
      role: 'ESTAGIARIO',
      tipoEstagio: this.form.tipoEstagio === 'obrigatorio' ? 'OBRIGATORIO' : 'NAO_OBRIGATORIO',
      supervisorId: this.form.supervisor,
      inicioVigencia: this.form.inicioVigencia,
      fimVigencia: this.form.fimVigencia,
    };
  }

  private focusFirstInvalidField(): void {
    queueMicrotask(() => {
      const element = this.cadastroFormElement?.nativeElement.querySelector<HTMLElement>('.ng-invalid');
      element?.focus();
      if (typeof element?.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  private hasInvalidRegistration(): boolean {
    const hasInvalidCommonData = !this.form.nome.trim()
      || onlyDigits(this.form.cpf).length !== 11
      || !this.form.email.trim()
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)
      || this.form.senha.length < 8
      || this.form.senha.length > 72
      || !this.form.confirmarSenha
      || this.passwordsDiffer();
    if (hasInvalidCommonData) {
      return true;
    }
    if (this.selectedProfile() === 'farmaceutico') {
      return !this.form.crf.trim();
    }
    return !this.form.tipoEstagio || !this.form.supervisor || !this.form.inicioVigencia
      || !this.form.fimVigencia || this.invalidInternshipDates();
  }

  private emptyForm(): RegistrationForm {
    return {
      nome: '', cpf: '', dataNascimento: '', email: '', senha: '', confirmarSenha: '', crf: '',
      tipoEstagio: '', supervisor: '', inicioVigencia: '', fimVigencia: '',
    };
  }
}
