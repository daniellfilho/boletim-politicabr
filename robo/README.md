# Robô de Notícias — Boletim PoliticaBR

Este robô roda uma vez por dia, pesquisa as notícias políticas mais
relevantes do Brasil, e escreve automaticamente 3 versões da mesma pauta
(esquerda, centro e direita). O resultado fica em `noticias-diarias.json`,
que o site lê para personalizar a manchete de cada leitor.

## 1. Testar localmente

```bash
cd robo
pip install -r requirements.txt
export ANTHROPIC_API_KEY="sua-chave-aqui"
python news_robot.py
```

Isso vai criar/atualizar o arquivo `noticias-diarias.json` na raiz do
projeto (um nível acima da pasta `robo/`).

## 2. Colocar para rodar sozinho todo dia (sem precisar de servidor)

A forma mais simples e gratuita é usar o **GitHub Actions** (o próprio
GitHub roda o robô por você, todo dia, de graça, e publica o resultado).

Passos:

1. Suba este projeto para um repositório no GitHub.
2. Em **Settings → Secrets and variables → Actions**, crie um secret
   chamado `ANTHROPIC_API_KEY` com sua chave da API da Anthropic.
3. Crie o arquivo `.github/workflows/robo-diario.yml` com este conteúdo
   (já incluso em `robo/exemplo-github-actions.yml` nesta pasta — só
   copiar para o caminho acima):

```yaml
name: Robo de Noticias Diario

on:
  schedule:
    - cron: '0 8 * * *'   # todo dia as 08:00 UTC (~05:00 no horario de Brasilia)
  workflow_dispatch:        # tambem permite rodar manualmente pelo GitHub

jobs:
  atualizar-noticias:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - run: pip install -r robo/requirements.txt

      - run: python robo/news_robot.py
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Publicar o novo feed
        run: |
          git config user.name "robo-politicabr"
          git config user.email "robo@politicabr.local"
          git add noticias-diarias.json
          git diff --staged --quiet || git commit -m "Atualiza noticias do dia"
          git push
```

Com isso: todo dia de manhã, sozinho, o GitHub roda o robô, gera o novo
`noticias-diarias.json` e publica no próprio repositório — sem você
precisar tocar em nada.

### Outras opções de agendador (se preferir não usar GitHub Actions)

- **Vercel Cron Jobs** ou **Render Cron Jobs** — se o site já estiver
  hospedado em um desses serviços.
- **Cron de um servidor próprio** — `0 8 * * * cd /caminho/robo && python news_robot.py`.

Qualquer uma dessas opções funciona; a ideia é sempre a mesma: rodar
`news_robot.py` uma vez por dia e publicar o `noticias-diarias.json`
resultante em algum lugar que o site consiga acessar (o próprio
domínio do site, ou um link público do GitHub).

## 3. Como o site consome isso

O `app.js` já foi ajustado para, ao carregar a página, tentar buscar
`noticias-diarias.json` automaticamente. Se o arquivo existir e tiver a
pauta do dia, a manchete do mockup e os blocos personalizados de
resultado passam a usar essa notícia real, em vez do texto fixo de
exemplo. Se o arquivo não existir (por exemplo, ao abrir o `preview.html`
direto do computador, sem servidor), o site simplesmente continua
usando os textos fixos — nada quebra.

## Observação sobre custo

Cada execução do robô é uma chamada à API da Anthropic com busca na
web habilitada. Rodando 1x por dia, o custo é bem baixo, mas vale
acompanhar o consumo no painel da Anthropic (console.anthropic.com).
