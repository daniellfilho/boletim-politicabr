"""
Robo de Noticias - Boletim PoliticaBR
=======================================

O que este script faz:
1. Usa a API da Anthropic (Claude) com a ferramenta de busca na web para
   encontrar VARIAS noticias politicas reais e atuais do Brasil (nao so uma).
2. Para cada noticia, pede ao Claude 3 versoes editoriais (esquerda, centro,
   direita) - o FATO e sempre o mesmo, so o enquadramento muda.
3. Para cada noticia, busca a URL da FOTO REAL da materia original (usando
   a propria pagina da noticia, via tag <meta og:image>) - sem inventar
   nem redesenhar imagem nenhuma, sempre a foto de verdade do veiculo.
4. Salva tudo em noticias-diarias.json, que o site le para montar o jornal
   de cada assinante, mostrando so as materias do perfil politico dele.

Como rodar manualmente:
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY="sua-chave-aqui"
    python news_robot.py

Como automatizar (rodar sozinho todo dia):
    Veja o arquivo README.md nesta mesma pasta.
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

import anthropic

MODEL = "claude-sonnet-5"
QUANTIDADE_NOTICIAS = 10

SYSTEM_PROMPT = f"""Você é o editor-chefe de IA do Boletim PoliticaBR, um jornal digital
brasileiro. Sua tarefa diária é pesquisar {QUANTIDADE_NOTICIAS} notícias
políticas REAIS, DISTINTAS e ATUAIS do Brasil (das últimas 24-72h), cobrindo
uma boa variedade de temas (economia, STF/Judiciário, Congresso, eleições,
relações exteriores, segurança pública etc. - não repita o mesmo assunto
em duas notícias diferentes).

Para CADA uma dessas notícias, escreva três versões editoriais do MESMO
fato, cada uma calibrada para um perfil de leitor diferente:

- "esquerda": enquadramento que ressoa com um leitor progressista
  (prioriza justiça social, papel do Estado, direitos coletivos).
- "centro": enquadramento equilibrado e pragmático, mostrando os dois lados
  do debate sem pender para nenhum.
- "direita": enquadramento que ressoa com um leitor conservador/liberal
  (prioriza livre mercado, responsabilidade fiscal, valores tradicionais).

Regras importantes:
- As três versões de uma mesma notícia devem tratar do MESMO fato — o que
  muda é o enquadramento, os adjetivos e o que é destacado, nunca os fatos.
- Não invente fatos, números, declarações ou URLs. Baseie-se apenas no que
  encontrar na pesquisa. O campo "fonte_url" de cada notícia DEVE ser uma
  URL real que você efetivamente encontrou na busca, nunca inventada.
- "manchete" deve ter no máximo 110 caracteres. "resumo" deve ter 1 a 2
  frases (até 220 caracteres), em texto simples.
- NUNCA use tags de citação, XML, HTML ou qualquer marcação (como <cite>,
  <source>, colchetes de referência etc.) dentro dos textos. Texto puro.
- "categoria" é uma palavra ou expressão curta (ex: "Economia", "STF",
  "Congresso", "Eleições 2026", "Segurança Pública", "Política Externa").
- Seja direto e conciso. Não escreva rascunhos nem comentários fora do
  JSON — vá direto ao JSON final.
- Responda APENAS com um JSON válido, sem markdown, sem crases, no formato:

{{
  "noticias": [
    {{
      "categoria": "string curta",
      "fonte_nome": "nome do veículo",
      "fonte_url": "https://... (URL real da matéria original)",
      "esquerda": {{"manchete": "...", "resumo": "..."}},
      "centro": {{"manchete": "...", "resumo": "..."}},
      "direita": {{"manchete": "...", "resumo": "..."}}
    }}
  ]
}}

O array "noticias" deve ter exatamente {QUANTIDADE_NOTICIAS} itens.
"""

USER_PROMPT = (
    f"Pesquise agora {QUANTIDADE_NOTICIAS} notícias políticas reais e atuais "
    "do Brasil e monte o JSON conforme as instruções."
)


def extrair_imagem_da_pagina(url: str) -> str | None:
    """Baixa o HTML da matéria original e extrai a foto real (og:image /
    twitter:image) - a mesma imagem que aparece quando esse link é
    compartilhado. Nunca gera nem redesenha imagem nenhuma; se não achar,
    retorna None e o site usa um ícone genérico no lugar."""
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (compatible; BoletimPoliticaBRBot/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read(300_000).decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        print(f"[AVISO] Não foi possível baixar {url} para extrair imagem: {exc}", file=sys.stderr)
        return None

    for propriedade in ("og:image", "twitter:image"):
        padrao = re.compile(
            rf'<meta[^>]+(?:property|name)=["\']{propriedade}["\'][^>]+content=["\']([^"\']+)["\']',
            re.IGNORECASE,
        )
        m = padrao.search(html)
        if m:
            return m.group(1)
    return None


def gerar_feed_do_dia() -> dict:
    client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY do ambiente

    # Modo streaming: obrigatorio quando a resposta pode demorar mais de
    # 10 minutos (nosso caso, com 10 noticias + varias buscas na web).
    with client.messages.stream(
        model=MODEL,
        max_tokens=24000,
        thinking={"type": "disabled"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": USER_PROMPT}],
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
    ) as stream:
        for evento in stream:
            if evento.type == "content_block_start":
                print(f"[DEBUG] Bloco iniciado: {evento.content_block.type}", file=sys.stderr)
        response = stream.get_final_message()

    print(f"[DEBUG] stop_reason: {response.stop_reason}", file=sys.stderr)

    texto_completo = "".join(
        block.text for block in response.content if block.type == "text"
    )

    texto_limpo = texto_completo.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    texto_limpo = re.sub(r"</?[a-zA-Z][^<>]*>", "", texto_limpo)

    # Protecao extra: pega so o trecho entre a primeira "{" e a ultima "}",
    # descartando qualquer caractere invisivel, BOM ou texto solto que o
    # modelo eventualmente coloque antes/depois do JSON.
    inicio = texto_limpo.find("{")
    fim = texto_limpo.rfind("}")
    if inicio != -1 and fim != -1 and fim > inicio:
        texto_limpo = texto_limpo[inicio:fim + 1]

    if not texto_limpo:
        print(f"[DEBUG] Resposta completa (sem texto final): {response.content}", file=sys.stderr)
        raise ValueError("O modelo nao retornou nenhum texto final (resposta vazia).")

    try:
        dados = json.loads(texto_limpo)
    except json.JSONDecodeError:
        print(f"[DEBUG] Texto recebido que falhou ao virar JSON (repr):\n{texto_limpo!r}", file=sys.stderr)
        raise

    noticias = dados.get("noticias", [])
    print(f"[DEBUG] {len(noticias)} notícias recebidas do modelo. Buscando fotos reais...", file=sys.stderr)

    for i, noticia in enumerate(noticias):
        noticia["id"] = i + 1
        url_fonte = noticia.get("fonte_url")
        imagem = extrair_imagem_da_pagina(url_fonte) if url_fonte else None
        noticia["imagem_url"] = imagem
        print(f"[DEBUG] Notícia {i + 1}: imagem {'encontrada' if imagem else 'NÃO encontrada'}", file=sys.stderr)

    dados["noticias"] = noticias
    dados["gerado_em"] = datetime.now(timezone.utc).isoformat()
    return dados


def main():
    try:
        feed = gerar_feed_do_dia()
    except Exception as exc:  # noqa: BLE001
        print(f"[ERRO] Nao foi possivel gerar o feed do dia: {exc}", file=sys.stderr)
        sys.exit(1)

    caminho_saida = os.path.join(os.path.dirname(__file__), "..", "noticias-diarias.json")
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)

    print(f"[OK] Feed do dia salvo em: {caminho_saida}")
    print(json.dumps(feed, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
