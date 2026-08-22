import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminOnlyGuard } from './domain/admin-only.guard';
import { AtendimentosPage } from './pages/atendimentos-page/atendimentos-page';
import { BuscaAvancadaAtendimentosPage } from './pages/busca-avancada-atendimentos-page/busca-avancada-atendimentos-page';
import { AdminFuncionariosPage } from './pages/admin-funcionarios-page/admin-funcionarios-page';
import { AdminRecuperacoesSenhaPage } from './pages/admin-recuperacoes-senha-page/admin-recuperacoes-senha-page';
import { CadastroUsuarioPage } from './pages/cadastro-usuario-page/cadastro-usuario-page';
import { ComorbidadesPage } from './pages/comorbidades-page/comorbidades-page';
import { InicioPage } from './pages/inicio-page/inicio-page';
import { LoginPage } from './pages/login-page/login-page';
import { MedicamentosPage } from './pages/medicamentos-page/medicamentos-page';
import { NovaComorbidadePage } from './pages/nova-comorbidade-page/nova-comorbidade-page';
import { NovoMedicamentoPage } from './pages/novo-medicamento-page/novo-medicamento-page';
import { NovoPacientePage } from './pages/novo-paciente-page/novo-paciente-page';
import { PacientesPage } from './pages/pacientes-page/pacientes-page';
import { RecuperarSenhaPage } from './pages/recuperar-senha-page/recuperar-senha-page';
import { ServicosFarmaceuticosPage } from './pages/servicos-farmaceuticos-page/servicos-farmaceuticos-page';
import { VisualizarComorbidadePage } from './pages/visualizar-comorbidade-page/visualizar-comorbidade-page';
import { VisualizarFuncionarioPage } from './pages/visualizar-funcionario-page/visualizar-funcionario-page';
import { VisualizarMedicamentoPage } from './pages/visualizar-medicamento-page/visualizar-medicamento-page';
import { VisualizarPacientePage } from './pages/visualizar-paciente-page/visualizar-paciente-page';
import { VisualizarRecuperacaoSenhaPage } from './pages/visualizar-recuperacao-senha-page/visualizar-recuperacao-senha-page';
import { VisualizarAtendimentoPage } from './pages/visualizar-atendimento-page/visualizar-atendimento-page';

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
    path: 'recuperar-senha',
    component: RecuperarSenhaPage,
  },
  {
    path: 'inicio',
    component: InicioPage,
    canActivate: [authGuard],
  },
  {
    path: 'atendimentos',
    component: AtendimentosPage,
    canActivate: [authGuard],
  },
  {
    path: 'atendimentos/busca-avancada',
    component: BuscaAvancadaAtendimentosPage,
    canActivate: [authGuard],
  },
  {
    path: 'atendimentos/novo',
    component: ServicosFarmaceuticosPage,
    canActivate: [authGuard],
  },
  {
    path: 'atendimentos/:id/continuar',
    component: ServicosFarmaceuticosPage,
    canActivate: [authGuard],
  },
  {
    path: 'atendimentos/:id',
    component: VisualizarAtendimentoPage,
    canActivate: [authGuard],
  },
  {
    path: 'medicamentos',
    component: MedicamentosPage,
    canActivate: [authGuard],
  },
  {
    path: 'medicamentos/novo',
    component: NovoMedicamentoPage,
    canActivate: [authGuard],
  },
  {
    path: 'medicamentos/:id/editar',
    component: NovoMedicamentoPage,
    canActivate: [authGuard],
  },
  {
    path: 'medicamentos/:id',
    component: VisualizarMedicamentoPage,
    canActivate: [authGuard],
  },
  {
    path: 'comorbidades',
    component: ComorbidadesPage,
    canActivate: [authGuard],
  },
  {
    path: 'comorbidades/nova',
    component: NovaComorbidadePage,
    canActivate: [authGuard],
  },
  {
    path: 'comorbidades/:id/editar',
    component: NovaComorbidadePage,
    canActivate: [authGuard],
  },
  {
    path: 'comorbidades/:id',
    component: VisualizarComorbidadePage,
    canActivate: [authGuard],
  },
  {
    path: 'pacientes',
    component: PacientesPage,
    canActivate: [authGuard],
  },
  {
    path: 'pacientes/novo',
    component: NovoPacientePage,
    canActivate: [authGuard],
  },
  {
    path: 'pacientes/:id/editar',
    component: NovoPacientePage,
    canActivate: [authGuard],
  },
  {
    path: 'pacientes/:id',
    component: VisualizarPacientePage,
    canActivate: [authGuard],
  },
  {
    path: 'admin/recuperacoes-senha',
    component: AdminRecuperacoesSenhaPage,
    canActivate: [authGuard, adminOnlyGuard],
  },
  {
    path: 'admin/recuperacoes-senha/:id',
    component: VisualizarRecuperacaoSenhaPage,
    canActivate: [authGuard, adminOnlyGuard],
  },
  {
    path: 'admin/funcionarios',
    component: AdminFuncionariosPage,
    canActivate: [authGuard, adminOnlyGuard],
  },
  {
    path: 'admin/funcionarios/:id',
    component: VisualizarFuncionarioPage,
    canActivate: [authGuard, adminOnlyGuard],
  },
];
