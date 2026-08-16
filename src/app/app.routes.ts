import { Routes } from '@angular/router';
import { adminOnlyGuard } from './domain/admin-only.guard';
import { AtendimentosPage } from './pages/atendimentos-page/atendimentos-page';
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
  },
  {
    path: 'atendimentos',
    component: AtendimentosPage,
  },
  {
    path: 'atendimentos/novo',
    component: ServicosFarmaceuticosPage,
  },
  {
    path: 'atendimentos/:id',
    component: VisualizarAtendimentoPage,
  },
  {
    path: 'medicamentos',
    component: MedicamentosPage,
  },
  {
    path: 'medicamentos/novo',
    component: NovoMedicamentoPage,
  },
  {
    path: 'medicamentos/:id/editar',
    component: NovoMedicamentoPage,
  },
  {
    path: 'medicamentos/:id',
    component: VisualizarMedicamentoPage,
  },
  {
    path: 'comorbidades',
    component: ComorbidadesPage,
  },
  {
    path: 'comorbidades/nova',
    component: NovaComorbidadePage,
  },
  {
    path: 'comorbidades/:id/editar',
    component: NovaComorbidadePage,
  },
  {
    path: 'comorbidades/:id',
    component: VisualizarComorbidadePage,
  },
  {
    path: 'pacientes',
    component: PacientesPage,
  },
  {
    path: 'pacientes/novo',
    component: NovoPacientePage,
  },
  {
    path: 'pacientes/:id/editar',
    component: NovoPacientePage,
  },
  {
    path: 'pacientes/:id',
    component: VisualizarPacientePage,
  },
  {
    path: 'admin/recuperacoes-senha',
    component: AdminRecuperacoesSenhaPage,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/recuperacoes-senha/:id',
    component: VisualizarRecuperacaoSenhaPage,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/funcionarios',
    component: AdminFuncionariosPage,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/funcionarios/:id',
    component: VisualizarFuncionarioPage,
    canActivate: [adminOnlyGuard],
  },
];
