# Frontend Design System

## Objetivo

Este documento define as regras para construção e manutenção da interface da aplicação.

A fonte de verdade da implementação visual é o arquivo:

```text
app.css
```

Estas regras complementam o `AGENTS.md`.

Antes de criar ou alterar qualquer interface, consulte o `app.css`.

---

# Regra principal

O arquivo `app.css` define o Design System da aplicação.

Ao criar, alterar ou revisar qualquer tela, componente ou fluxo:

1. reutilize primeiro as classes semânticas existentes;
2. não recrie manualmente estilos que já existam no Design System;
3. preserve a identidade visual atual;
4. use Tailwind principalmente para layout e composição;
5. somente estenda o Design System quando houver necessidade real.

---

# Separação entre aparência e layout

Como regra geral:

> classes semânticas do Design System → aparência

> Tailwind → layout e composição

Exemplo correto:

```html
<div class="card w-full max-w-2xl mx-auto">
```

Neste exemplo:

```text
card
```

define a aparência do componente.

Enquanto:

```text
w-full max-w-2xl mx-auto
```

define seu posicionamento e dimensionamento.

---

# Exemplo a evitar

Evite reconstruir manualmente um componente existente:

```html
<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
```

Se o Design System já oferece:

```html
<div class="card">
```

utilize `card`.

---

# Identidade visual

A aplicação deve manter aparência:

* sóbria;
* moderna;
* institucional;
* limpa;
* arredondada;
* consistente;
* adequada ao contexto de saúde.

Cores principais atualmente utilizadas:

* Fundo da aplicação: `#fafafa`
* Cor institucional principal: `#7f384a`
* Cor escura institucional: `#333333`

Esses valores existem como referência da identidade atual.

Sempre prefira os tokens e classes definidos no `app.css` em vez de repetir valores hexadecimais diretamente.

---

# Uso da cor institucional

A cor institucional deve funcionar principalmente como elemento de:

* identidade;
* destaque;
* hierarquia;
* ação principal;
* estado ativo;
* elementos selecionados.

Evite utilizar a cor institucional em grandes superfícies sem necessidade.

A aplicação não deve parecer saturada pela cor principal.

---

# Evite

Evite introduzir:

* cores muito saturadas;
* gradientes chamativos;
* sombras pesadas;
* bordas excessivamente grossas;
* arredondamentos inconsistentes;
* efeitos visuais decorativos sem função;
* excesso de cores;
* excesso de contraste visual;
* estilos que destoem do restante da aplicação.

---

# Classes semânticas existentes

Antes de escrever estilos novos, consulte o `app.css`.

O Design System possui classes semânticas como, entre outras:

### Estrutura

* `app-shell`
* `app-navbar`
* `app-footer`
* `app-container`

### Cards

* `card`
* `card-header`
* `card-title`
* `card-description`
* `card-content`
* `card-footer`

### Buttons

* `btn`
* `btn-primary`
* `btn-secondary`
* `btn-outline`
* `btn-ghost`
* `btn-danger`
* `btn-link`

### Form fields

* `field`
* `label`
* `label-required`
* `field-description`
* `field-error`
* `input`
* `textarea`
* `native-select`
* `select-trigger`
* `checkbox`
* `radio-group`
* `switch`

### Feedback

* `alert`
* `badge`
* `skeleton`
* `spinner`
* `toast`

### Data

* `table-wrapper`
* `table`

### Overlays

* `dialog`
* `alert-dialog`
* `sheet`
* `drawer`
* `dropdown-menu`
* `popover`

### Navigation

* `tabs-list`
* `tabs-trigger`
* `sidebar`

Esta lista não deve ser considerada completa.

**O ****`app.css`**** é a referência definitiva.**

---

# Tailwind CSS

O projeto utiliza Tailwind CSS 4.

Tailwind pode e deve ser combinado com as classes semânticas.

Utilize Tailwind principalmente para:

* `flex`;
* `grid`;
* `gap`;
* largura;
* altura;
* `max-width`;
* margens;
* padding de composição quando apropriado;
* alinhamento;
* posicionamento;
* responsividade;
* visibilidade;
* ordem de elementos.

---

# Exemplo

```html
<section class="card w-full max-w-4xl mx-auto">
  <div class="card-header">
    <h2 class="card-title">
      Dados do atendimento
    </h2>
  </div>

  <div class="card-content grid grid-cols-1 gap-4 md:grid-cols-2">
    ...
  </div>
</section>
```

O componente mantém sua identidade através das classes:

```text
card
card-header
card-title
card-content
```

e utiliza Tailwind para definir seu layout.

---

# Valores arbitrários do Tailwind

Evite valores arbitrários quando houver token ou utilitário adequado.

Prefira:

```html
max-w-2xl
gap-4
p-6
```

em vez de:

```html
max-w-[713px]
gap-[17px]
p-[23px]
```

Valores arbitrários são aceitáveis quando houver uma necessidade específica e justificada.

---

# Componentes novos

Antes de criar um novo componente visual:

1. verifique o `app.css`;
2. procure um componente existente;
3. considere composição;
4. verifique telas semelhantes;
5. crie algo novo apenas quando os padrões existentes não forem suficientes.

---

# Composição

Prefira composição a criação de variantes isoladas.

Por exemplo, um card centralizado não precisa de uma nova classe:

```css
.centered-card
```

se puder ser expresso como:

```html
<div class="card w-full max-w-2xl mx-auto">
```

O Design System define o componente.

Tailwind define sua posição naquele contexto.

---

# Novas classes semânticas

Quando uma abstração visual realmente não existir, prefira criar uma classe semântica reutilizável no `app.css`.

Antes de criar uma nova classe, o agente deve verificar se o problema pode ser resolvido utilizando:

* componente existente;
* variante existente;
* composição;
* Tailwind para layout.

Se uma nova classe for necessária, explique brevemente na resposta final por que as abstrações existentes não eram suficientes.

---

# Regras para novas classes

Novas classes devem:

* possuir responsabilidade visual clara;
* utilizar tokens existentes;
* manter nomenclatura em inglês;
* ser reutilizáveis;
* seguir os padrões existentes;
* evitar duplicação;
* preservar compatibilidade.

Evite nomes excessivamente específicos da tela:

```css
.patient-create-page-special-card
```

Prefira abstrações reutilizáveis quando realmente houver um padrão:

```css
.stat-card
```

---

# Alterações no app.css

Não altere `app.css` apenas para facilitar uma única tela.

Uma alteração é aceitável quando:

* um componente semântico realmente não existe;
* um padrão aparece repetidamente;
* existe problema de acessibilidade;
* existe inconsistência no próprio Design System;
* a alteração foi solicitada explicitamente.

Ao modificar o arquivo:

* reutilize tokens existentes;
* preserve classes atuais;
* evite breaking changes;
* evite duplicação;
* documente componentes novos quando necessário;
* não altere a identidade visual sem solicitação.

---

# Componentes Angular

O `app.css` define principalmente a apresentação.

O componente Angular deve controlar comportamentos como:

* estado aberto/fechado;
* seleção;
* foco;
* teclado;
* validação;
* eventos;
* integração com forms;
* posicionamento dinâmico;
* acessibilidade.

Não tente implementar comportamento complexo apenas com CSS quando ele pertence ao componente.

---

# Estados

Quando os componentes utilizarem estados, preserve os atributos esperados pelo CSS.

Exemplos:

```html
data-state="open"
data-state="closed"
data-state="checked"
data-state="unchecked"
data-state="active"
data-state="inactive"
```

ou atributos ARIA:

```html
aria-selected="true"
aria-current="page"
aria-invalid="true"
aria-disabled="true"
```

Utilize cada atributo conforme a semântica correta do componente.

---

# Acessibilidade

Toda nova interface deve:

* utilizar HTML semântico;
* associar `label` e `input`;
* possuir foco visível;
* permitir navegação por teclado;
* possuir contraste adequado;
* apresentar erros textualmente;
* respeitar `disabled`;
* utilizar `aria-label` para botões somente com ícone;
* não usar placeholder como único rótulo.

---

# ARIA

Use ARIA quando necessário, não como substituição para HTML adequado.

Exemplo:

Prefira:

```html
<button type="button">
```

em vez de:

```html
<div role="button">
```

quando um botão real puder ser utilizado.

Componentes como:

* dialog;
* tabs;
* menu;
* combobox;
* listbox;

devem implementar os comportamentos de teclado e foco compatíveis com suas respectivas semânticas.

---

# Formulários

Estrutura recomendada:

```html
<div class="field">
  <label for="paciente" class="label label-required">
    Paciente
  </label>

  <input
    id="paciente"
    class="input"
    type="text"
    placeholder="Digite o nome do paciente"
  />

  <p class="field-description">
    Pesquise pelo nome ou documento.
  </p>
</div>
```

---

# Erros de formulário

Quando um campo estiver inválido:

```html
<div class="field">
  <label for="cpf" class="label label-required">
    CPF
  </label>

  <input
    id="cpf"
    class="input"
    aria-invalid="true"
  />

  <p class="field-error">
    Informe um CPF válido.
  </p>
</div>
```

O erro deve permanecer próximo do campo relacionado.

---

# Campos obrigatórios

Utilize a convenção já existente do Design System.

Por exemplo:

```html
<label class="label label-required">
  Nome
</label>
```

Não crie novas formas visuais para campos obrigatórios em diferentes telas.

---

# Botões

Utilize as variantes de acordo com a importância da ação.

### Ação principal

```html
<button class="btn btn-primary">
  Salvar atendimento
</button>
```

### Ação alternativa

```html
<button class="btn btn-secondary">
  Cancelar
</button>
```

ou:

```html
<button class="btn btn-outline">
  Voltar
</button>
```

### Ação discreta

```html
<button class="btn btn-ghost">
  Ver detalhes
</button>
```

### Ação destrutiva

```html
<button class="btn btn-danger">
  Excluir
</button>
```

### Aparência de link

```html
<button class="btn btn-link">
  Visualizar histórico
</button>
```

---

# Hierarquia das ações

Evite múltiplos botões primários competindo dentro do mesmo contexto.

Exemplo recomendado:

```html
<div class="flex justify-end gap-3">
  <button
    type="button"
    class="btn btn-secondary"
  >
    Cancelar
  </button>

  <button
    type="submit"
    class="btn btn-primary"
  >
    Salvar atendimento
  </button>
</div>
```

A interface deve deixar claro qual é a ação principal.

---

# Cards

Cards devem organizar informações relacionadas.

Não utilize cards apenas como decoração.

A largura deve ser determinada pelo contexto.

Exemplo:

```html
<section class="card w-full max-w-2xl mx-auto">
```

é adequado para um formulário relativamente pequeno.

Para layouts maiores:

```html
<section class="card w-full">
```

pode ser mais apropriado.

Não existe regra de que todo card deve ocupar a tela inteira.

---

# Layout de páginas

Utilize largura proporcional ao conteúdo.

Exemplos:

* formulários pequenos → containers estreitos;
* formulários extensos → largura intermediária;
* tabelas → maior largura disponível;
* dashboards → grids amplos;
* dialogs → largura compatível com o conteúdo.

Evite telas artificialmente largas apenas porque há espaço disponível.

---

# Responsividade

Utilize abordagem mobile-first.

Exemplo:

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
```

Prefira:

```html
w-full max-w-2xl
```

em vez de:

```html
w-[700px]
```

Não utilize larguras fixas que causem overflow em telas menores.

---

# Tabelas

Utilize os componentes existentes:

```html
<div class="table-wrapper">
  <table class="table">
    ...
  </table>
</div>
```

Quando necessário, utilize Tailwind para controlar:

* largura de colunas;
* alinhamento;
* visibilidade responsiva;
* composição externa.

Evite criar um estilo de tabela diferente para cada página.

---

# Ações em tabelas

Quando houver poucas ações importantes, elas podem aparecer diretamente.

Quando houver muitas ações secundárias, considere um dropdown.

Evite poluir cada linha com vários botões de mesma importância visual.

---

# Estados vazios

Uma listagem vazia deve explicar a situação.

Prefira mensagens como:

```text
Nenhum atendimento encontrado.
```

ou:

```text
Nenhum medicamento cadastrado.
```

Quando fizer sentido, apresente uma ação contextual:

```text
Cadastrar medicamento
```

Não apresente uma tabela simplesmente vazia sem explicação.

---

# Loading

Utilize componentes existentes como:

* `skeleton`;
* `spinner`.

Escolha conforme o contexto.

Evite criar novos indicadores de carregamento sem necessidade.

---

# Alerts

Alerts devem comunicar informações relevantes.

Evite utilizar alertas para qualquer texto secundário da página.

Em especial, alertas relacionados a interações do domínio devem ser perceptíveis, mas não visualmente alarmistas sem justificativa.

---

# Dialogs

Dialogs devem ser utilizados para interações focadas.

Evite dialogs muito grandes para formulários complexos.

Quando o conteúdo exigir:

* muitas seções;
* navegação;
* muitos campos;
* leitura extensa;

considere uma tela dedicada ou outro padrão adequado.

Dialogs não devem ultrapassar a viewport.

---

# Consistência

Componentes equivalentes devem parecer e se comportar da mesma forma em toda a aplicação.

Um mesmo conceito não deve possuir:

* três estilos diferentes de botão;
* diferentes campos de texto;
* diferentes padrões de erro;
* diferentes dialogs;
* diferentes badges;

sem uma razão clara.

---

# Ícones

Quando o projeto utilizar ícones:

* reutilize a biblioteca já existente;
* mantenha tamanho coerente;
* não misture conjuntos de ícones sem necessidade;
* botões somente com ícone devem possuir nome acessível.

Exemplo:

```html
<button
  type="button"
  class="btn btn-ghost"
  aria-label="Excluir medicamento"
>
  ...
</button>
```

---

# Animações

Utilize animações de forma discreta.

Animações devem auxiliar:

* percepção de mudança de estado;
* abertura e fechamento;
* feedback;
* orientação espacial.

Evite:

* animações longas;
* efeitos decorativos;
* movimento excessivo;
* transições que atrasem o fluxo.

---

# Dependências de UI

Não adicione outra biblioteca visual apenas para obter um componente que pode ser construído com o Design System atual.

Em especial, não introduza automaticamente:

* Angular Material;
* Bootstrap;
* PrimeNG;
* DaisyUI;
* Flowbite;
* shadcn/ui.

O Design System pode possuir inspiração em bibliotecas externas, mas deve manter implementação e identidade próprias.

---

# Sobre shadcn/ui

O objetivo não é reproduzir shadcn/ui exatamente.

Componentes semelhantes podem existir e conceitos podem servir como referência.

Entretanto:

> shadcn/ui é uma referência de padrões, não a fonte de verdade visual.

A fonte de verdade continua sendo:

```text
app.css
```

---

# Critérios para geração de uma nova tela

Ao receber uma solicitação de nova tela:

1. leia `AGENTS.md`;
2. consulte `docs/domain.md`;
3. consulte requisitos relevantes;
4. consulte `app.css`;
5. procure componentes existentes;
6. procure telas semelhantes;
7. reutilize classes semânticas;
8. use Tailwind para composição;
9. preserve responsividade;
10. preserve acessibilidade;
11. evite nova dependência de UI;
12. somente altere `app.css` quando necessário.

---

# Checklist final de interface

Antes de concluir uma alteração visual, verifique:

* a tela utiliza classes existentes do Design System?
* existe CSS duplicado?
* Tailwind está sendo usado principalmente para layout?
* existe mais de uma ação primária competindo?
* labels estão associados aos campos?
* erros estão próximos dos respectivos campos?
* navegação por teclado funciona?
* foco é perceptível?
* a tela funciona em largura reduzida?
* dialogs cabem na viewport?
* estados vazios estão tratados?
* estados de loading estão tratados?
* a hierarquia visual está clara?
* a paleta institucional foi preservada?
* alguma nova classe poderia ter sido evitada por composição?

---

# Princípio final

Ao trabalhar na interface, siga:

> reutilizar identidade → compor layout → adicionar comportamento

Não siga:

> redesenhar identidade → recriar componentes → adaptar o restante da aplicação

O objetivo é evoluir uma única linguagem visual consistente ao longo de todo o sistema.
