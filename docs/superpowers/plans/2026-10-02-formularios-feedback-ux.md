# Feedback consistente em formulários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fornecer feedback de validação, loading bloqueante e foco/scroll consistente em todos os submits assíncronos relevantes.

**Architecture:** Um utilitário de DOM pequeno localizará e focará o primeiro campo inválido após a renderização. Cada página conservará sua estratégia atual de formulário, usando estado reativo local para envio e as primitivas visuais já existentes no Design System. O Serviço Farmacêutico decidirá primeiro o Step semântico com erro e só então delegará a localização no DOM.

**Tech Stack:** Angular zoneless, signals, FormsModule/NgForm, RxJS, Vitest, CSS do Design System.

**Spec:** `docs/superpowers/specs/2026-10-02-formularios-feedback-ux-design.md`

## Global Constraints

- Reutilizar `.spinner`, `.label-required`, `.field-error`, `aria-invalid` e `aria-describedby`; não criar componentes Button/Field.
- Bloquear submit duplicado e encerrar loading em sucesso e erro, preservando formulário e fluxos de navegação existentes.
- Não adicionar validações, contratos, mudanças de domínio ou alterações de backend.
- Não usar `setTimeout` arbitrário nem `detectChanges()` como solução de estados de submit.
- Steps inativos de Serviço Farmacêutico não podem bloquear submit; drafts só são validados em `Adicionar`.
- Não utilizar subagents nesta implementação.

## Review Focus

- Dois Enter/cliques rápidos em submit válido devem produzir uma única chamada ao serviço.
- Erro assíncrono deve reabilitar o botão sem apagar valores já digitados.
- O primeiro erro de Serviço Farmacêutico deve respeitar a ordem de Steps, mesmo que seu campo precise ser renderizado ao expandir a seção.
- Um draft vazio de medicamento não pode invalidar o submit principal; seu preenchimento incompleto só deve aparecer após `Adicionar`.
- Um erro de API sem campo associado não deve causar scroll/foco arbitrário.

### Task 1: Criar utilitário de foco para erros de formulário

**Files:**
- Create: `src/app/domain/form-validation-focus.ts`
- Test: `src/app/domain/form-validation-focus.spec.ts`

**Interfaces:**
- Produces: `focusFirstInvalidField(root: HTMLElement, options?: { beforeLocate?: () => void; schedule?: (work: () => void) => void }): void`.
- Consumes: elementos focáveis marcados com `aria-invalid="true"` dentro de `root`.

- [ ] **Step 1: Escrever testes unitários que verificam foco e scroll somente no primeiro campo inválido visível**

Cobrir foco com `preventScroll`, `scrollIntoView` suave e exclusão de elementos invisíveis; usar uma função de agendamento de teste para tornar o comportamento determinístico.

- [ ] **Step 2: Executar o teste unitário para confirmar a falha inicial**

Run: `yarn test --watch=false --include src/app/domain/form-validation-focus.spec.ts`
Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar `focusFirstInvalidField`**

Executar `beforeLocate`, agendar a consulta após o ciclo de renderização por `requestAnimationFrame` como padrão, procurar em ordem de DOM campos focáveis `aria-invalid="true"`, ignorar os invisíveis e fazer scroll/foco sem consulta global ao documento.

- [ ] **Step 4: Executar o teste unitário novamente**

Run: `yarn test --watch=false --include src/app/domain/form-validation-focus.spec.ts`
Expected: PASS.

### Task 2: Padronizar Login, recuperação e cadastro público

**Files:**
- Modify: `src/app/pages/login-page/login-page.ts`
- Modify: `src/app/pages/login-page/login-page.html`
- Modify: `src/app/pages/recuperar-senha-page/recuperar-senha-page.ts`
- Modify: `src/app/pages/recuperar-senha-page/recuperar-senha-page.html`
- Modify: `src/app/pages/cadastro-usuario-page/cadastro-usuario-page.ts`
- Modify: `src/app/pages/cadastro-usuario-page/cadastro-usuario-page.html`
- Modify: `src/app/pages/cadastro-usuario-page/cadastro-usuario-page.spec.ts`
- Modify: `src/app/app.spec.ts`

**Interfaces:**
- Consumes: `focusFirstInvalidField` da Task 1.
- Produces: botões de Entrar, Enviar solicitação e Cadastrar com feedback bloqueante e erros acessíveis por campo.

- [ ] **Step 1: Escrever testes para login obrigatório, loading de login e recuperação com foco no primeiro erro**

Testar que submit vazio não chama login, que email/senha recebem erro associado e que botão mostra spinner/desabilita enquanto observable permanece pendente. Testar recuperação inválida focando email e saída de loading após erro.

- [ ] **Step 2: Executar os testes para confirmar as falhas de comportamento atual**

Run: `yarn test --watch=false --include src/app/app.spec.ts --include src/app/pages/cadastro-usuario-page/cadastro-usuario-page.spec.ts`
Expected: FAIL nas novas asserções de spinner, mensagens e foco.

- [ ] **Step 3: Implementar validação template-driven/manual e loading reativo das três telas**

Login deve usar `NgForm`/`NgModel` e signal de loading; recuperação deve chamar o utilitário após sua validação manual; cadastro deve substituir a procura local por `focusFirstInvalidField` e associar erros de API aos inputs. Todos os botões devem reutilizar `.spinner` e texto de ação.

- [ ] **Step 4: Executar os testes de telas públicas**

Run: `yarn test --watch=false --include src/app/app.spec.ts --include src/app/pages/cadastro-usuario-page/cadastro-usuario-page.spec.ts`
Expected: PASS.

### Task 3: Padronizar Paciente e o campo compartilhado

**Files:**
- Modify: `src/app/components/patient-form/patient-form.html`
- Modify: `src/app/pages/novo-paciente-page/novo-paciente-page.ts`
- Modify: `src/app/pages/novo-paciente-page/novo-paciente-page.html`
- Modify: `src/app/app.spec.ts`

**Interfaces:**
- Consumes: `focusFirstInvalidField` e o mapa de mensagens `errors` já recebido por `PatientForm`.
- Produces: criação/edição de paciente com loading, erros associados e foco no primeiro campo inválido.

- [ ] **Step 1: Escrever testes de paciente inválido, submit pendente e erro de API**

Cobrir CPF/nome/data de nascimento/celular vazios: request não chamado, mensagens aparecem e CPF recebe foco. Cobrir create/update pendente com botão desabilitado e erro que preserva valores/reabilita o botão.

- [ ] **Step 2: Executar os testes para confirmar a falha inicial**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: FAIL nas novas asserções de loading, foco e associação ARIA.

- [ ] **Step 3: Implementar estado reativo de tentativa/envio e associação de erros no `PatientForm`**

Transformar os estados de erro e submit necessários em signals sem modificar máscaras ou regras existentes. O formulário pai passa sua raiz ao utilitário quando a validação falhar; o filho atribui ids de mensagens e `aria-describedby` correspondentes.

- [ ] **Step 4: Executar os testes de paciente**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: PASS.

### Task 4: Padronizar Medicamento e Comorbidade

**Files:**
- Modify: `src/app/pages/novo-medicamento-page/novo-medicamento-page.ts`
- Modify: `src/app/pages/novo-medicamento-page/novo-medicamento-page.html`
- Modify: `src/app/pages/nova-comorbidade-page/nova-comorbidade-page.ts`
- Modify: `src/app/pages/nova-comorbidade-page/nova-comorbidade-page.html`
- Modify: `src/app/app.spec.ts`

**Interfaces:**
- Consumes: `focusFirstInvalidField` da Task 1.
- Produces: criação/edição de medicamento e comorbidade com foco em erro local, spinner e recuperação de erro remoto.

- [ ] **Step 1: Escrever testes para submits inválidos e para saída de loading em erro de API**

Verificar mensagem/`aria-invalid`/foco do nome obrigatório, ausência de chamada remota quando inválido, botão desabilitado enquanto pendente e retorno ao estado utilizável após erro.

- [ ] **Step 2: Executar os testes para confirmar a falha inicial**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: FAIL nas novas asserções de foco, spinner e erro remoto.

- [ ] **Step 3: Implementar foco acessível e loading nos dois CRUDs**

Preservar o modelo manual de validação e os redirects. Acrescentar `aria-describedby`, ids de erro e spinner somente ao botão de submit.

- [ ] **Step 4: Executar os testes dos CRUDs menores**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: PASS.

### Task 5: Implementar o fluxo semântico de erro do Serviço Farmacêutico

**Files:**
- Modify: `src/app/pages/servicos-farmaceuticos-page/servicos-farmaceuticos-page.ts`
- Modify: `src/app/pages/servicos-farmaceuticos-page/servicos-farmaceuticos-page.html`
- Modify: `src/app/app.spec.ts`

**Interfaces:**
- Consumes: `focusFirstInvalidField`, mapa `errors`, mapa `medicationErrors` e `enabledSteps`.
- Produces: `firstInvalidStep()`/equivalente que mapeia o primeiro erro à ordem semântica de Steps antes de qualquer procura no DOM.

- [ ] **Step 1: Escrever testes de Serviço Farmacêutico para os cenários obrigatórios**

Adicionar casos para: data de nascimento vazia (sem request, erro visível, Step paciente ativo, scroll/foco); dois erros no paciente (ambas mensagens e foco no primeiro); campo inválido em Step ativo mas inicialmente colapsado (Step abre antes de foco); Step inativo sem bloquear envio; draft de medicamento inválido ao adicionar (mensagens/foco) sem bloquear submit principal vazio; loading durante request e término em erro preservando dados.

- [ ] **Step 2: Executar os testes para confirmar a falha inicial**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: FAIL nas novas asserções de Step, foco e loading.

- [ ] **Step 3: Implementar estado reativo de submit e ordenação semântica de erros**

Usar signal para `isSubmitting`. Após `validateForm`, derivar o primeiro erro de uma tabela ordenada `erro → step`, abrir/renderizar o Step quando necessário e só então chamar o utilitário com a raiz do formulário. Continuar ignorando Steps inativos. Usar a mesma rotina, limitada à seção correspondente, em `addMedication` após validar o draft.

- [ ] **Step 4: Tornar as mensagens e campos do serviço acessíveis e exibir loading no botão**

Adicionar ids de `field-error`, `aria-describedby`, `label-required` apenas aos campos já obrigatórios e spinner/texto de salvamento ao botão. Não alterar requisitos clínicos ou de medicamentos.

- [ ] **Step 5: Executar os testes do Serviço Farmacêutico**

Run: `yarn test --watch=false --include src/app/app.spec.ts`
Expected: PASS.

### Task 6: Aplicar feedback visual simples às confirmações administrativas pertinentes

**Files:**
- Modify: `src/app/pages/admin-recuperacoes-senha-page/admin-recuperacoes-senha-page.html`
- Modify: `src/app/pages/admin-funcionarios-page/admin-funcionarios-page.html`
- Modify: `src/app/pages/visualizar-funcionario-page/visualizar-funcionario-page.ts`
- Modify: `src/app/pages/visualizar-funcionario-page/visualizar-funcionario-page.html`
- Modify: `src/app/pages/admin-funcionarios-page/admin-funcionarios-page.spec.ts`

**Interfaces:**
- Consumes: estados de bloqueio já existentes (`operationInProgressId`, `isApproving`, `isUpdatingTechnicalResponsible`).
- Produces: feedback visual de envio para confirmações que já bloqueiam duplicidade.

- [ ] **Step 1: Escrever testes para spinner e botão desabilitado durante confirmação administrativa pendente**

Cobrir ao menos a efetivação de funcionário, sem alterar os fluxos de listagem/diálogo existentes.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial**

Run: `yarn test --watch=false --include src/app/pages/admin-funcionarios-page/admin-funcionarios-page.spec.ts`
Expected: FAIL porque o spinner ainda não é renderizado.

- [ ] **Step 3: Implementar somente o feedback visual reutilizando `.spinner`**

Não alterar serviços, dialogs ou regras administrativas; apenas mudar o conteúdo dos botões enquanto os estados existentes estiverem ativos. Corrigir o retorno de `isUpdatingTechnicalResponsible` se a guarda antecipada de funcionário ausente puder mantê-lo ativo.

- [ ] **Step 4: Executar os testes administrativos**

Run: `yarn test --watch=false --include src/app/pages/admin-funcionarios-page/admin-funcionarios-page.spec.ts`
Expected: PASS.

### Task 7: Verificação completa e documentação de resultados

**Files:**
- Modify: os arquivos de teste alterados nas Tasks 1–6 apenas se a execução revelar ajuste legítimo de timing/fixture.

**Interfaces:**
- Consumes: toda a implementação e a especificação.
- Produces: evidência fresca de build e suíte completa.

- [ ] **Step 1: Executar a suíte completa**

Run: `yarn test --watch=false`
Expected: todos os testes passam, sem remoção de cobertura existente.

- [ ] **Step 2: Executar o build de produção**

Run: `yarn build`
Expected: build Angular concluído com exit code 0.

- [ ] **Step 3: Revisar diff e requisitos da especificação**

Run: `git diff --check && git diff --stat`
Expected: sem erro de whitespace e somente arquivos de UX/teste/documentação dentro do escopo.

- [ ] **Step 4: Commitar a implementação validada**

Run: `git add src docs && git commit -m "feat: improve form submission feedback"`
Expected: commit contendo apenas feedback de formulários, testes e documentação.
