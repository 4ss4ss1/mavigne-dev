// ════════════════════════════════════════════════════════════════════
// MA VIGNE — boot.js v1.0 — Garde de démarrage PWA (v4.32)
// Script CLASSIQUE (non-module), précaché par le SW (SHELL_STATIC) :
// il s'exécute même quand le bundle principal ne peut pas être chargé
// (réseau instable pendant une mise à jour, cache en transition).
// app.js pose window.__MV_BOOTED=true au démarrage → si ce flag n'est
// pas là après 10 s : 1 rechargement auto silencieux, puis un écran
// "Réessayer" au lieu d'un splash muet.
// ════════════════════════════════════════════════════════════════════
(function () {
  'use strict';
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
