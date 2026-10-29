# Site da Integraliza · leia-me técnico

Prévia em https://integraliza.rkperformance.com.br/ (`noindex`). HTML, CSS e JS puros, sem build.

## Páginas

- `index.html`: página principal. Botões de WhatsApp com `data-msg` (o `site.js` monta o `?text=`). Chamada do Painel do agro logo depois do letreiro, com os números lidos de `data/agro.json`.
- `portal/index.html`: Painel do agro. Selic, dólar e IPCA ao vivo do Banco Central, previsão do tempo de Prudentópolis e Irati ao vivo (Open-Meteo), preços recebidos pelo produtor no Paraná (Deral/Seab-PR via Ipeadata) e notícias da semana. JS em `assets/portal.js`, estilo em `assets/portal.css` (usa as cores de `site.css`).

## Dados e rotina diária

- `data/agro.json`: preços do campo e reserva dos indicadores (se o Banco Central cair, a página usa este arquivo).
- `.github/scripts/atualizar_agro.py`: o robô que gera o arquivo. Manter o valor anterior quando uma fonte falha.
- `.github/workflows/atualizar-agro.yml`: roda o robô todo dia às 6h de Brasília e republica. Para rodar agora: aba Actions do repo, "Atualizar Painel do agro", "Run workflow".
- Não usar Cepea/Esalq-USP: licença CC BY-NC 4.0 (sem uso comercial).
- Antes de publicar uma mudança à mão: `git pull --rebase` (a rotina faz commits diários).

## Rodar local

Servidor `integraliza-site` do `.claude/launch.json` (porta 8799), ou:

```
python -m http.server 8799 --directory clientes/integraliza-contabilidade/site
```

Robô à mão: `python -I .github/scripts/atualizar_agro.py .` dentro desta pasta.

## Antes do domínio definitivo

- `og:image`, `og:url` e `canonical` com o domínio final.
- Tirar o `noindex` só no domínio definitivo.
- CRC da organização no rodapé (ver README do cliente).
