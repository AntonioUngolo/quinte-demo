/* Script comune del sito demo. Nessun invio di rete: i form sono solo simulati. */
(function(){
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Bordo della barra quando la pagina non è in cima (sentinella, niente listener di scroll) */
  var nav = document.querySelector('.nav');
  if (nav && hasIO){
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
    document.body.prepend(sentinel);
    new IntersectionObserver(function(es){
      nav.classList.toggle('scrolled', !es[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Menu su telefono */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('nav-panel');
  if (toggle && panel){
    var closeMenu = function(){
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Apri il menu');
      toggle.firstElementChild.className = 'ph ph-list';
    };
    toggle.addEventListener('click', function(){
      var open = !panel.classList.contains('open');
      panel.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
      toggle.firstElementChild.className = open ? 'ph ph-x' : 'ph ph-list';
    });
    panel.addEventListener('click', function(e){ if (e.target.tagName === 'A') closeMenu(); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && panel.classList.contains('open')){ closeMenu(); toggle.focus(); }
    });
  }

  /* Comparsa delle sezioni */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduce && hasIO){
    var ro = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
    reveals.forEach(function(el){ ro.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }

  /* Come funziona: la schermata a destra segue il passo al centro dello schermo */
  var steps = document.querySelectorAll('.step');
  var stageItems = document.querySelectorAll('.stage-item');
  if (steps.length && hasIO){
    var so = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var i = e.target.getAttribute('data-step');
        steps.forEach(function(s){ s.classList.toggle('active', s === e.target); });
        stageItems.forEach(function(s){ s.classList.toggle('active', s.getAttribute('data-stage') === i); });
      });
    }, {rootMargin: '-45% 0px -45% 0px'});
    steps.forEach(function(s){ so.observe(s); });
  }

  /* Schede (ruoli e simili): ogni [role="tablist"] gestisce le sue */
  document.querySelectorAll('[role="tablist"]').forEach(function(list){
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab, focus){
      tabs.forEach(function(t){
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ select(t); });
      t.addEventListener('keydown', function(e){
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n){ e.preventDefault(); select(n, true); }
      });
    });
  });

  /* Form: validazione lato client, nessun invio.
     <form data-valida [data-dopo="pagina.html"] [data-fatto="id-del-messaggio"]>
     Ogni campo obbligatorio ha `required` e `data-err="id-del-box-errore"`;
     messaggi in data-msg (campo vuoto) e data-msg-formato (formato sbagliato). */
  function checkField(el){
    var v = el.type === 'checkbox' ? '' : el.value.trim();
    var empty = el.getAttribute('data-msg') || 'Questo campo è obbligatorio.';
    var bad = el.getAttribute('data-msg-formato') || 'Controlla questo campo.';
    if (el.type === 'checkbox') return el.checked ? '' : empty;
    if (!v) return el.required ? empty : '';
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : bad;
    if (el.type === 'tel'){
      var digits = v.replace(/[^\d]/g, '');
      return (/^[\d\s+().\/-]+$/.test(v) && digits.length >= 6 && digits.length <= 15) ? '' : bad;
    }
    var min = parseInt(el.getAttribute('minlength') || '2', 10);
    return v.length >= min ? '' : bad;
  }
  function showField(el){
    var box = document.getElementById(el.getAttribute('data-err'));
    var msg = checkField(el);
    if (box){
      box.hidden = !msg;
      box.lastElementChild.textContent = msg;
    }
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  }
  document.querySelectorAll('form[data-valida]').forEach(function(form){
    form.setAttribute('novalidate', '');
    /* obbligatori, più i facoltativi con un box d'errore (controllati solo se compilati) */
    var fields = Array.prototype.slice.call(form.querySelectorAll('[required], [data-err]'));
    fields.forEach(function(el){
      var ev = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(ev, function(){ if (el.getAttribute('aria-invalid') === 'true') showField(el); });
      if (el.type !== 'checkbox') el.addEventListener('blur', function(){ if (el.value.trim()) showField(el); });
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function(el){ if (!showField(el) && !firstBad) firstBad = el; });
      if (firstBad){ firstBad.focus(); return; }
      var next = form.getAttribute('data-dopo');
      if (next){ window.location.href = next; return; }
      var done = document.getElementById(form.getAttribute('data-fatto'));
      form.hidden = true;
      if (done){ done.hidden = false; done.focus(); }
    });
  });

  /* Preselezione del piano da indirizzo (demo.html?piano=medium) */
  var params = new URLSearchParams(window.location.search);
  var piano = params.get('piano');
  if (piano){
    var radio = document.querySelector('input[name="piano"][value="' + piano.replace(/[^a-z-]/g, '') + '"]');
    if (radio) radio.checked = true;
  }

  /* Banner cookie dimostrativo: ricorda la scelta solo in questo browser */
  var cookie = document.getElementById('cookie');
  var KEY = 'quinte-demo-cookie';
  function getChoice(){ try { return localStorage.getItem(KEY); } catch (e){ return null; } }
  function setChoice(v){ try { localStorage.setItem(KEY, v); } catch (e){} }
  if (cookie){
    if (!getChoice()) cookie.hidden = false;
    cookie.querySelectorAll('[data-cookie]').forEach(function(b){
      b.addEventListener('click', function(){ setChoice(b.getAttribute('data-cookie')); cookie.hidden = true; });
    });
    document.querySelectorAll('[data-cookie-apri]').forEach(function(b){
      b.addEventListener('click', function(){ cookie.hidden = false; cookie.querySelector('button').focus(); });
    });
  }
})();
