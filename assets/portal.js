// Integraliza · Painel do agro: Banco Central e previsão do tempo ao vivo; preços do campo e reserva em ../data/agro.json
(function () {
  var BR = function (n, casas) { return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); };
  var status = document.getElementById('status');
  var hoje = new Date();
  var dd = function (d) { return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); };
  var paraData = function (s) { var p = s.split('/'); return new Date(+p[2], +p[1] - 1, +p[0]); };

  function sgs(serie, dias) {
    var ini = new Date(hoje.getTime() - dias * 864e5);
    var url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + serie + '/dados?formato=json&dataInicial=' + dd(ini) + '&dataFinal=' + dd(hoje);
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (l) { return l.map(function (x) { return { data: x.data, valor: parseFloat(x.valor) }; }); });
  }
  function porMes(pontos) {
    var m = {}; pontos.forEach(function (p) { m[p.data.slice(3)] = p; });
    return Object.keys(m).map(function (k) { return m[k]; });
  }

  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var mesAno = function (s) { return MESES[parseInt(s.slice(3, 5), 10) - 1] + '/' + s.slice(6); };

  // gráfico de linha em SVG; ao passar o mouse (ou o dedo) mostra a data e o valor do ponto mais próximo
  function spark(svg, serie, fmtValor, fmtData) {
    if (!svg || serie.length < 2) return;
    var valores = serie.map(function (p) { return p.valor; });
    var W = 240, H = 64, min = Math.min.apply(null, valores), max = Math.max.apply(null, valores);
    if (max === min) { max += 1; min -= 1; }
    var pts = valores.map(function (v, i) { return [i * W / (valores.length - 1), H - 6 - (v - min) / (max - min) * (H - 12)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var id = 'g' + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BF9967" stop-opacity=".35"/><stop offset="1" stop-color="#BF9967" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + ' L' + W + ',' + H + ' L0,' + H + ' Z" fill="url(#' + id + ')"/>' +
      '<path class="linha" d="' + d + '"/>' +
      '<circle class="ponto" cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3"/>';

    var box = svg.parentNode;
    box._pts = pts; box._serie = serie; box._fmt = [fmtValor, fmtData];
    if (box.dataset.ligado) return;
    box.dataset.ligado = '1';
    var guia = box.querySelector('.spark-guia'), ponto = box.querySelector('.spark-ponto'), tip = box.querySelector('.spark-tip');
    var mostra = function (e) {
      var r = box.getBoundingClientRect(), n = box._pts.length;
      var i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (n - 1));
      var p = box._pts[i], x = p[0] / W * 100, y = p[1] / H * 100;
      guia.style.left = x + '%';
      ponto.style.left = x + '%'; ponto.style.top = y + '%';
      tip.textContent = box._fmt[1](box._serie[i].data) + ' · ' + box._fmt[0](box._serie[i].valor);
      tip.style.left = Math.min(84, Math.max(16, x)) + '%';
      box.classList.add('ativo');
    };
    var some;
    box.addEventListener('pointermove', function (e) { clearTimeout(some); mostra(e); });
    box.addEventListener('pointerdown', function (e) { clearTimeout(some); mostra(e); });
    box.addEventListener('pointerleave', function (e) {
      // no toque o dedo "sai" assim que levanta: deixar o valor à vista por alguns segundos
      clearTimeout(some);
      some = setTimeout(function () { box.classList.remove('ativo'); }, e.pointerType === 'mouse' ? 0 : 3000);
    });
  }
  function preenche(id, valor, sub, pe, serie, fmtValor, fmtData) {
    var el = document.getElementById(id);
    el.querySelector('[data-campo="valor"]').textContent = valor;
    if (sub) el.querySelector('[data-campo="sub"]').innerHTML = sub;
    if (pe) el.querySelector('[data-campo="pe"]').innerHTML = pe;
    spark(el.querySelector('.spark'), serie, fmtValor, fmtData);
  }
  function financeiro(f) {
    var s = f.selic, sh = s.historico, d = f.dolar.historico, ip = f.ipca12m.historico;
    var pct = function (v) { return BR(v, 2) + '%'; };
    var dif = s.atual.valor - sh[0].valor;
    preenche('i-selic', BR(s.atual.valor, 2), 'meta definida pelo Copom · em ' + s.atual.data,
      (dif === 0 ? 'estável' : (dif > 0 ? '+' : '') + BR(dif, 2) + ' p.p.') + ' em <b>24 meses</b>', sh, pct, mesAno);
    var ult = d[d.length - 1], ref = d[Math.max(0, d.length - 22)];
    var var30 = (ult.valor / ref.valor - 1) * 100;
    preenche('i-dolar', BR(ult.valor, 2), 'PTAX de venda do Banco Central · ' + ult.data,
      (var30 >= 0 ? '+' : '') + BR(var30, 1) + '% em <b>30 dias</b>', d, function (v) { return 'R$ ' + BR(v, 4); }, function (t) { return t; });
    var ui = ip[ip.length - 1];
    preenche('i-ipca', BR(ui.valor, 2), 'inflação oficial acumulada · ' + mesAno(ui.data), 'últimos <b>24 meses</b>', ip, pct, mesAno);
  }

  function campo(lista) {
    var box = document.getElementById('cotacoes-linhas');
    var vazio = function (n) { return n === null || n === undefined; };
    var v = function (n) { return '<span class="var ' + (n > 0 ? 'sobe' : n < 0 ? 'desce' : '') + '">' + BR(Math.abs(n), 2) + '%</span>'; };
    box.innerHTML = lista.map(function (c) {
      var dia = vazio(c.var_mes) ? '' : v(c.var_mes);
      var mes = vazio(c.var_ano) ? '' : v(c.var_ano);
      return '<div class="cot" role="row"><div class="cot-prod" role="cell"><b>' + c.produto + '</b><span>' + c.praca + '</span></div>' +
        '<div class="cot-preco" role="cell"><b>R$ ' + BR(c.valor, 2) + '</b><span>' + c.unidade.replace('R$/', 'por ') + '</span></div>' +
        '<div class="cot-vars"><span role="cell">' + dia + '</span><span role="cell">' + mes + '</span><span class="cot-data" role="cell">' + c.data + '</span></div></div>';
    }).join('');
  }

  // previsão do tempo (Open-Meteo, códigos WMO)
  var ICONES = {
    sol: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="6"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/></svg>',
    nuvem_sol: '<svg viewBox="0 0 32 32"><path d="M12 8.5a5 5 0 0 1 8.6 2.4"/><path d="M9 25h14a5 5 0 0 0 .6-10 7 7 0 0 0-13.3 2A4 4 0 0 0 9 25z"/></svg>',
    nuvem: '<svg viewBox="0 0 32 32"><path d="M8 24h16a5.5 5.5 0 0 0 .7-11A8 8 0 0 0 9.4 15 4.5 4.5 0 0 0 8 24z"/></svg>',
    neblina: '<svg viewBox="0 0 32 32"><path d="M5 12h22M3 17h26M6 22h20"/></svg>',
    chuva: '<svg viewBox="0 0 32 32"><path d="M8 19h16a5.5 5.5 0 0 0 .7-11A8 8 0 0 0 9.4 10 4.5 4.5 0 0 0 8 19z"/><path d="M11 23l-1.5 4M17 23l-1.5 4M23 23l-1.5 4"/></svg>',
    trovoada: '<svg viewBox="0 0 32 32"><path d="M8 18h16a5.5 5.5 0 0 0 .7-11A8 8 0 0 0 9.4 9 4.5 4.5 0 0 0 8 18z"/><path d="M17 20l-3 5h4l-3 5"/></svg>'
  };
  function clima(cod) {
    if (cod === 0) return ['sol', 'Céu limpo'];
    if (cod <= 2) return ['nuvem_sol', 'Poucas nuvens'];
    if (cod === 3) return ['nuvem', 'Nublado'];
    if (cod <= 48) return ['neblina', 'Neblina'];
    if (cod <= 57) return ['chuva', 'Garoa'];
    if (cod <= 67) return ['chuva', 'Chuva'];
    if (cod <= 77) return ['nuvem', 'Frio intenso'];
    if (cod <= 82) return ['chuva', 'Pancadas de chuva'];
    return ['trovoada', 'Trovoadas'];
  }
  // cidades da região (coordenadas da geocodificação do Open-Meteo); trocar de cidade busca só a previsão dela
  var CIDADES = [['Cândido de Abreu', -24.5669, -51.3333], ['Fernandes Pinheiro', -25.4133, -50.5475], ['Guamiranga', -25.1914, -50.8047],
    ['Guarapuava', -25.3905, -51.4654], ['Imbituva', -25.23, -50.6044], ['Inácio Martins', -25.5711, -51.0789], ['Ipiranga', -25.0239, -50.5842],
    ['Irati', -25.4672, -50.6511], ['Ivaí', -25.0108, -50.8589], ['Mallet', -25.8778, -50.8211], ['Palmeira', -25.4294, -50.0064],
    ['Pitanga', -24.7572, -51.7614], ['Ponta Grossa', -25.095, -50.1619], ['Prudentópolis', -25.2131, -50.9778], ['Rebouças', -25.6206, -50.6928],
    ['Reserva', -24.6503, -50.8506], ['Rio Azul', -25.7328, -50.7964], ['São Mateus do Sul', -25.8742, -50.3828], ['Teixeira Soares', -25.3683, -50.4606],
    ['Turvo', -25.0428, -51.5297], ['União da Vitória', -26.23, -51.0864]];
  var guardadas = [];
  try { guardadas = JSON.parse(localStorage.getItem('integraliza-cidades') || '[]'); } catch (e) {}
  [].forEach.call(document.querySelectorAll('.cidade'), function (c, n) {
    var sel = c.querySelector('.cidade-escolha');
    var atual = (guardadas[n] && CIDADES.some(function (x) { return x[0] === guardadas[n]; })) ? guardadas[n] : sel.value;
    sel.innerHTML = CIDADES.map(function (x) { return '<option' + (x[0] === atual ? ' selected' : '') + '>' + x[0] + '</option>'; }).join('');
    var aplica = function () {
      var x = CIDADES.filter(function (y) { return y[0] === sel.value; })[0];
      c.dataset.lat = x[1]; c.dataset.lon = x[2];
    };
    aplica();
    sel.addEventListener('change', function () {
      aplica();
      c.classList.add('carregando');
      previsao(c).catch(function () {}).then(function () { c.classList.remove('carregando'); });
      try {
        guardadas[n] = sel.value;
        localStorage.setItem('integraliza-cidades', JSON.stringify(guardadas));
      } catch (e) {}
    });
  });

  function tempo() {
    return Promise.all([].map.call(document.querySelectorAll('.cidade'), previsao));
  }
  function previsao(c) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.dataset.lat + '&longitude=' + c.dataset.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America%2FSao_Paulo&forecast_days=5';
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var d = j.daily, total = 0;
      c.querySelector('.dias').innerHTML = d.time.map(function (t, i) {
        var dt = new Date(t + 'T12:00:00'), cl = clima(d.weather_code[i]), mm = d.precipitation_sum[i] || 0;
        total += mm;
        var nome = i === 0 ? 'Hoje' : dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return '<li><span class="dia-nome">' + nome + '<small>' + dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + '</small></span>' +
          '<span class="dia-icone" aria-hidden="true">' + ICONES[cl[0]] + '</span>' +
          '<span class="dia-desc">' + cl[1] + '<small>' + BR(mm, 1) + ' mm · ' + (d.precipitation_probability_max[i] || 0) + '% de chance</small></span>' +
          '<span class="dia-temp">' + Math.round(d.temperature_2m_max[i]) + '° <span>' + Math.round(d.temperature_2m_min[i]) + '°</span></span></li>';
      }).join('');
      c.querySelector('.chuva-total').textContent = 'chuva prevista em 5 dias: ' + BR(total, 1) + ' mm';
    });
  }

  var reserva = fetch('../data/agro.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
  reserva.then(function (j) {
    // a seção de preços só aparece quando o arquivo traz os preços (se a coleta falhar, a página segue sem ela)
    if (j.campo && j.campo.length) {
      campo(j.campo);
      document.querySelectorAll('.so-campo').forEach(function (el) { el.hidden = false; });
    }
    financeiro(j.financeiro);
  }).catch(function () {});

  var ao_vivo = Promise.all([sgs(432, 740), sgs(1, 90), sgs(13522, 740)]).then(function (r) {
    var selic = r[0].filter(function (p) { return paraData(p.data) <= hoje; });
    financeiro({ selic: { atual: selic[selic.length - 1], historico: porMes(selic).slice(-24) }, dolar: { historico: r[1] }, ipca12m: { historico: r[2] } });
    return true;
  }).catch(function () { return false; });

  Promise.all([ao_vivo, tempo().then(function () { return true; }).catch(function () { return false; }), reserva.catch(function () { return null; })]).then(function (r) {
    var agora = new Date();
    var hora = String(agora.getHours()).padStart(2, '0') + 'h' + String(agora.getMinutes()).padStart(2, '0');
    if (r[0] && r[1]) { status.textContent = 'Dados ao vivo · atualizados hoje às ' + hora; status.parentNode.classList.add('ok'); }
    else if (r[2]) { status.textContent = 'Atualizado em ' + r[2].atualizado.replace(' ', ' às '); status.parentNode.classList.add('ok'); }
    else { status.textContent = 'As fontes estão fora do ar agora; tente de novo em alguns minutos'; }
  });
})();
