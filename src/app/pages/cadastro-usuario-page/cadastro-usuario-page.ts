import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supervisor, UsuarioService } from '../../domain/usuario.service';

type UserProfile = 'farmaceutico' | 'estagiario';

@Component({
  selector: 'app-cadastro-usuario-page',
  imports: [FormsModule],
  templateUrl: './cadastro-usuario-page.html',
})
export class CadastroUsuarioPage {
  protected readonly selectedProfile = signal<UserProfile>('farmaceutico');

  protected selectProfile(profile: UserProfile): void {
    this.selectedProfile.set(profile);
  }
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly supervisors = signal<Supervisor[]>([]);
  protected form: Record<string, string | boolean> = { responsavelTecnico: false, tipoEstagio: '' };
  constructor(private readonly usuarioService: UsuarioService) {
    this.usuarioService.supervisores().subscribe({ next: (items) => this.supervisors.set(items) });
  }
  protected submit(): void {
    if (this.form['senha'] !== this.form['confirmarSenha']) {
      this.error.set('A confirmação de senha deve ser igual à senha.');
      return;
    }
    const role = this.selectedProfile() === 'farmaceutico' ? 'FARMACEUTICO' : 'ESTAGIARIO';
    const request = {
      ...this.form,
      nome: String(this.form['nome'] ?? ''),
      cpf: String(this.form['cpf'] ?? ''),
      email: String(this.form['email'] ?? ''),
      senha: String(this.form['senha'] ?? ''),
      role,
      tipoEstagio:
        this.form['tipoEstagio'] === 'obrigatorio'
          ? 'OBRIGATORIO'
          : this.form['tipoEstagio'] === 'nao-obrigatorio'
            ? 'NAO_OBRIGATORIO'
            : undefined,
      supervisorId: this.form['supervisor'] || undefined,
    } as never;
    this.loading.set(true);
    this.usuarioService.register(request).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.error.set('Não foi possível realizar o cadastro.');
        this.loading.set(false);
      },
    });
  }
}
