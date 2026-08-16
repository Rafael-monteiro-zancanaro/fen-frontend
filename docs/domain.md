# Domínio da aplicação

## Objetivo deste documento

Este documento descreve o contexto de negócio da aplicação da **Farmácia Ensino da Universidade Estadual de Maringá — FEN/UEM**.

Ele deve ser utilizado como referência conceitual ao implementar:

* funcionalidades;
* telas;
* formulários;
* filtros;
* validações;
* modelos;
* nomenclatura;
* fluxos relacionados ao domínio.

Este documento complementa os requisitos formais do projeto.

Quando houver conflito entre este documento e um requisito formal mais específico, o requisito formal tem prioridade.

---

# Contexto

A Farmácia Ensino realiza serviços e atendimentos farmacêuticos.

Parte das informações desses atendimentos pode ser registrada manualmente, dificultando:

* localização de registros anteriores;
* acompanhamento do histórico;
* consulta rápida;
* acompanhamento de retornos;
* geração de informações consolidadas.

A aplicação busca digitalizar e organizar esse processo.

---

# Objetivos principais

O sistema deve auxiliar no:

* registro de atendimentos farmacêuticos;
* armazenamento das informações coletadas;
* consulta de atendimentos anteriores;
* acompanhamento de pacientes;
* controle de retornos;
* identificação de atendimentos em andamento;
* identificação de atendimentos finalizados;
* obtenção de estatísticas simples sobre os registros.

---

# Usuário principal

O principal usuário da aplicação é o profissional responsável pelos atendimentos realizados na Farmácia Ensino.

A aplicação deve auxiliar o profissional na execução e documentação do atendimento.

O sistema não deve assumir automaticamente decisões clínicas que são responsabilidade do profissional.

---

# Paciente

O paciente representa a pessoa atendida pela Farmácia Ensino.

O cadastro do paciente pode ser utilizado para relacionar diferentes atendimentos realizados ao longo do tempo.

Isso permite consultar o histórico existente quando necessário.

Ao implementar interfaces relacionadas a pacientes, considere a possibilidade de acessar:

* dados cadastrais;
* atendimentos anteriores;
* acompanhamentos relacionados;
* informações relevantes registradas durante os atendimentos.

Os campos definitivos do cadastro devem seguir os requisitos formais.

---

# Atendimento farmacêutico

O atendimento farmacêutico é um dos elementos centrais do sistema.

Um atendimento representa um serviço realizado e as informações coletadas durante sua execução.

O sistema deve permitir que esses registros sejam consultados posteriormente.

Uma interface de atendimento deve priorizar:

* clareza;
* rapidez de preenchimento;
* boa organização;
* identificação do paciente;
* informações relevantes ao serviço realizado;
* alertas importantes;
* continuidade do atendimento quando houver acompanhamento.

---

# Situação do atendimento

Atendimentos podem possuir diferentes situações conforme o fluxo definido nos requisitos.

Conceitualmente, o sistema precisa distinguir ao menos situações equivalentes a:

* em andamento;
* finalizado.

Não crie novos estados definitivos apenas para facilitar a interface.

Os estados oficiais devem seguir o modelo e os requisitos do sistema.

---

# Serviços farmacêuticos

A Farmácia Ensino realiza diferentes serviços farmacêuticos.

Os serviços e seus respectivos campos devem ser definidos pelos requisitos e pelos formulários utilizados como referência pela FEN.

A aplicação não deve assumir que todos os tipos de atendimento possuem exatamente os mesmos dados.

Quando necessário, a interface pode adaptar campos conforme o serviço realizado, desde que isso corresponda aos requisitos.

---

# Medicamentos

O sistema possui cadastro de medicamentos.

O objetivo desse cadastro é permitir que medicamentos sejam utilizados em funcionalidades do domínio, principalmente:

* associação a atendimentos;
* registro de aplicações;
* identificação de interações;
* outras associações previstas pelos requisitos.

## Fora do escopo

O cadastro de medicamentos **não representa um estoque**.

Não fazem parte do escopo atual, salvo requisito futuro explícito:

* quantidade disponível;
* inventário;
* entrada em estoque;
* saída de estoque;
* movimentação;
* fornecedores;
* compras;
* vendas;
* controle financeiro;
* reposição;
* gestão logística.

Não transforme o cadastro de medicamentos em um módulo de gestão de estoque.

---

# Comorbidades

O sistema possui cadastro de comorbidades.

Uma comorbidade representa uma condição relevante que pode ser utilizada no contexto dos atendimentos e na identificação de interações.

Comorbidades podem estar relacionadas a pacientes conforme definido pelos requisitos.

Não invente classificações ou níveis de severidade sem que exista requisito para isso.

---

# Interações

O sistema possui cadastro de interações.

Uma interação representa uma situação em que determinado medicamento pode exigir atenção quando associado a determinada condição ou comorbidade.

Exemplo conceitual:

> Um medicamento ou apresentação contendo quantidade relevante de açúcar pode exigir atenção quando utilizado por uma pessoa com diabetes.

O exemplo ilustra o conceito e não deve ser tratado como regra clínica definitiva por si só.

As interações efetivamente cadastradas no sistema devem determinar quais alertas serão apresentados.

---

# Alertas de interação

Durante um atendimento, caso exista uma interação aplicável, a interface deve alertar o profissional.

O alerta deve, quando possível:

* indicar o medicamento envolvido;
* indicar a comorbidade ou condição relacionada;
* explicar a interação cadastrada;
* ser visualmente perceptível;
* evitar linguagem alarmista;
* não impedir automaticamente o atendimento sem requisito específico.

O objetivo é fornecer informação para auxiliar o profissional.

## Regra importante

O sistema não deve substituir julgamento clínico.

Evite comportamentos como:

* escolher automaticamente outro medicamento;
* cancelar automaticamente um procedimento;
* declarar que determinada administração é proibida;
* fornecer diagnóstico;
* determinar conduta clínica;

salvo se houver requisito explícito para tal comportamento.

---

# Acompanhamento

Alguns atendimentos podem exigir acompanhamento posterior.

O acompanhamento representa a continuidade de um atendimento ao longo do tempo.

Isso pode ocorrer, por exemplo, quando determinado procedimento exige retornos.

---

# Retornos

Um acompanhamento pode possuir múltiplos retornos.

Exemplo conceitual:

* atendimento inicial;
* retorno após 7 dias;
* segundo retorno após mais 7 dias;
* terceiro retorno após mais 7 dias.

Esse exemplo serve apenas para ilustrar a funcionalidade.

O sistema não deve assumir que:

* sempre são 3 retornos;
* o intervalo é sempre de 7 dias;
* todos os serviços possuem retorno.

Esses valores devem ser determinados pelos dados e regras aplicáveis.

---

# Informações de acompanhamento

Dependendo dos requisitos, uma interface de acompanhamento pode precisar apresentar:

* atendimento de origem;
* paciente;
* serviço realizado;
* quantidade de retornos previstos;
* intervalo entre retornos;
* próximos retornos;
* retornos realizados;
* retornos pendentes;
* situação atual do acompanhamento.

Evite duplicar dados do atendimento quando uma associação resolver adequadamente o problema.

---

# Atendimento e acompanhamento

Um acompanhamento deve possuir relação clara com o atendimento que o originou.

Ao navegar entre essas informações, o usuário deve conseguir compreender:

* qual atendimento originou o acompanhamento;
* quais retornos já ocorreram;
* quais ainda estão previstos.

Não modele acompanhamento como um registro completamente independente se os requisitos determinarem vínculo com atendimento.

---

# Estatísticas

A aplicação poderá apresentar estatísticas simples derivadas dos registros existentes.

Exemplos:

* quantidade de atendimentos;
* quantidade de acompanhamentos;
* atendimentos em andamento;
* atendimentos finalizados.

As estatísticas devem ser derivadas dos dados do sistema.

Não invente métricas sem utilidade ou fundamento nos requisitos.

Evite introduzir conceitos de:

* produtividade;
* desempenho individual;
* ranking de profissionais;
* metas;
* indicadores financeiros;

se não estiverem explicitamente previstos.

---

# Dashboard

O dashboard deve funcionar principalmente como visão resumida do sistema.

Ele pode apresentar:

* indicadores simples;
* situação geral dos atendimentos;
* acompanhamentos relevantes;
* atalhos para atividades frequentes.

O dashboard não deve se tornar uma ferramenta de business intelligence complexa sem necessidade.

---

# Histórico

Uma das finalidades da aplicação é facilitar a consulta de registros anteriores.

Ao desenvolver mecanismos de histórico, priorize:

* identificação do paciente;
* data do atendimento;
* tipo de serviço;
* situação;
* facilidade de localizar registros anteriores.

Filtros adicionais devem ser adicionados quando houver utilidade real.

---

# Formulários utilizados pela FEN

Formulários atualmente utilizados pela Farmácia Ensino podem ser utilizados como referência para compreender o processo existente.

Esses documentos ajudam a identificar:

* informações coletadas;
* nomenclatura utilizada;
* agrupamento dos campos;
* sequência natural do atendimento;
* informações obrigatórias.

## Importante

A aplicação digital não precisa reproduzir o formulário físico visualmente.

O formulário em papel representa principalmente:

> informações + regras + fluxo atual

A interface digital pode melhorar:

* organização;
* agrupamento;
* navegação;
* preenchimento;
* validação;
* reutilização de informações.

---

# Nomenclatura

Na interface, utilize termos em português brasileiro e preserve a nomenclatura utilizada nos requisitos.

Conceitos principais incluem:

* Paciente
* Atendimento farmacêutico
* Acompanhamento
* Retorno
* Medicamento
* Comorbidade
* Interação
* Serviço farmacêutico

Evite substituir esses termos por sinônimos apenas por preferência.

---

# Não inventar regras clínicas

Este projeto envolve informações da área da saúde.

O agente deve ter cuidado especial para não transformar inferências em regras clínicas.

Não invente:

* contraindicações;
* dosagens;
* diagnósticos;
* intervalos de administração;
* riscos;
* classificações;
* protocolos;
* procedimentos clínicos.

Essas informações somente devem ser implementadas quando vierem dos requisitos, dos dados cadastrados ou de fontes explicitamente adotadas pelo projeto.

---

# Regras derivadas de dados

Sempre que possível, comportamentos devem ser derivados dos dados cadastrados.

Exemplo:

Em vez de codificar:

```text
Se medicamento = X e paciente = diabético, mostrar alerta.
```

prefira uma regra equivalente a:

```text
Se existir uma interação cadastrada entre o medicamento selecionado e
uma comorbidade associada ao paciente, mostrar a interação cadastrada.
```

Isso mantém a aplicação orientada ao domínio e evita regras fixas espalhadas pelo frontend.

---

# Princípios do domínio

Ao implementar funcionalidades, considere:

1. o atendimento é o núcleo do sistema;
2. pacientes podem possuir histórico;
3. medicamentos são referências de domínio, não estoque;
4. comorbidades podem participar de interações;
5. interações geram alertas informativos;
6. acompanhamentos representam continuidade de atendimentos;
7. retornos não possuem quantidade ou intervalo universal;
8. estatísticas devem ser simples e derivadas dos dados;
9. decisões clínicas permanecem sob responsabilidade do profissional;
10. requisitos formais têm prioridade sobre suposições.
