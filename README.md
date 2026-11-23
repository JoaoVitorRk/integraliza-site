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

## Carregamento e acabamento (23/11/2026)

- **Fontes dentro do site:** `assets/fonts/` tem os seis arquivos woff2 (recorte latino do Google Fonts) e o `@font-face` fica no topo do `site.css`. Nenhuma página pede mais nada ao Google. As três do topo da tela (Playfair normal, Playfair itálica e Manrope) têm `preload` no `<head>`.
- **Versão no endereço:** as páginas chamam `site.css?v=2` e `site.js?v=2`. Mudou o CSS ou o JS junto com o HTML: subir o número nas 12 páginas (página principal, painel e o modelo `03-materiais/_ferramentas/gerar_paginas_servico.py`). Sem isso, quem tem o arquivo antigo guardado vê a página nova com estilo velho por até 10 minutos.
- **Capa em AVIF**, com WebP e JPG de reserva dentro do `<picture>`. As três vêm do original `03-materiais/imagens-ia/hero-campo-2k.png` (qualidade 55; o recorte do celular começa em x = 1040). Enquanto a foto não chega, o `.hero-foto` mostra uma miniatura borrada embutida no CSS e a foto entra em fade (`onload` no próprio `<img>`).
- **Logo e símbolo em WebP** (`logo.webp`, 800 px, e `caduceu.webp`). Os PNG continuam na pasta como original.
- **Fotos de fundo das dobras escuras sob demanda:** o `site.js` põe `.foto-pre` na dobra quando ela chega a 700 px da tela (aí o CSS define a foto) e `.foto-on` quando a foto termina de carregar (fade). Sem JS, o CSS carrega direto (`.no-js`). Dobra nova com foto: acrescentar a classe nas listas do `site.css` e do `site.js`.
- **Grão:** animado só em aparelho com mouse; em tela de toque fica parado e do tamanho da tela.
- **Acabamento:** seção atual marcada no menu, dúvidas que abrem com movimento, menu do celular em sequência, coordenadas da capa sem quebra no celular, cores da marca na seleção de texto e na barra de rolagem, atalho "Pular para o conteúdo" e respeito a "reduzir movimento".
- **Medido no navegador interno, sem nada em cache:** a página principal caiu de cerca de 940 KB para cerca de 540 KB na primeira abertura (computador e celular), sem pedido a outros servidores.

## Antes do domínio definitivo

- `og:image`, `og:url` e `canonical` com o domínio final.
- Tirar o `noindex` só no domínio definitivo.
- CRC da organização no rodapé (ver README do cliente).
