import { Component, signal } from '@angular/core';

type UserProfile = 'farmaceutico' | 'estagiario';

@Component({
  selector: 'app-cadastro-usuario-page',
  templateUrl: './cadastro-usuario-page.html',
})
export class CadastroUsuarioPage {
  protected readonly selectedProfile = signal<UserProfile>('farmaceutico');

  protected selectProfile(profile: UserProfile): void {
    this.selectedProfile.set(profile);
  }
}
