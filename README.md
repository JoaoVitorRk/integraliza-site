# Página da Integraliza · leia-me técnico

Página única em HTML, CSS e JS puros, sem build. Prévia com `noindex`.

## Rodar

Servidor `integraliza-site` do `.claude/launch.json` (porta 8799), ou:

```
python -m http.server 8799 --directory clientes/integraliza-contabilidade/site
```

## Arquivos

- `index.html`: conteúdo. Os botões de WhatsApp têm `data-msg`; o `site.js` monta o `?text=`.
- `assets/site.css`: cores em `:root` (verde-noite, ouro #BF9967 do logo, palha). Faixas de degradê: a seção seguinte começa na cor exata em que a faixa termina.
- `assets/site.js`: abertura (uma vez por visita), entrada ao rolar, curvas carregadas ao chegar perto, leitura de coordenadas, letreiro por `requestAnimationFrame`, parallax, menu e barra do celular.
- `assets/img/curvas-*.svg`: gerados por `../03-materiais/_ferramentas/curvas_de_nivel.py` (o SVG traz a própria animação de desenho).
- `assets/img/logo.png` e `caduceu.png`: tirados do logo de 720 px do Facebook (`../03-materiais/marca/`), fundo preto virou transparência.

## Antes de publicar

- `og:image` com endereço absoluto do domínio final e `canonical`.
- Tirar o `noindex` só no domínio definitivo.
- CRC da organização no rodapé (ver README do cliente).
