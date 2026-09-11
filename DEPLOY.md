# Deploy completo — Boletim PoliticaBR

Este guia leva o projeto do zero até no ar, com o robô publicando
notícias novas todo dia sozinho. São 4 etapas. Nenhuma delas exige
servidor próprio nem custo fixo.

---

## Visão geral

```
GitHub (guarda o código e o feed do dia)
   │
   ├── GitHub Actions ──► roda o robô 1x/dia ──► atualiza noticias-diarias.json
   │                                                        │
   └── Vercel (hospeda o site) ◄─── sempre publica o repo mais recente
```

Você só precisa de 3 contas grátis: **GitHub**, **Vercel** e uma
**chave de API da Anthropic**.

---

## Etapa 1 — Subir o projeto para o GitHub

1. Crie uma conta em https://github.com (se ainda não tiver).
2. Clique em **New repository**. Nome sugerido: `boletim-politicabr`.
   Deixe como **Public** ou **Private** (tanto funciona com Vercel).
3. No seu computador, dentro da pasta deste projeto (a que contém
   `index.html`, `assets/`, `robo/` etc.), rode:

```bash
git init
git add .
git commit -m "Primeira versao do Boletim PoliticaBR"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/boletim-politicabr.git
git push -u origin main
```

(Troque `SEU-USUARIO` pelo seu nome de usuário do GitHub. O próprio
GitHub mostra esses comandos exatos na tela ao criar o repositório.)

---

## Etapa 2 — Colocar o site no ar (Vercel)

1. Crie uma conta em https://vercel.com — pode entrar direto com sua
   conta do GitHub (**Continue with GitHub**).
2. Clique em **Add New → Project**.
3. Selecione o repositório `boletim-politicabr` que você acabou de subir.
4. Vercel vai detectar que é um site estático (não precisa de build).
   Deixe as configurações padrão e clique em **Deploy**.
5. Em ~30 segundos seu site estará no ar, em uma URL como:
   `https://boletim-politicabr.vercel.app`

A partir de agora, **todo push no GitHub publica uma nova versão do
site automaticamente** — incluindo quando o robô atualizar o feed do dia.

---

## Etapa 3 — Ligar o robô (GitHub Actions)

1. Pegue sua chave de API em https://console.anthropic.com
   (menu **API Keys → Create Key**).
2. No GitHub, abra o repositório → **Settings → Secrets and variables
   → Actions → New repository secret**.
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: cole sua chave
3. O arquivo do robô (`.github/workflows/robo-diario.yml`) já está
   incluído neste projeto — não precisa criar nada, só subir para o
   GitHub junto com o resto (Etapa 1 já faz isso).
4. Para testar sem esperar o horário agendado: no GitHub, vá em
   **Actions → Robo de Noticias Diario → Run workflow**. Isso executa
   o robô agora mesmo.
5. Se der tudo certo, você verá um novo commit automático
   ("Atualiza noticias do dia") aparecer no repositório, e a Vercel
   vai publicar essa atualização sozinha em seguida.

Por padrão, o robô está agendado para rodar **todo dia às 08:00 UTC**
(≈ 05h em Brasília). Para mudar o horário, edite a linha `cron` dentro
de `.github/workflows/robo-diario.yml` — o formato é
`minuto hora dia mês dia-da-semana`, sempre em UTC.

---

## Etapa 4 — Confirmar que está tudo conectado

1. Abra a URL do seu site na Vercel.
2. Faça o quiz até o resultado.
3. A manchete personalizada exibida deve ser a mesma que está em
   `noticias-diarias.json` na raiz do repositório — se você rodou o
   robô na Etapa 3, deve ser uma notícia real do dia, não mais o
   texto de exemplo.

Se a manchete ainda aparecer como texto de exemplo, confira:
- Se o workflow do robô rodou sem erro (aba **Actions** do GitHub).
- Se o commit "Atualiza noticias do dia" apareceu no repositório.
- Se a Vercel já reimplantou o site depois desse commit (aba
  **Deployments** na Vercel).

---

## Depois de no ar

- **Domínio próprio**: em **Vercel → Settings → Domains**, você pode
  apontar um domínio próprio (ex: `boletimpoliticabr.com.br`) para o
  projeto, gratuitamente.
- **Custo do robô**: cada execução diária é uma chamada à API da
  Anthropic com busca na web. É um uso baixo (1x/dia); acompanhe o
  consumo em https://console.anthropic.com.
- **Editar o feed manualmente**: se quiser ajustar a notícia do dia
  na mão, basta editar `noticias-diarias.json` direto no GitHub e
  fazer commit — o site atualiza sozinho.
