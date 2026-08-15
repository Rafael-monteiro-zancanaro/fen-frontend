# Medicamentos e Comorbidades Design

## Contexto

O projeto e um frontend Angular standalone com rotas em `src/app/app.routes.ts`, paginas em `src/app/pages/*` e Design System centralizado em `src/styles.css`.

Nao existem contratos HTTP, DTOs ou services de dominio para medicamentos e comorbidades. Por isso, a implementacao inicial deve usar uma camada temporaria e isolada de dados no frontend, sem definir endpoints definitivos.

## Objetivo

Implementar fluxos funcionais para cadastro, listagem, busca, visualizacao e exclusao de medicamentos e comorbidades.

## Arquitetura

Criar tipos e um service temporario para armazenar medicamentos e comorbidades no frontend. O service deve expor operacoes simples de listagem, busca, obtencao por id, criacao e exclusao.

As telas devem ser componentes standalone em `src/app/pages`, seguindo o padrao existente do projeto. A navegacao deve ser integrada ao header atual e as rotas existentes, sem criar estrutura paralela.

## Dados Temporarios

Como nao ha backend documentado para estes modulos, os dados devem ficar em um service claramente nomeado como temporario. A persistencia pode usar `localStorage` para manter os fluxos funcionais entre recarregamentos durante a demonstracao.

Essa camada nao define contrato de API. Quando o backend existir, o service deve ser o ponto natural de substituicao.

## Medicamentos

O cadastro de medicamento deve conter:

- nome obrigatorio;
- unidade de medida obrigatoria, como texto livre;
- via de administracao obrigatoria, como texto livre.

A listagem deve permitir:

- visualizar medicamentos;
- pesquisar por nome, unidade ou via;
- acessar novo cadastro;
- acessar visualizacao;
- excluir com confirmacao;
- exibir estado vazio quando nao houver registros;
- exibir ausencia de resultados quando a busca nao encontrar correspondencias.

A visualizacao deve apresentar nome, unidade de medida e via de administracao como consulta, nao como formulario.

## Comorbidades

O cadastro de comorbidade deve conter:

- nome obrigatorio;
- lista opcional de interacoes com medicamentos.

A interface de interacoes deve permitir pesquisar medicamentos cadastrados, selecionar um resultado, adicionar a lista da comorbidade, visualizar selecionados, remover antes de salvar e adicionar multiplos medicamentos.

O mesmo medicamento nao pode ser adicionado mais de uma vez a mesma comorbidade.

A listagem deve permitir:

- visualizar comorbidades;
- pesquisar por nome;
- acessar novo cadastro;
- acessar visualizacao;
- excluir com confirmacao;
- exibir estado vazio quando nao houver registros;
- exibir ausencia de resultados quando a busca nao encontrar correspondencias.

A visualizacao deve apresentar nome e medicamentos associados como interacoes cadastradas, sem transformar os dados em campos editaveis.

## Interface

Usar as classes semanticas existentes em `src/styles.css`, incluindo `card`, `btn`, `input`, `field`, `table-wrapper`, `table`, `empty`, `alert`, `badge` e `alert-dialog`.

Manter responsividade com Tailwind apenas para layout e composicao, preservando a identidade visual do projeto.

## Testes

Adicionar testes antes da implementacao para verificar:

- rotas e navegacao interna dos novos modulos;
- listagem, estado vazio e busca;
- validacao minima dos formularios;
- cadastro de medicamento;
- cadastro de comorbidade com multiplas interacoes;
- bloqueio de interacao duplicada;
- visualizacoes de medicamento e comorbidade;
- exclusao com confirmacao.

## Fora do Escopo

Nao implementar edicao, estoque, inventario, endpoints HTTP definitivos, classificacoes clinicas, niveis de severidade ou regras adicionais nao documentadas.
