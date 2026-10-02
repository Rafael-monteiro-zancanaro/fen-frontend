# Feedback consistente em formulários — Design

## Objetivo

Tornar explícitos os quatro estados de todos os submits assíncronos relevantes: validação local, envio, sucesso e erro. A alteração preserva fluxos, contratos e regras de domínio existentes; seu escopo é apenas feedback, prevenção de envio duplicado e navegação até erros de formulário.

## Contexto observado

O frontend é Angular zoneless e não possui componentes Angular próprios de `Button` ou `Field`. O Design System em `src/styles.css` já fornece os elementos necessários: `.spinner`, `.label-required`, `.field-error`, estado visual por `aria-invalid` e aparência desabilitada de `.btn`.

Os formulários mapeados são:

- Login;
- recuperação de senha;
- cadastro público de farmacêutico/estagiário;
- paciente, em criação e edição;
- medicamento, em criação e edição;
- comorbidade, em criação e edição;
- serviço farmacêutico, em criação, edição e retorno.

As confirmações administrativas de aprovação de cadastro e de recuperação já evitam duplicidade. Elas receberão spinner apenas quando a alteração for local e simples; nenhuma remodelagem administrativa faz parte deste trabalho.

## Decisões

### Estados de submit

Cada submit assíncrono adotará um estado reativo local (`isSubmitting`, `saving` ou `loading`, conforme o nome já usado no componente). O método de submit verificará esse estado antes de validar e antes de chamar o serviço. Enquanto ativo, o botão será desabilitado e exibirá o `.spinner` junto com uma ação textual apropriada.

Os observables de criação/edição encerrarão esse estado tanto no sucesso quanto no erro. O sucesso preserva o redirecionamento atual; o erro preserva os dados e o alerta existente.

Não será criado um componente Button. As páginas reutilizarão diretamente as classes e o spinner do Design System.

### Validação por campo

Campos com regra existente de obrigatoriedade ou formato deverão usar `label-required` quando aplicável e, quando o erro é visível, `aria-invalid="true"`, uma mensagem próxima em `.field-error` e `aria-describedby` para o identificador da mensagem.

Formulários template-driven usarão `NgForm`/`NgModel`, `submitted` e `markAllAsTouched()` quando já forem compatíveis com a tela. Formulários com validação manual manterão suas regras atuais e usarão um estado de tentativa de validação quando necessário. Nenhuma regra de domínio, campo obrigatório ou contrato de API novo será criado.

O submit inválido nunca invoca a API. Todos os erros pertinentes são exibidos, mesmo que somente o primeiro receba foco.

### Foco e scroll compartilhados

Será criado um utilitário pequeno em `src/app/domain/` para receber o elemento raiz de um formulário e, opcionalmente, um callback que torna a área relevante visível. Ele agenda a procura após a atualização atual do DOM por `requestAnimationFrame` ou mecanismo Angular equivalente quando o contexto exigir, encontra o primeiro elemento focável com `aria-invalid="true"` em ordem de DOM, confirma que ele está visível e executa `scrollIntoView({ behavior: 'smooth', block: 'center' })` seguido de foco com `preventScroll` quando suportado.

O utilitário não terá IDs de páginas, não fará consulta global ao documento e não usará `setTimeout` arbitrário. Cada página fornecerá sua própria raiz via `ViewChild` quando precisar desse comportamento.

### Serviço Farmacêutico

O formulário continuará validando apenas os Steps ativos. A ordem de erro será a ordem visual das seções: identificação do paciente, cuidados farmacêuticos, injetáveis, inaloterapia, serviços farmacêuticos, farmacoterapia e acompanhamento.

Antes de consultar o DOM, o componente determinará pelo próprio estado de validação qual é o primeiro erro e a qual Step semântico ele pertence. Então garantirá que esse Step ativo esteja expandido/renderizado; somente após a atualização do DOM o utilitário localizará, rolará e focará o campo. Assim, um Step ativo mas colapsado não depende de o campo já existir na busca inicial por `[aria-invalid="true"]`. Steps inativos continuam sem validação e não participam dessa ordenação.

O Step do paciente é sempre a primeira seção. Em especial, ausência de `birthDate` deverá produzir a mensagem junto a `#dataNascimentoUsuario`, impedir o request, deixar o Step disponível e levá-lo ao foco/scroll.

Os drafts de medicamento continuarão independentes do submit principal. Apenas `Adicionar medicamento` valida o draft, exibe seus erros e foca o primeiro campo inválido daquele draft. Um draft vazio não bloqueia o atendimento principal.

### Acessibilidade e mensagens de API

Foco programático ocorrerá somente após submit inválido ou falha identificável de campo, nunca durante digitação e nunca para erro genérico de API. Mensagens de validação terão relação por `aria-describedby`; erros gerais da API permanecem em alerts. Erros de negócio já apresentados, como CPF/e-mail duplicados, devem ser preservados.

## Arquivos e impactos previstos

- Novo utilitário de foco/scroll e testes unitários.
- Ajustes nos templates e componentes dos sete grupos de formulários mapeados.
- Ajuste do componente compartilhado `PatientForm` para associação acessível de erros já recebidos por suas telas consumidoras.
- Testes de componente/página focados em submit inválido, loading, recuperação após erro e foco no primeiro campo inválido.
- Testes explícitos do Serviço Farmacêutico para data de nascimento ausente, múltiplos erros, Step ativo/inativo e draft de medicamento.

## Fora de escopo

- Backend, endpoints, DTOs, regras de negócio e redirects;
- migração forçada entre template-driven e Reactive Forms;
- redesign de botões ou campos;
- loading indiscriminado em ações não relacionadas a formulário.

## Critérios de aceitação

1. Todo submit assíncrono mapeado bloqueia repetição, mostra spinner e encerra loading em sucesso e erro.
2. Todo submit inválido deixa erros próximos aos campos relevantes e não chama o serviço remoto.
3. O primeiro campo inválido é focado e levado à área visível sem scroll para elementos ocultos.
4. Steps inativos de Serviço Farmacêutico não bloqueiam submit; erros de Steps ativos permanecem visíveis.
5. O caso de data de nascimento ausente no paciente impede o envio e foca o campo correspondente.
6. A suíte existente continua verde, com cobertura adicional dos casos de UX acima.
