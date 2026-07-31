import { Routes } from '@angular/router';
import { CadastroUsuarioPage } from './pages/cadastro-usuario-page/cadastro-usuario-page';
import { InicioPage } from './pages/inicio-page/inicio-page';
import { LoginPage } from './pages/login-page/login-page';
import { ServicosFarmaceuticosPage } from './pages/servicos-farmaceuticos-page/servicos-farmaceuticos-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'cadastro',
    component: CadastroUsuarioPage,
  },
  {
    path: 'inicio',
    component: InicioPage,
  },
  {
    path: 'atendimentos/novo',
    component: ServicosFarmaceuticosPage,
  },
];
