# Via do Paciente em PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar um PDF A4 da via do paciente para cada atendimento farmacêutico, usando dados reais do atendimento e um template dedicado.

**Architecture:** A listagem e a visualização chamam o mesmo serviço de PDF. O serviço converte o atendimento para `AtendimentoPrintData`, cria dinamicamente um componente de impressão fora da viewport, chama `html2pdf.js` e remove o container temporário ao terminar.

**Tech Stack:** Angular standalone components, TypeScript, html2pdf.js, @ng-icons/bootstrap-icons, Vitest/Angular unit tests.

---

### Task 1: Dados de Impressão

**Files:**

- Create: `src/app/domain/atendimento-print-data.ts`
- Create: `src/app/domain/atendimento-print-data.spec.ts`

- [ ] Escrever teste para mapear código, paciente, serviços opcionais, múltiplos medicamentos e retorno.
- [ ] Implementar `buildAtendimentoPrintData(attendance)`.
- [ ] Rodar o teste específico e confirmar que passa.

### Task 2: Template A4

**Files:**

- Create: `src/app/components/atendimento-print/atendimento-print.ts`
- Create: `src/app/components/atendimento-print/atendimento-print.html`
- Create: `src/app/components/atendimento-print/atendimento-print.css`

- [ ] Criar componente standalone com input obrigatório `data`.
- [ ] Renderizar cabeçalho institucional, título, identificação do paciente, blocos condicionais, tabelas de medicamentos, acompanhamento e assinaturas.
- [ ] Usar CSS local em milímetros, bordas simples, `page-break-inside: avoid` e visual preto e branco.

### Task 3: Serviço de PDF

**Files:**

- Create: `src/app/domain/atendimento-pdf.service.ts`

- [ ] Criar componente dinamicamente com `createComponent`.
- [ ] Renderizar em container fixo fora da viewport, não `display: none`.
- [ ] Aguardar estabilidade/imagens.
- [ ] Chamar `html2pdf.js` com A4 portrait, margens controladas, `html2canvas.scale` equilibrado e filename `atendimento-<codigo>.pdf`.
- [ ] Limpar componente/container em `finally`.

### Task 4: Ações na Listagem e Visualização

**Files:**

- Modify: `src/app/pages/atendimentos-page/atendimentos-page.ts`
- Modify: `src/app/pages/atendimentos-page/atendimentos-page.html`
- Modify: `src/app/pages/visualizar-atendimento-page/visualizar-atendimento-page.ts`
- Modify: `src/app/pages/visualizar-atendimento-page/visualizar-atendimento-page.html`

- [ ] Adicionar ícone `bootstrapPrinter`.
- [ ] Adicionar loading por atendimento e prevenção de clique duplicado.
- [ ] Exibir erro de geração sem quebrar a tela.
- [ ] Reutilizar `AtendimentoPdfService` nos dois pontos.

### Task 5: Validação

**Files:**

- Existing Angular project files.

- [ ] Rodar teste do mapper.
- [ ] Rodar build.
- [ ] Corrigir falhas com investigação antes de alterar código.
