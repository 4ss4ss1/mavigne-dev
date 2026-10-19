// ════════════════════════════════════════════════════════════════════
// MA VIGNE — boot.js v1.0 — Garde de démarrage PWA (v4.32)
// Script CLASSIQUE (non-module), précaché par le SW (SHELL_STATIC) :
// il s'exécute même quand le bundle principal ne peut pas être chargé
// (réseau instable pendant une mise à jour, cache en transition).
// app.js pose window.__MV_BOOTED=true au démarrage → si ce flag n'est
// pas là après 10 s : 1 rechargement auto silencieux, puis un écran
// "Réessayer" au lieu d'un splash muet.
// ════════════════════════════════════════════════════════════════════
// ★★★ TUTO-1 (§358), TUTO-2 (§359) — L'ENTRAÎNEMENT. Un tuto se joue sur un domaine FICTIF. Avant le moindre
//   module, la mémoire du téléphone (localStorage) ET la mémoire de session (sessionStorage) sont remplacées par
//   des mémoires jetables : le domaine y vaut « domaine-dupont », rien du vrai domaine n'est lu ni écrit.
//   La mémoire de session est PARTAGÉE entre l'appli et un cadre de l'appli (le panneau d'entraînement, sur
//   ordinateur) : l'entraînement n'y écrit donc jamais, et son drapeau vit dans l'ADRESSE seule (?tuto=…).
//   Sortir = recharger sans ?tuto.
//   ⚠️ Si une mémoire ne peut PAS être remplacée, il n'y a PAS d'entraînement : jamais de tuto sur la vraie.
(function () {
  'use strict';
  // TUTO-4 (§361) : la marque de CE boot.js — tutos.js refuse tout entraînement sans elle (un boot.js resté en cache).
  window.__MV_BOOT_TUTO_V = 4;
  var q = '';
  try { q = location.search || ''; } catch (e) { q = ''; }
  var m = /[?&]tuto=([a-z0-9-]{1,40})/i.exec(q), retour = '';
  // Le retour posé par le vrai domaine (plein écran), lu AVANT de remplacer la mémoire ; puis le ménage
  // (TUTO-1 gardait aussi son drapeau dans la mémoire de session).
  try {
    retour = sessionStorage.getItem('mavigne_tuto_retour') || '';
    sessionStorage.removeItem('mavigne_tuto'); sessionStorage.removeItem('mavigne_tuto_auto'); sessionStorage.removeItem('mavigne_tuto_retour');
  } catch (e) { window.__MV_BOOT_TUTO = String(e); }
  if (!m) return;
  var cadre = /[?&]tuto_cadre=1(&|$)/.test(q);
  function jetable(depart) {
    var M = Object.create(null), k;
    for (k in depart) M[k] = depart[k];
    return {
      getItem: function (c) { c = String(c); return (c in M) ? M[c] : null; },
      setItem: function (c, v) { M[String(c)] = String(v); },
      removeItem: function (c) { delete M[String(c)]; },
      clear: function () { M = Object.create(null); },
      key: function (i) { var ks = Object.keys(M); return i < ks.length ? ks[i] : null; },
      get length() { return Object.keys(M).length; }
    };
  }
  // Le seul réglage qui suit la personne dans l'entraînement : son thème.
  var depart = { mavigne_tenant: 'domaine-dupont' };
  try { var th = window.localStorage.getItem('mavigne_theme'); if (th != null) depart.mavigne_theme = String(th); } catch (e) { window.__MV_BOOT_TUTO = String(e); }
  var JL = jetable(depart), JS = jetable({}), pose = false;
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: function () { return JL; } });
    Object.defineProperty(window, 'sessionStorage', { configurable: true, enumerable: true, get: function () { return JS; } });
    pose = true;
  } catch (e) { window.__MV_BOOT_TUTO = String(e); }
  if (!pose || window.localStorage !== JL || window.sessionStorage !== JS) {
    // Pas de mémoire jetable : pas d'entraînement. En plein écran, retour à l'appli normale ; dans un cadre, on
    // arrête tout — l'appli ne doit jamais démarrer sur la vraie session dans le panneau d'entraînement.
    if (cadre) { try { window.stop(); document.documentElement.innerHTML = '<body style="font-family:system-ui,sans-serif;padding:24px">L\u2019entra\u00eenement n\u2019a pas pu d\u00e9marrer sur ce navigateur.</body>'; } catch (e2) { window.__MV_BOOT_TUTO = String(e2); } }
    else location.replace(location.pathname);
    return;
  }
  window.__MV_TUTO = m[1].toLowerCase();
  window.__MV_TUTO_AUTO = /[?&]tuto_auto=1(&|$)/.test(q);
  window.__MV_TUTO_CADRE = cadre;
  window.__MV_TUTO_RETOUR = retour;
})();

(function () {
  'use strict';
  // MAJ-2 (§327) : la page se recharge pour une mise a jour (app.js a pose mv_maj_faite juste avant) — l'ecran de
  // demarrage dit « Mise a jour » au lieu de sa phrase habituelle, dans la continuite du rideau d'app.js.
  try {
    if (sessionStorage.getItem('mv_maj_faite')) {
      var spSub = document.getElementById('sp-sub');
      if (spSub) spSub.textContent = 'Mise \u00e0 jour';
    }
  } catch (e) { window.__MV_BOOT_MAJ = String(e); }
  var DELAY = 10000;

  window.__MV_BOOT_T = setTimeout(function () {
    if (window.__MV_BOOTED) return;

    var retried = false;
    try { retried = sessionStorage.getItem('mv_boot_retry') === '1'; } catch (e) {}

    if (!retried) {
      // 1ʳᵉ tentative : recharger en silence (le réseau était peut-être
      // juste indisponible au moment du fetch du bundle)
      try { sessionStorage.setItem('mv_boot_retry', '1'); } catch (e) {}
      location.reload();
      return;
    }

    // 2ᵉ échec : écran explicite à la place du splash muet
    var s = document.getElementById('splash-screen') || document.body;
    s.innerHTML =
      '<div style="position:fixed;inset:0;background:#0F1319;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:18px;padding:32px;text-align:center;' +
      'font-family:var(--font-ui,Outfit,system-ui,sans-serif);color:#F0E2C8;z-index:99999">' +
        '<div style="font-size:44px">🍇</div>' +
        '<div style="font-size:17px;font-weight:600">Connexion instable</div>' +
        '<div style="font-size:13px;color:rgba(240,226,200,0.55);line-height:1.5;max-width:280px">' +
          'L\'application n\'a pas pu se charger complètement. Vérifiez votre réseau puis réessayez.' +
        '</div>' +
        '<button onclick="try{sessionStorage.removeItem(\'mv_boot_retry\')}catch(e){};location.reload()" ' +
          'style="margin-top:6px;min-height:48px;padding:13px 34px;border-radius:13px;border:none;' +
          'background:#3D6B27;color:#fff;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer">' +
          'Réessayer' +
        '</button>' +
      '</div>';
    if (s !== document.body) s.style.display = 'block';
  }, DELAY);
})();
