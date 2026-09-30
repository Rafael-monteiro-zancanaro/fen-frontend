# Deploy do frontend na Vercel e integração com Render

Este projeto é uma SPA Angular. O build de produção usa a API pública já
implantada no Render:

```text
https://fen-backend.onrender.com
```

Não há segredos de backend no frontend. Não configure na Vercel `JWT_SECRET`,
credenciais do Neon, nem variáveis do Render.

## Configuração da API

As URLs da API têm uma única fonte de verdade:

| Build | Arquivo | `apiUrl` |
| --- | --- | --- |
| desenvolvimento (`ng serve`) | `src/environments/environment.ts` | `http://localhost:8080` |
| produção (`yarn build`) | `src/environments/environment.production.ts` | `https://fen-backend.onrender.com` |

O `angular.json` substitui o arquivo de environment durante o build de
produção. Os services de autenticação, pacientes, funcionários, dashboard,
serviços farmacêuticos e anexos usam essa configuração centralizada.

A URL do backend é pública e foi mantida no environment de produção; portanto,
nenhuma variável de ambiente da Vercel é necessária para a API. Essa opção
evita tentar acessar `process.env` no navegador e não adiciona configuração de
runtime desnecessária.

O interceptor acrescenta `Authorization: Bearer <token>` somente às requests
cuja URL pertence a `apiUrl`. A integração com ViaCEP continua sendo uma
request externa direta e não recebe o token.

## Arquivos de deploy

`vercel.json` contém somente o rewrite de SPA para `index.html`. Ele permite
abrir ou atualizar diretamente rotas como `/atendimentos/<uuid>` e
`/pacientes`, sem transformar a Vercel em proxy da API.

O projeto não utiliza `.env` para o frontend. Por isso não há `.env.example`
nem variáveis de build para cadastrar; manter esse tipo de arquivo não traria
configuração útil e poderia induzir o uso incorreto de segredos no bundle.

## Criar o projeto na Vercel

1. Importe o repositório GitHub na Vercel.
2. Se o repositório contiver os diretórios `fen/` e `fen-frontend/`, selecione
   **Root Directory: `fen-frontend`**. Se o repositório remoto for apenas o
   frontend (como o repositório atual), deixe o Root Directory vazio.
3. Confirme o **Framework Preset: Angular**.
4. Mantenha os comandos detectados automaticamente pelo preset:
   - **Install Command:** padrão do Yarn; o projeto usa Yarn `1.22.22` e possui
     `yarn.lock`.
   - **Build Command:** `yarn build` (equivale a `ng build`).
   - **Output Directory:** não sobrescrever; o preset deve detectá-lo. O build
     local atual produz os arquivos estáticos em `dist/fen-frontend/browser`.
5. Use uma versão de Node compatível com Angular 22. A recomendação é Node
   `24.15.0` ou mais recente dentro da linha 24; o projeto foi validado com
   Node `24.18.0`.
6. Não é necessário cadastrar Environment Variables para este primeiro deploy.
   Caso a Vercel mostre variáveis herdadas, não inclua segredos do backend.
7. Faça o deploy pelo painel quando estiver pronto.

O build é estático e não chama a API do Render durante a compilação.

## CORS: etapa obrigatória após o primeiro deploy

A URL estável da Vercel só é conhecida depois do primeiro deploy. Portanto, é
normal que o site abra inicialmente, mas que chamadas ao backend sejam
bloqueadas por CORS até esta etapa.

Depois que a Vercel fornecer a URL de produção, por exemplo
`https://fen-frontend.vercel.app`:

1. Abra o serviço do backend no Render.
2. Em **Environment**, atualize `FEN_CORS_ALLOWED_ORIGINS` com uma lista
   separada por vírgulas, por exemplo:

   ```text
   http://localhost:4200,https://fen-frontend.vercel.app
   ```

3. Salve a variável e aguarde/requisite o redeploy do backend, conforme o
   painel do Render indicar.
4. Recarregue o site da Vercel e teste o login.

Preview Deployments usam domínios diferentes. Eles não terão acesso à API até
que seja definida uma estratégia explícita de CORS para esses domínios. Não
use `*` com credenciais/JWT apenas para liberar previews. Se futuramente houver
um domínio próprio, inclua sua origem HTTPS nessa mesma variável do Render.

## Smoke test após o deploy

1. Abra a URL da Vercel e acesse `/login`.
2. No Network do navegador, confirme que as requests vão para
   `https://fen-backend.onrender.com` e não para `localhost`.
3. Confirme que não há erro de CORS após a atualização no Render.
4. Quando houver usuário provisionado, autentique e confirme o header
   `Authorization: Bearer ...` nas chamadas da API FEN.
5. Abra dashboard e a listagem de atendimentos.
6. Teste upload, listagem, download e remoção de anexos quando houver dados.
7. Abra diretamente uma rota profunda, como `/atendimentos/<uuid>`, e atualize
   a página para confirmar o fallback da SPA.

O Render pode demorar no primeiro request depois de inatividade. O frontend
não possui timeout artificial curto adicionado para esse fluxo e preserva os
estados de carregamento/erro já existentes. O provisionamento do primeiro
ADMIN no ambiente de produção continua sendo uma pendência operacional do
backend e não é resolvido por este deploy do frontend.
