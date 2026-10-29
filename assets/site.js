// Integraliza Contabilidade e Agrimensura · prévia RK Performance
(function () {
  var html = document.documentElement;
  html.classList.remove('no-js');
  html.classList.add('js');

  // WhatsApp: cada botão leva a própria mensagem (sem JS, abre a conversa sem texto)
  document.querySelectorAll('a[data-msg]').forEach(function (a) {
    a.href = a.href.split('?')[0] + '?text=' + encodeURIComponent(a.getAttribute('data-msg'));
  });

  // abertura: roda uma vez por visita; rolar, tocar ou teclar encerra na hora
  var hero = document.querySelector('.hero');
  var visto = false;
  try { visto = sessionStorage.getItem('integraliza-intro') === '1'; sessionStorage.setItem('integraliza-intro', '1'); } catch (e) {}
  function mostraHero() { if (hero) hero.classList.add('in'); }
  if (visto) {
    html.classList.add('sem-intro');
    mostraHero();
  } else {
    var fim = function () {
      if (html.classList.contains('intro-fim')) return;
      html.classList.add('intro-fim');
      mostraHero();
      ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, fim); });
    };
    setTimeout(fim, 2500);
    setTimeout(mostraHero, 1900);
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, fim, { passive: true }); });
  }

  // cabeçalho ganha fundo depois do topo
  var topo = document.querySelector('.topo');
  function fixo() { topo.classList.toggle('fixo', window.scrollY > 40); }
  fixo();
  window.addEventListener('scroll', fixo, { passive: true });

  // entrada ao rolar
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // curvas de nível: o SVG só carrega quando chega perto, para o desenho acontecer na frente de quem lê
  var ioCurvas = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var img = e.target;
      img.src = img.getAttribute('data-src');
      var bloco = img.closest('.bloco');
      if (bloco) bloco.classList.add('visto');
      ioCurvas.unobserve(img);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  document.querySelectorAll('img[data-src]').forEach(function (img) { ioCurvas.observe(img); });

  // leitura de campo: os números "acertam" a posição quando a seção aparece
  var leitura = document.querySelector('.leitura');
  if (leitura) {
    var ioLeitura = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      ioLeitura.disconnect();
      leitura.querySelectorAll('dd[data-alvo]').forEach(function (dd) {
        var alvo = dd.getAttribute('data-alvo');
        var passos = 0;
        var t = setInterval(function () {
          passos++;
          if (passos > 18) { dd.textContent = alvo; clearInterval(t); return; }
          dd.textContent = alvo.replace(/\d/g, function (d, i) { return i < passos / 3 ? d : String(Math.floor(Math.random() * 10)); });
        }, 70);
      });
    }, { threshold: .5 });
    ioLeitura.observe(leitura);
  }

  // letreiro movido por JS (não depende de @keyframes nem de "reduzir movimento")
  document.querySelectorAll('.letreiro').forEach(function (box) {
    var faixa = box.querySelector('.letreiro-faixa');
    if (!faixa) return;
    var base = faixa.innerHTML;
    faixa.innerHTML = base + base + base;
    var x = 0, ultimo = null, terco = 0;
    function mede() { terco = faixa.scrollWidth / 3; }
    mede();
    window.addEventListener('resize', mede);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mede);
    function anda(t) {
      if (ultimo !== null) {
        var dt = Math.min(50, t - ultimo) / 1000;
        x -= 38 * dt;
        if (-x >= terco) x += terco;
        faixa.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      ultimo = t;
      requestAnimationFrame(anda);
    }
    requestAnimationFrame(anda);
  });

  // parallax leve, só no computador e só sem "reduzir movimento"
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pars = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (pars.length && !reduz && window.innerWidth > 860) {
    var ticking = false;
    var move = function () {
      pars.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        var d = (r.top + r.height / 2 - window.innerHeight / 2) * f;
        el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(move); ticking = true; } }, { passive: true });
    move();
  }

  // menu do celular
  var mb = document.querySelector('.menu-botao'), mc = document.getElementById('menu-cel');
  if (mb && mc) {
    var fechaMenu = function () { mc.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-aberto'); };
    mb.addEventListener('click', function () {
      var abrir = mc.hidden;
      mc.hidden = !abrir;
      mb.setAttribute('aria-expanded', String(abrir));
      document.body.classList.toggle('menu-aberto', abrir);
      topo.classList.add('fixo');
    });
    mc.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', fechaMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechaMenu(); });
  }

  // barra do WhatsApp no celular: aparece depois dos botões do topo e some no contato final
  var barra = document.querySelector('.barra-cel');
  if (barra) {
    var botoesHero = document.querySelector('.hero-acoes');
    var contato = document.querySelector('#contato');
    var noHero = true, noFim = false;
    var atualiza = function () {
      var v = !noHero && !noFim;
      barra.classList.toggle('visivel', v);
      barra.setAttribute('aria-hidden', v ? 'false' : 'true');
      var a = barra.querySelector('a'); if (a) a.tabIndex = v ? 0 : -1;
    };
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.target === botoesHero) noHero = en.isIntersecting || en.boundingClientRect.top > 0;
        if (en.target === contato) noFim = en.isIntersecting;
      });
      atualiza();
    });
    if (botoesHero) ob.observe(botoesHero);
    if (contato) ob.observe(contato);
  }

  // chamada do Painel do agro: números do dia a partir do arquivo que a rotina diária atualiza
  var mini = document.querySelector('.painel-chamada');
  if (mini) {
    fetch('./data/agro.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
      var br = function (n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
      var f = j.financeiro, d = f.dolar.historico, soja = (j.campo || []).filter(function (c) { return c.produto === 'Soja'; })[0];
      var poe = function (k, v) { var el = mini.querySelector('[data-mini="' + k + '"]'); if (el) el.textContent = v; };
      poe('selic', br(f.selic.atual.valor) + '%');
      poe('dolar', br(d[d.length - 1].valor));
      if (soja) poe('soja', br(soja.valor));
      poe('data', 'Atualizado em ' + j.atualizado.split(' ')[0] + ' · Banco Central e Deral/Seab-PR' + (soja ? ' (soja: ' + soja.data + ')' : ''));
    }).catch(function () {});
  }

  // só uma dúvida aberta por vez
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      d.parentNode.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
