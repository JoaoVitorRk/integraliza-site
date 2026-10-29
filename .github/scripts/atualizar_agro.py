"""Atualiza os dados do Painel do agro da Integraliza (site/data/agro.json).

Roda todo dia pelo GitHub Actions (.github/workflows/atualizar-agro.yml), e também à mão.
Se uma fonte estiver fora do ar, mantém o valor anterior do arquivo em vez de falhar.
- Banco Central (SGS): Selic meta (432), dólar PTAX venda (1), IPCA 12 meses (13522). Dado público e gratuito.
- Preços do campo: "preço médio recebido pelo agricultor" no Paraná, do Deral/Seab-PR, pela API do Ipeadata
  (séries DERAL12_PR*, mensais). Dado público, reuso com a fonte citada.
  Não usar o Cepea/Esalq-USP no site: a licença dele é CC BY-NC 4.0 (sem uso comercial), e o site promove o escritório.
O navegador também busca o Banco Central e a previsão do tempo ao vivo; este arquivo é a reserva e a fonte dos preços.

Uso: python atualizar_agro.py <pasta do site>
"""
import datetime, json, sys, time, urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
saida = Path(sys.argv[1]) / "data" / "agro.json"
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
BRASILIA = datetime.timezone(datetime.timedelta(hours=-3))  # o servidor do GitHub roda em UTC; o Brasil não tem horário de verão
anterior = json.loads(saida.read_text(encoding="utf-8")) if saida.exists() else {}


def abre(url, tentativas=4):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for n in range(tentativas):
        try:
            return urllib.request.urlopen(req, timeout=90).read().decode("utf-8", "replace")
        except Exception:
            # o Banco Central às vezes devolve 502 por alguns segundos
            if n == tentativas - 1:
                raise
            time.sleep(3 * (n + 1))


def json_de(url):
    for n in range(4):
        try:
            return json.loads(abre(url))
        except json.JSONDecodeError:
            # às vezes vem uma página vazia no lugar do JSON: esperar e pedir de novo
            if n == 3:
                raise
            time.sleep(5 * (n + 1))


def sgs(serie, dias):
    """Série do Banco Central pelos últimos `dias` corridos (o 'últimos N' é limitado nas séries diárias)."""
    fim = datetime.date.today()
    ini = fim - datetime.timedelta(days=dias)
    url = (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json"
           f"&dataInicial={ini:%d/%m/%Y}&dataFinal={fim:%d/%m/%Y}")
    return [{"data": d["data"], "valor": float(d["valor"])} for d in json_de(url)]


def mensal(pontos):
    """Último valor de cada mês (Selic diária vira 24 pontos)."""
    vistos = {}
    for p in pontos:
        vistos[p["data"][3:]] = p
    return list(vistos.values())


def deral(codigo, produto, unidade):
    """Preço médio recebido pelo agricultor no Paraná (mensal), com a variação no mês e em 12 meses."""
    v = json_de(f"https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{codigo}')")["value"]
    v = [x for x in v if x.get("VALVALOR") is not None]
    ult, ant, ano = v[-1], v[-2], v[-13]
    data = datetime.date.fromisoformat(ult["VALDATA"][:10])
    pct = lambda a, b: round((a / b - 1) * 100, 2)
    return {"produto": produto, "praca": "Paraná", "unidade": unidade, "data": f"{MESES[data.month - 1]}/{data.year}",
            "valor": round(ult["VALVALOR"], 2), "var_mes": pct(ult["VALVALOR"], ant["VALVALOR"]),
            "var_ano": pct(ult["VALVALOR"], ano["VALVALOR"])}


agora = datetime.datetime.now(BRASILIA)
hoje = agora.date()
falhas = []


def ou_anterior(chave, coleta):
    """Coleta um indicador do Banco Central; se a fonte cair, devolve o que já estava no arquivo."""
    try:
        return coleta()
    except Exception as e:
        falhas.append(f"{chave}: {e}")
        velho = anterior.get("financeiro", {}).get(chave)
        if velho is None:
            raise
        return velho


def selic():
    pontos = [p for p in sgs(432, 740) if datetime.datetime.strptime(p["data"], "%d/%m/%Y").date() <= hoje]
    return {"atual": pontos[-1], "historico": mensal(pontos)[-24:]}


dados = {
    "atualizado": agora.strftime("%d/%m/%Y %H:%M"),
    "financeiro": {
        "selic": ou_anterior("selic", selic),
        "dolar": ou_anterior("dolar", lambda: {"historico": sgs(1, 90)}),
        "ipca12m": ou_anterior("ipca12m", lambda: {"historico": sgs(13522, 740)}),
    },
    "campo": [],
    "fontes": {"financeiro": "Banco Central do Brasil (SGS)",
               "campo": "Deral/Seab-PR, preço médio recebido pelo agricultor, via Ipeadata"},
}
precos_antigos = {c["produto"]: c for c in anterior.get("campo", [])}
for codigo, produto, unidade in [
    ("DERAL12_PRSO12", "Soja", "R$/saca 60 kg"),
    ("DERAL12_PRMI12", "Milho", "R$/saca 60 kg"),
    ("DERAL12_PRFEP12", "Feijão-preto", "R$/saca 60 kg"),
    ("DERAL12_PRFEC12", "Feijão de cor", "R$/saca 60 kg"),
    ("DERAL12_PRTRG12", "Trigo", "R$/saca 60 kg"),
    ("DERAL12_PRLECO12", "Leite", "R$/litro"),
    ("DERAL12_PRSUC12", "Suínos", "R$/kg"),
    ("DERAL12_PRBGO12", "Boi gordo", "R$/arroba"),
]:
    try:
        dados["campo"].append(deral(codigo, produto, unidade))
    except Exception as e:
        falhas.append(f"{codigo}: {e}")
        if produto in precos_antigos:
            dados["campo"].append(precos_antigos[produto])

if falhas:
    print("fontes fora do ar (valor anterior mantido):", "; ".join(falhas))
saida.parent.mkdir(parents=True, exist_ok=True)
saida.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", saida, "| campo:", [f"{x['produto']} {x['valor']} ({x['data']}, mês {x['var_mes']}%, 12m {x['var_ano']}%)" for x in dados["campo"]])
print("selic", dados["financeiro"]["selic"]["atual"], "| dólar", dados["financeiro"]["dolar"]["historico"][-1], "| ipca", dados["financeiro"]["ipca12m"]["historico"][-1])
