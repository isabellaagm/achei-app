# achei

Plataforma de fotos do casamento com reconhecimento facial de verdade.
Convidado tira uma selfie, o app compara com todas as fotos do evento e
mostra só as fotos que têm o rosto dele.

Stack: **Next.js** (site) + **Supabase** (banco de dados) + **Cloudflare R2**
(armazenamento das fotos, sem cobrar pra baixar). O reconhecimento facial
roda inteiro no navegador de cada pessoa (biblioteca Human/TensorFlow.js) —
nenhuma selfie é enviada pra lugar nenhum, só o resultado da comparação.

---

## Antes de começar

Você vai precisar criar 3 contas gratuitas (leva uns 15 minutos no total):

1. **Supabase** — supabase.com — banco de dados
2. **Cloudflare** — dash.cloudflare.com — armazenamento das fotos (R2)
3. **Vercel** — vercel.com — hospedagem do site
4. Uma conta no **GitHub** pra guardar o código (se ainda não tiver)

---

## Passo 1 — Supabase (banco de dados)

1. Crie um projeto novo em [supabase.com](https://supabase.com) (escolha uma
   senha de banco qualquer, não precisa guardar — não é usada aqui).
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Cole o conteúdo inteiro do arquivo [`supabase/schema.sql`](./supabase/schema.sql)
   deste projeto e clique em **Run**. Isso cria as 4 tabelas que o app usa.
   Se você já tinha rodado uma versão anterior deste schema, pode rodar de
   novo sem medo — os comandos são seguros de repetir (`if not exists`).
4. Vá em **Project Settings → API**. Anote:
   - **Project URL** → isso é o `SUPABASE_URL`
   - **service_role key** (na seção "Project API keys", é a chave secreta,
     não a `anon`/`public`) → isso é o `SUPABASE_SERVICE_ROLE_KEY`

⚠️ A `service_role key` dá acesso total ao banco. Ela só é usada no servidor
(nunca chega no navegador) — mesmo assim, trate como senha.

---

## Passo 2 — Cloudflare R2 (armazenamento das fotos)

1. No painel da Cloudflare, vá em **R2 Object Storage** → **Create bucket**.
   Nome sugerido: `achei` (se usar outro nome, ajuste `R2_BUCKET_NAME` depois).
2. Ainda em R2, vá em **Manage API Tokens** → **Create API Token**.
   - Permissão: **Object Read & Write**
   - Escopo: pode restringir ao bucket `achei`
3. Ao criar, a Cloudflare mostra (só uma vez, guarde num lugar seguro):
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
4. O **Account ID** (`R2_ACCOUNT_ID`) aparece no painel principal da
   Cloudflare, do lado direito, ou na URL do painel do R2.

Não precisa configurar domínio público nem CORS no bucket — o app usa URLs
assinadas geradas na hora, então o bucket pode continuar privado.

---

## Passo 3 — subir o código pro GitHub

```bash
cd achei-app
git init
git add .
git commit -m "primeira versão"
```

Crie um repositório novo (privado, se preferir) no GitHub e siga as
instruções que ele mostra pra conectar (`git remote add origin ...` e
`git push`).

---

## Passo 4 — Vercel (publicar o site)

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o
   repositório que você acabou de criar.
2. Antes de clicar em Deploy, abra **Environment Variables** e adicione as 7
   variáveis do `.env.example`:

   | Nome | Valor |
   |---|---|
   | `SUPABASE_URL` | do Passo 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | do Passo 1 |
   | `R2_ACCOUNT_ID` | do Passo 2 |
   | `R2_ACCESS_KEY_ID` | do Passo 2 |
   | `R2_SECRET_ACCESS_KEY` | do Passo 2 |
   | `R2_BUCKET_NAME` | `achei` (ou o nome que você usou) |
   | `SESSION_SECRET` | uma string aleatória — rode `openssl rand -base64 32` no terminal e cole o resultado |

3. Clique em **Deploy**. Leva uns 2 minutos. O `postinstall` do projeto
   copia os arquivos do modelo de reconhecimento facial automaticamente
   nesse processo — não precisa fazer nada manual.
4. Quando terminar, a Vercel te dá uma URL tipo `achei-xyz.vercel.app`.
   Esse já é o link real e definitivo (dá pra trocar por um domínio próprio
   depois, em Project Settings → Domains, se você quiser).

---

## Passo 5 — criar o evento

1. Acesse `https://SEU-LINK.vercel.app/organizador`.
2. Nome, data e local já vêm preenchidos com os dados de Bell & Gui — confira
   e ajuste se precisar, e escolha uma **senha de organizador** — guarde
   essa senha, é ela que destrava o painel depois.
3. Pronto, o evento existe, já com a identidade visual de vocês aplicada.
   Agora:
   - Aba **Fotos**: é onde você sobe as fotos que o fotógrafo entregar.
   - Aba **Compartilhar**: tem o QR Code e o link pra mandar pros convidados
     (aponta pra `/convidado`).
   - Aba **Convidados**: lista quem se cadastrou e quantas fotos cada um
     achou, com botão de WhatsApp pra avisar.
   - Aba **Identidade**: os 7 tons da paleta oficial, prontos pra ajuste
     fino se algum dia quiser — e onde trocar a logo/capa. As fontes não
     aparecem aqui porque são arquivos fixos (ver seção abaixo).

---

## Identidade visual "Bell & Gui"

Já vem tudo aplicado de fábrica, sem precisar configurar nada:

- **Cores**: a paleta oficial de vocês (`#F5F2EC` fundo, `#050D73` texto, `#344B9B`
  azul, `#C99A5B` dourado — os mesmos nomes e valores do `tokens.json` da
  identidade). Editável na aba **Identidade** do painel, se quiser ajustar.
- **Fontes**: Cinzel, Cinzel Decorative, New Icon Script e Montserrat — os
  arquivos reais da papelaria de vocês, auto-hospedados em `public/fonts/`
  (não dependem de nenhum serviço externo, nem no dia do casamento).
- **Símbolo**: o cordão de três dobras aparece como divisor nas telas de
  maior destaque.
- **Logo**: o monograma "BG" (telas internas) e o wordmark "BELL & GUI"
  (página inicial) — em `public/brand/`. Dá pra substituir por outro
  arquivo pela aba Identidade, se um dia quiser.
- **Capa**: enquanto vocês não sobem uma foto de capa, a ilustração do
  altar (line art) aparece no lugar, só pra não ficar um espaço vazio.

Se algum ajuste de cor não estiver batendo com o que você vê no Figma/Canva
do casamento, me manda que eu comparo com o `tokens.json` de novo.

1. Suba um lote de fotos quaisquer (podem ser de qualquer evento passado,
   ou fotos de grupo dos seus amigos) na aba Fotos.
2. Abra `/convidado` em pelo menos **dois celulares diferentes** (um iPhone
   e um Android, se der — eles se comportam diferente com câmera).
3. Cadastre-se, tire a selfie, confira se as fotos certas aparecem.
4. Se ninguém aparecer com boa confiança, ajuste o `MATCH_THRESHOLD` em
   `src/lib/match.ts` (hoje em `0.5`, seguindo a recomendação da própria
   biblioteca) — suba um pouco se estiver "achando" fotos erradas, desça um
   pouco se estiver perdendo fotos certas. Depois de mudar, faça
   `git push` de novo pra Vercel atualizar sozinha.
5. Teste também o fluxo do organizador: apagar uma foto, exportar o CSV de
   convidados, mandar uma mensagem de WhatsApp de teste.

Repita esse teste umas 2-3 semanas antes do casamento, e de novo assim que
o fotógrafo entregar as fotos de verdade.

---

## No dia em que o fotógrafo entregar as fotos

1. Baixe a pasta inteira de fotos pro seu computador (de onde quer que ele
   entregue — Drive, WeTransfer, Pixieset).
2. Entre em `/organizador`, aba **Fotos**.
3. Selecione todos os arquivos de uma vez no input de upload e clique em
   **Processar e enviar**. O navegador processa uma foto de cada vez
   (detecta rostos, gera a miniatura, sobe o arquivo original sem perda de
   qualidade). Pra 800+ fotos isso pode levar um tempo — deixe a aba aberta
   e não feche o notebook até terminar.
4. Depois de terminar, confirme na galeria que o número de fotos bate e que
   a maioria tem pelo menos 1 rosto detectado.

---

## Como os dados ficam guardados

- **Supabase (Postgres)**: nome do evento, lista de convidados, e a
  "impressão digital" (vetor de 1024 números) de cada rosto detectado.
  Isso é muito pouco dado — cabe tranquilo no plano gratuito.
- **Cloudflare R2**: as fotos em si — tanto o arquivo original (sem
  nenhuma alteração) quanto uma miniatura comprimida usada na galeria.
  R2 não cobra pra baixar dados, só pra guardar (bem barato: ~R$0,08/GB/mês).

## Custo esperado

Pra um casamento de 800+ fotos em alta resolução (uns 15-20GB):

- Cloudflare R2: **~R$2/mês** de armazenamento, download ilimitado grátis
- Supabase: **grátis** (o banco guarda só metadados, não as fotos)
- Vercel: **grátis** no plano Hobby, mais que suficiente pro tráfego de um
  evento

Se quiser mais tranquilidade perto da data (backup automático do banco, sem
risco de o projeto Supabase "dormir" por inatividade), o plano Pro do
Supabase é uns $25/mês — dá pra assinar só no mês do evento e cancelar
depois.

---

## Rodando local (pra desenvolver/testar mudanças)

```bash
npm install        # também copia os modelos de IA pra public/models
cp .env.example .env.local
# preencha o .env.local com os valores reais
npm run dev
```

Abra `http://localhost:3000`.

---

## Problemas comuns

**"Não consegui carregar o motor de reconhecimento facial"**
Os modelos de IA (arquivos em `public/models`) precisam existir. Se sumiram
de alguma forma, rode `node scripts/copy-models.js` (ou `npm install` de
novo, que já roda isso sozinho).

**Câmera não funciona no celular do convidado**
Alguns navegadores só liberam câmera em conexão https (a Vercel já entrega
https por padrão, então isso não deve ser problema). Se mesmo assim falhar,
o app já oferece "enviar uma foto" como alternativa — a pessoa tira a
selfie pelo app de câmera nativo e escolhe o arquivo.

**As fotos que aparecem pro convidado não são bem dele**
Ajuste `MATCH_THRESHOLD` em `src/lib/match.ts` — veja a seção "Como
testar" acima.

**Erro de "row-level security" ao ler/gravar no Supabase**
As rotas de API usam a `service_role key`, que ignora RLS — se aparecer
esse erro, confira se `SUPABASE_SERVICE_ROLE_KEY` está configurada
corretamente (e não a `anon key` por engano).
