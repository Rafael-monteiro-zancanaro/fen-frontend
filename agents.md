# AGENTS.md

## Contexto do projeto

Esta aplicação web faz parte de um TCC voltado ao registro e gerenciamento de atendimentos farmacêuticos da Farmácia-Ensino da UEM.

Stack principal:

- Angular
- Tailwind CSS 4
- Design system próprio definido no arquivo `app.css`

## Regra principal de interface

O arquivo `app.css` é a fonte de verdade para o design visual da aplicação.

Ao criar, alterar ou revisar qualquer tela, componente ou fluxo de interface:

1. Reutilize primeiro as classes semânticas já existentes no `app.css`.
2. Não recrie manualmente estilos que já estejam representados por uma classe do design system.
3. Não introduza uma nova linguagem visual sem necessidade.
4. Não substitua o design system por estilos inspirados diretamente em outras bibliotecas.
5. Use classes utilitárias do Tailwind principalmente para layout, responsividade, espaçamento e dimensionamento.

Exemplo correto:

```html
<div class="card w-full max-w-2xl mx-auto">
```

Neste exemplo:

- `card` define a aparência.
- `w-full`, `max-w-2xl` e `mx-auto` definem o layout.

Exemplo a evitar:

```html
<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
```

Esse código recria manualmente um componente que já deveria usar a classe `card`.

## Identidade visual

Preserve a identidade já definida no `app.css`.

Cores principais:

- Fundo da aplicação: `#fafafa`
- Cor institucional principal: `#7f384a`
- Cor escura institucional: `#333333`

A interface deve permanecer:

- Sóbria
- Moderna
- Institucional
- Limpa
- Arredondada
- Consistente
- Adequada a uma aplicação da área da saúde

Evite:

- Cores muito saturadas
- Gradientes chamativos
- Sombras pesadas
- Bordas excessivamente grossas
- Arredondamentos inconsistentes
- Estilos visuais que destoem do restante da aplicação
- Uso excessivo da cor institucional em grandes superfícies

## Uso das classes do design system

Antes de escrever novas classes CSS, verifique o `app.css`.

Use as classes semânticas existentes, incluindo, entre outras:

- `app-shell`
- `app-navbar`
- `app-footer`
- `app-container`
- `card`
- `card-header`
- `card-title`
- `card-description`
- `card-content`
- `card-footer`
- `btn`
- `btn-primary`
- `btn-secondary`
- `btn-outline`
- `btn-ghost`
- `btn-danger`
- `btn-link`
- `field`
- `label`
- `label-required`
- `field-description`
- `field-error`
- `input`
- `textarea`
- `native-select`
- `select-trigger`
- `checkbox`
- `radio-group`
- `switch`
- `alert`
- `badge`
- `table-wrapper`
- `table`
- `dialog`
- `alert-dialog`
- `sheet`
- `drawer`
- `dropdown-menu`
- `popover`
- `tabs-list`
- `tabs-trigger`
- `sidebar`
- `skeleton`
- `spinner`
- `toast`

Não presuma que esta lista é completa. Consulte o arquivo `app.css` antes de criar estilos adicionais.

## Tailwind CSS

As classes do Tailwind podem ser combinadas com as classes do design system.

Use Tailwind para:

- `flex` e `grid`
- Largura e altura
- Limites de largura
- Margens
- Espaçamentos
- Alinhamento
- Posicionamento
- Responsividade
- Visibilidade
- Ordem dos elementos

Exemplo:

```html
<section class="card w-full max-w-4xl mx-auto">
  <div class="card-header">
    <h2 class="card-title">Dados do atendimento</h2>
  </div>

  <div class="card-content grid grid-cols-1 gap-4 md:grid-cols-2">
    ...
  </div>
</section>
```

Evite usar utilitários do Tailwind para redefinir completamente a aparência de componentes já existentes.

## Novos componentes

Ao precisar de um componente que ainda não exista:

1. Verifique se ele pode ser montado por composição de componentes existentes.
2. Preserve os mesmos tokens de cor, borda, sombra, raio e espaçamento.
3. Prefira uma nova classe semântica no `app.css` em vez de repetir várias classes utilitárias em diferentes templates.
4. Não altere componentes existentes de forma que quebre telas já implementadas.
5. Mantenha nomes de classes em inglês e consistentes com os nomes existentes.
6. Não use estilos inline, salvo quando o valor for necessariamente dinâmico.

Antes de criar uma nova classe, explique brevemente por que as classes existentes não são suficientes.

## Componentes Angular

O `app.css` define principalmente a apresentação.

Os componentes Angular devem controlar:

- Estado aberto ou fechado
- Seleção
- Validação
- Navegação por teclado
- Foco
- Eventos
- Posicionamento dinâmico
- Acessibilidade
- Integração com formulários

Use atributos compatíveis com os estados previstos no CSS, como:

```html
data-state="open"
data-state="closed"
data-state="checked"
data-state="unchecked"
data-state="active"
data-state="inactive"
aria-selected="true"
aria-current="page"
aria-invalid="true"
aria-disabled="true"
```

## Acessibilidade

Toda interface nova deve:

- Usar HTML semântico
- Associar `label` e campo com `for` e `id`
- Não usar placeholder como único rótulo
- Ter foco visível
- Permitir navegação por teclado
- Usar `aria-label` em botões somente com ícone
- Informar erros de validação de maneira textual
- Manter contraste adequado
- Respeitar estados `disabled`
- Usar dialog, menu, tab e outros papéis ARIA apenas quando implementados corretamente

## Formulários

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

Para erros:

```html
<input
  id="cpf"
  class="input"
  aria-invalid="true"
/>

<p class="field-error">
  Informe um CPF válido.
</p>
```

## Botões e ações

Use:

- `btn-primary` para a ação principal
- `btn-secondary` ou `btn-outline` para ações alternativas
- `btn-ghost` para ações discretas
- `btn-danger` apenas para ações destrutivas
- `btn-link` para ações com aparência de link

Evite mais de uma ação primária no mesmo contexto.

Exemplo:

```html
<div class="flex justify-end gap-3">
  <button type="button" class="btn btn-secondary">
    Cancelar
  </button>

  <button type="submit" class="btn btn-primary">
    Salvar atendimento
  </button>
</div>
```

## Responsividade

Todas as telas devem funcionar em dispositivos móveis e desktop.

Prefira abordagens mobile-first:

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
```

Para componentes centralizados:

```html
<div class="card w-full max-w-2xl mx-auto">
```

Não use larguras fixas sem `max-w-full` ou uma alternativa responsiva.

## Critérios para geração de telas

Ao receber uma solicitação para criar uma nova tela:

1. Consulte o `app.css`.
2. Identifique os componentes semânticos já disponíveis.
3. Reutilize esses componentes.
4. Use Tailwind apenas para composição e layout.
5. Preserve a paleta institucional.
6. Mantenha hierarquia visual simples.
7. Evite adicionar novas dependências de UI.
8. Não use Angular Material, Bootstrap ou outra biblioteca visual sem solicitação explícita.
9. Não imite uma tela externa quando isso exigir abandonar o design system.
10. Entregue templates coerentes com as telas existentes.

## Alterações no app.css

Não altere o `app.css` sem necessidade.

Uma alteração é aceitável quando:

- Um componente semântico realmente não existe
- Há repetição de um mesmo padrão em várias telas
- Há um problema de acessibilidade
- Há inconsistência no próprio design system
- A alteração foi solicitada explicitamente

Ao alterar o arquivo:

- Reutilize os tokens existentes
- Preserve compatibilidade com classes já usadas
- Evite duplicação
- Documente classes novas
- Não mude a paleta principal sem solicitação explícita

## Prioridade em caso de conflito

Quando houver conflito entre uma sugestão visual e o design system existente, siga esta ordem:

1. Acessibilidade
2. Requisitos funcionais
3. Classes e padrões existentes no `app.css`
4. Consistência com telas já implementadas
5. Preferências estéticas pontuais

O objetivo não é reproduzir o shadcn/ui exatamente. O objetivo é manter o design system próprio da aplicação, que apenas possui inspiração visual semelhante.
