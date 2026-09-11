"""
Robo de Noticias - Boletim PoliticaBR
=======================================

O que este script faz:
1. Usa a API da Anthropic (Claude) com a ferramenta de busca na web
   para encontrar as noticias politicas mais relevantes do dia no Brasil.
2. Pede ao Claude para escrever 3 versoes editoriais da MESMA pauta do dia:
   uma com angulo de Esquerda, uma Centrista/equilibrada e uma de Direita.
3. Salva tudo em um arquivo noticias-diarias.json, que o site
   (Boletim PoliticaBR) le e usa para personalizar a manchete exibida
   para cada perfil de leitor.

Como rodar manualmente:
    pip install anthropic
    export ANTHROPIC_API_KEY="sua-chave-aqui"
    python news_robot.py

Como automatizar (rodar sozinho todo dia):
    Veja o arquivo README.md nesta mesma pasta - tem um exemplo pronto
    de GitHub Actions que roda este script todos os dias de manha e
    publica o resultado automaticamente, sem precisar de servidor.
"""

import json
import os
import sys
from datetime import datetime, timezone

import anthropic

MODEL = "claude-sonnet-5"

# Prompt que instrui o Claude a pesquisar e depois escrever as 3 versoes.
SYSTEM_PROMPT = """Você é o editor-chefe de IA do Boletim PoliticaBR, um jornal digital
brasileiro. Sua tarefa diária é: 1) pesquisar as notícias políticas mais
relevantes do Brasil nas últimas 24-48h, 2) escolher a pauta mais importante
do dia, e 3) escrever três versões editoriais dessa MESMA pauta, cada uma
calibrada para um perfil de leitor diferente:

- "esquerda": enquadramento que ressoa com um leitor progressista
  (prioriza justiça social, papel do Estado, direitos coletivos).
- "centro": enquadramento equilibrado e pragmático, mostrando os dois lados
  do debate sem pender para nenhum.
- "direita": enquadramento que ressoa com um leitor conservador/liberal
  (prioriza livre mercado, responsabilidade fiscal, valores tradicionais).

Regras importantes:
- As TRÊS versões devem ser sobre o MESMO fato/notícia do dia — o que muda
  é o enquadramento, os adjetivos e o que é destacado, nunca os fatos.
- Não invente fatos, números ou declarações. Baseie-se apenas no que
  encontrar na pesquisa.
- "manchete" deve ter no máximo 110 caracteres.
- "resumo" deve ter 1 a 2 frases (até 220 caracteres).
- Responda APENAS com um JSON válido, sem markdown, sem crases, no formato:

{
  "pauta_do_dia": "string curta descrevendo o fato central",
  "esquerda": {"manchete": "...", "resumo": "..."},
  "centro": {"manchete": "...", "resumo": "..."},
  "direita": {"manchete": "...", "resumo": "..."},
  "fonte_principal": {"nome": "veículo", "url": "https://..."}
}
"""

USER_PROMPT = (
    "Pesquise agora as notícias políticas mais relevantes do Brasil de hoje "
    "e monte o JSON conforme as instruções."
)


def gerar_feed_do_dia() -> dict:
    client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY do ambiente

    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": USER_PROMPT}],
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
    )

    # Junta todos os blocos de texto da resposta (pode ter blocos de busca no meio)
    texto_completo = "".join(
        block.text for block in response.content if block.type == "text"
    )

    # Remove eventuais crases de bloco de codigo, caso o modelo adicione por engano
    texto_limpo = texto_completo.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    dados = json.loads(texto_limpo)
    dados["gerado_em"] = datetime.now(timezone.utc).isoformat()
    return dados


def main():
    try:
        feed = gerar_feed_do_dia()
    except Exception as exc:  # noqa: BLE001 - queremos logar qualquer falha e sair com erro
        print(f"[ERRO] Nao foi possivel gerar o feed do dia: {exc}", file=sys.stderr)
        sys.exit(1)

    caminho_saida = os.path.join(os.path.dirname(__file__), "..", "noticias-diarias.json")
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)

    print(f"[OK] Feed do dia salvo em: {caminho_saida}")
    print(json.dumps(feed, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
