// ════════════════════════════════════════════════════════════════════
// MA VIGNE — boot.js v1.0 — Garde de démarrage PWA (v4.32)
// Script CLASSIQUE (non-module), précaché par le SW (SHELL_STATIC) :
// il s'exécute même quand le bundle principal ne peut pas être chargé
// (réseau instable pendant une mise à jour, cache en transition).
// app.js pose window.__MV_BOOTED=true au démarrage → si ce flag n'est
// pas là après 10 s : 1 rechargement auto silencieux, puis un écran
// "Réessayer" au lieu d'un splash muet.
// ════════════════════════════════════════════════════════════════════
// ★★★ TUTO-1 (§358) — L'ENTRAÎNEMENT. Un tuto se joue sur un domaine FICTIF. Avant le moindre module, la
//   mémoire du téléphone (localStorage) est remplacée par une mémoire jetable : le domaine y vaut
//   « domaine-dupont », et aucune copie locale du vrai domaine n'est lue ni écrite. La mémoire jetable
//   disparaît au rechargement : sortir de l'entraînement = recharger sans ?tuto.
//   ⚠️ Si la mémoire ne peut PAS être remplacée, il n'y a PAS d'entraînement : jamais de tuto sur la vraie.
(function () {
  'use strict';
  var id = '';
  try {
    var q = location.search || '';
    var m = /[?&]tuto=([a-z0-9-]{1,40})/i.exec(q);
    if (m) sessionStorage.setItem('mavigne_tuto', m[1].toLowerCase());
    if (/[?&]tuto_auto=1(&|$)/.test(q)) sessionStorage.setItem('mavigne_tuto_auto', '1');
    id = sessionStorage.getItem('mavigne_tuto') || '';
  } catch (e) { id = ''; window.__MV_BOOT_TUTO = String(e); }
  if (!id) return;
  var vrai = null;
  try { vrai = window.localStorage; } catch (e) { vrai = null; window.__MV_BOOT_TUTO = String(e); }
  var M = Object.create(null);
  // Le seul réglage qui suit la personne dans l'entraînement : son thème.
  try { var th = vrai && vrai.getItem('mavigne_theme'); if (th != null) M.mavigne_theme = String(th); } catch (e) { window.__MV_BOOT_TUTO = String(e); }
  M.mavigne_tenant = 'domaine-dupont';
  var jetable = {
    getItem: function (k) { k = String(k); return (k in M) ? M[k] : null; },
    setItem: function (k, v) { M[String(k)] = String(v); },
    removeItem: function (k) { delete M[String(k)]; },
    clear: function () { M = Object.create(null); },
    key: function (i) { var ks = Object.keys(M); return i < ks.length ? ks[i] : null; },
    get length() { return Object.keys(M).length; }
  };
  var pose = false;
  try { Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: function () { return jetable; } }); pose = true; }
  catch (e) { window.__MV_BOOT_TUTO = String(e); }
  if (!pose || window.localStorage !== jetable) {
    try { sessionStorage.removeItem('mavigne_tuto'); sessionStorage.removeItem('mavigne_tuto_auto'); } catch (e) { window.__MV_BOOT_TUTO = String(e); }
    return;
  }
  window.__MV_TUTO = id;
  try { window.__MV_TUTO_AUTO = sessionStorage.getItem('mavigne_tuto_auto') === '1'; } catch (e) { window.__MV_TUTO_AUTO = false; }
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
      'font-family:Outfit,system-ui,sans-serif;color:#F0E2C8;z-index:99999">' +
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
