# AGENTS.md

## Objetivo deste arquivo

Este arquivo define como agentes de código devem trabalhar neste repositório.

Antes de implementar qualquer alteração relevante, o agente deve compreender o contexto da tarefa, consultar a documentação aplicável e preservar os padrões existentes do projeto.

O projeto é o frontend de um Trabalho de Conclusão de Curso relacionado à **Farmácia Ensino da Universidade Estadual de Maringá — FEN/UEM**.

Stack principal:

* Angular
* Tailwind CSS 4
* Design System próprio definido no `app.css`

---

## Documentação obrigatória

O projeto possui documentação complementar:

```text
docs/
├── domain.md
└── frontend-design-system.md
```

### `docs/domain.md`

Consulte este arquivo para tarefas que envolvam:

* regras de negócio;
* atendimentos farmacêuticos;
* pacientes;
* medicamentos;
* comorbidades;
* interações;
* acompanhamentos;
* serviços farmacêuticos;
* estados ou fluxos de entidades;
* nomenclatura do domínio.

### `docs/frontend-design-system.md`

Consulte este arquivo para qualquer tarefa relacionada a:

* criação ou alteração de telas;
* componentes visuais;
* formulários;
* tabelas;
* cards;
* dialogs;
* menus;
* alerts;
* dashboards;
* responsividade;
* acessibilidade;
* estilos;
* alterações no `app.css`.

### Documentos de requisitos

Quando documentos de requisitos estiverem disponíveis, eles são a principal fonte de verdade para regras funcionais.

Não substitua uma regra explícita dos requisitos por uma suposição baseada apenas em convenções ou boas práticas genéricas.

---

# Regra principal

Antes de criar algo novo, procure entender e reutilizar o que já existe.

Siga, de forma geral:

> entender → procurar → reutilizar → compor → estender → criar

Evite:

> assumir → recriar → duplicar → refatorar sem necessidade

---

# Antes de implementar uma tarefa

Antes de alterar o código:

1. leia os arquivos diretamente relacionados à tarefa;
2. procure implementações semelhantes no projeto;
3. identifique componentes, services, types e utilitários reutilizáveis;
4. consulte `docs/domain.md` quando houver regra de negócio envolvida;
5. consulte `docs/frontend-design-system.md` quando houver interface envolvida;
6. consulte requisitos disponíveis;
7. identifique o menor conjunto de alterações necessário.

Não comece criando novas abstrações antes de verificar o código existente.

---

# Escopo das alterações

Faça alterações pequenas, focadas e diretamente relacionadas à solicitação.

Evite:

* refatorar código não relacionado;
* renomear estruturas sem necessidade;
* alterar APIs públicas de componentes sem motivo;
* reorganizar pastas apenas por preferência;
* remover funcionalidades existentes;
* substituir padrões existentes por outros apenas por gosto pessoal.

Se identificar um problema fora do escopo da tarefa, mencione-o separadamente em vez de alterá-lo automaticamente.

---

# Arquitetura Angular

Preserve a arquitetura existente do projeto.

Antes de criar uma nova estrutura:

1. observe como funcionalidades semelhantes estão organizadas;
2. siga as convenções de nomes existentes;
3. reutilize services existentes;
4. reutilize types e interfaces existentes;
5. preserve o padrão atual de componentes e organização de arquivos.

Não introduza uma arquitetura paralela.

Não altere a arquitetura global do frontend para facilitar uma única implementação.

---

# Componentes

Antes de criar um componente novo, procure por componentes existentes que possam ser reutilizados ou compostos.

Evite criar versões diferentes da mesma abstração.

Exemplos:

* `PatientSelect`
* `PatientSelector`
* `PatientPicker`
* `SelectPatient`

não devem coexistir se representarem essencialmente a mesma responsabilidade.

Prefira um componente reutilizável com uma API adequada.

---

# Regras de negócio

Não invente regras de domínio.

Antes de implementar comportamentos relacionados ao negócio:

1. consulte `docs/domain.md`;
2. consulte os documentos de requisitos;
3. procure tipos, models e implementações existentes;
4. verifique se a regra já está representada no código.

Se a informação necessária não estiver documentada, não transforme uma suposição em regra definitiva sem necessidade.

---

# Contratos de API

Não invente endpoints ou contratos de backend como se fossem definitivos.

Antes de integrar uma funcionalidade:

1. procure services existentes;
2. procure DTOs, interfaces e types;
3. procure chamadas semelhantes;
4. consulte documentação da API, quando disponível.

Quando o backend ainda não estiver implementado, mocks temporários devem:

* ser claramente identificados;
* ficar isolados;
* ser fáceis de substituir;
* não definir silenciosamente um contrato definitivo.

---

# Dependências

Evite adicionar novas dependências sem necessidade.

Antes de instalar uma biblioteca:

1. verifique se o projeto já possui solução equivalente;
2. verifique se a funcionalidade pode ser implementada com as dependências atuais;
3. avalie o custo de manutenção;
4. considere o impacto no bundle;
5. considere se a biblioteca cria um padrão paralelo.

Não adicione uma biblioteca inteira para resolver um problema simples.

---

# Bibliotecas de UI

O projeto possui Design System próprio.

Não introduza sem solicitação explícita:

* Angular Material;
* Bootstrap;
* PrimeNG;
* shadcn/ui;
* DaisyUI;
* Flowbite;
* outro Design System completo.

Bibliotecas externas podem servir como referência conceitual, mas não devem substituir a identidade visual existente.

---

# Alterações visuais

Para qualquer alteração visual, consulte obrigatoriamente:

```text
docs/frontend-design-system.md
```

e o arquivo:

```text
app.css
```

O `app.css` é a fonte de verdade da implementação do Design System.

Não recrie manualmente estilos que já possuam uma classe semântica disponível.

---

# Tailwind CSS

O projeto utiliza Tailwind CSS 4.

Como regra geral:

* o Design System define a aparência;
* Tailwind auxilia na composição e no layout.

Utilize Tailwind principalmente para:

* flexbox;
* grid;
* alinhamento;
* posicionamento;
* largura;
* altura;
* espaçamento;
* responsividade;
* visibilidade;
* ordem de elementos.

Não use uma longa sequência de utilitários para reconstruir visualmente um componente que já existe no `app.css`.

---

# Formulários

Ao implementar formulários:

* reutilize componentes existentes;
* siga a nomenclatura do domínio;
* preserve acessibilidade;
* apresente erros próximos aos campos;
* não use placeholder como único label;
* mantenha organização coerente das informações;
* evite quebrar fluxos simples em etapas desnecessárias.

Consulte o Design System antes de criar novos estilos de campos.

---

# Estados de interface

Quando aplicável, telas dependentes de dados devem considerar:

* carregamento;
* erro;
* ausência de registros;
* sucesso;
* estados desabilitados;
* permissões ou indisponibilidade.

Não deixe áreas simplesmente vazias quando a ausência de dados precisa ser comunicada ao usuário.

---

# Acessibilidade

Acessibilidade não é opcional.

Ao implementar interfaces:

* utilize HTML semântico;
* preserve navegação por teclado;
* associe labels aos campos;
* forneça foco visível;
* não dependa somente de cor para comunicar estados;
* use atributos ARIA quando necessários;
* não utilize roles ARIA apenas para simular comportamento que não foi implementado.

---

# Responsividade

Novas telas devem funcionar em diferentes larguras de viewport.

O uso principal pode ser desktop, mas interfaces não devem quebrar em telas menores.

Prefira abordagens mobile-first.

Evite:

* larguras rígidas;
* overflow horizontal não controlado;
* dialogs maiores que a viewport;
* grids sem adaptação;
* valores fixos quando uma limitação responsiva resolver melhor.

---

# Nomenclatura

Utilize português brasileiro na interface apresentada ao usuário.

No código, siga as convenções já existentes no projeto.

Não traduza arbitrariamente nomes de conceitos do domínio se já houver nomenclatura estabelecida.

Exemplos de conceitos:

* Atendimento farmacêutico
* Acompanhamento
* Medicamento
* Comorbidade
* Interação
* Paciente

---

# Comentários

Não adicione comentários explicando código trivial.

Comentários devem ser utilizados principalmente quando houver:

* decisão arquitetural não óbvia;
* comportamento complexo;
* workaround;
* limitação externa;
* regra de negócio cuja intenção não esteja evidente no código.

Prefira código autoexplicativo.

---

# Testes e validação

Ao alterar comportamento existente:

* preserve testes atuais;
* atualize testes afetados;
* adicione testes quando a lógica justificar;
* não remova testes apenas para fazer a implementação passar.

Antes de considerar a tarefa concluída, valide quando aplicável:

* compilação;
* lint;
* testes;
* comportamento da tela;
* tipos;
* console do navegador.

---

# Ao criar uma nova tela

Antes de implementar uma nova tela:

1. identifique seu objetivo;
2. consulte `docs/domain.md`;
3. consulte os requisitos relacionados;
4. procure telas semelhantes;
5. procure componentes existentes;
6. consulte `app.css`;
7. consulte `docs/frontend-design-system.md`;
8. identifique os estados necessários;
9. implemente a solução utilizando os padrões existentes.

Após implementar, revise:

* regra de negócio;
* nomenclatura;
* consistência visual;
* responsividade;
* acessibilidade;
* validações;
* estado de carregamento;
* estado de erro;
* estado vazio;
* reutilização;
* escopo da alteração.

---

# Ao criar uma nova abstração

Uma nova abstração deve resolver um problema real.

Evite abstrações criadas apenas porque "podem ser úteis no futuro".

Antes de criar:

* componente genérico;
* service base;
* helper;
* directive;
* pipe;
* classe CSS semântica;
* nova camada arquitetural;

verifique se existem múltiplos usos reais ou uma responsabilidade clara que justifique a abstração.

---

# Prioridade em caso de conflito

Quando regras entrarem em conflito, considere nesta ordem:

1. segurança e integridade dos dados;
2. acessibilidade;
3. requisitos funcionais documentados;
4. regras do domínio;
5. arquitetura existente;
6. Design System;
7. componentes existentes;
8. consistência com telas existentes;
9. simplicidade;
10. preferência estética.

---

# Princípio final

O objetivo não é produzir a solução mais sofisticada possível.

O objetivo é produzir uma solução:

* correta;
* simples;
* coerente;
* reutilizável;
* acessível;
* fácil de manter;
* integrada ao restante do projeto.

Preserve o projeto em vez de reinventá-lo a cada tarefa.
