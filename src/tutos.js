/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   MA VIGNE — tutos.js — ★★★ TUTO-1 (§358) : LES TUTORIELS GUIDÉS, JOUÉS SUR LES VRAIS ÉCRANS
   AVEC UN DOMAINE FICTIF

   ══ CE QUE C'EST ══
   Un tuto montre UN geste, étape par étape, façon tutoriel de jeu : un voile sombre laisse un
   seul trou sur ce qu'il faut toucher, un doigt doré le montre, une consigne dit quoi faire.
   C'est la personne qui touche. Toucher à côté ne casse rien : la consigne explique. Une étape
   n'est réussie que quand l'écran a VRAIMENT changé (la fenêtre s'est ouverte, la cuve est
   remontée), jamais sur le simple clic.

   ══ OÙ IL SE JOUE : SUR UN DOMAINE FICTIF, JAMAIS SUR CELUI DU CLIENT ══
   Lancer un tuto RECHARGE la page avec ?tuto=<id>. Trois verrous, dans l'ordre où ils jouent :
     1. public/boot.js remplace la mémoire du téléphone (localStorage) par une mémoire jetable,
        AVANT le moindre module. Le domaine y est « domaine-dupont » : aucune copie locale du
        vrai domaine n'est lue ni écrite. S'il ne peut pas la remplacer, PAS d'entraînement.
     2. firebase.js : toutes les lectures et écritures du SDK (Firestore, fichiers, fonctions
        serveur, mot de passe, déconnexion) passent par une porte unique (_mvTutoPorte) qui,
        pendant un entraînement, ne laisse rien sortir ni rien entrer.
     3. Les règles Firestore : le jeton du client vaut pour SON domaine, pas pour domaine-dupont.
        Une écriture qui passerait quand même serait refusée par le serveur.
   On en sort en rechargeant sans ?tuto : l'appli repart sur le vrai domaine, intacte.

   ══ POURQUOI ÇA RESTE JUSTE QUAND L'APPLI CHANGE ══
     · Le tuto se joue sur l'écran RÉEL : il n'y a pas de copie d'écran à tenir à jour.
     · Il vise des étiquettes posées sur les boutons (data-tuto="…"), pas un chemin de styles.
     · Il LIT à l'écran le texte de ce qu'il montre : un bouton renommé, la consigne suit.
     · Le chemin vers un module se calcule depuis le vrai dock ou la vraie barre (rôle, mode
       tracteur, téléphone ou ordinateur, « Plus ») : il n'est écrit nulle part à la main.
     · Ce qui ne peut pas suivre tout seul — une étape NOUVELLE (un champ obligatoire ajouté) —
       est attrapé : scripts/mv-tutos-jeu.mjs rejoue CHAQUE tuto tout seul à chaque build
       (téléphone et ordinateur), et un tuto qui ne va plus au bout bloque la mise en ligne.
       scripts/mv-harnais-tutos.mjs tient les étiquettes, la porte, et le compte des gestes sans tuto.

   ══ AJOUTER UN TUTO ══
   Une entrée dans TU_TUTOS (plus bas) : ses étapes, ce qu'il couvre (`couvre` : les fonctions
   de l'appli qu'il enseigne), et les data-tuto posés sur les éléments visés. Rien d'autre.
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

// ── 1. LE DOMAINE FICTIF ─────────────────────────────────────────────────────────────────────────
// Repris de public/mavigne_demo_data.json (le domaine de la démo : Marie, Jean, Sophie, Paul), plus
// la cuve GNR du tuto « Noter un plein ». Il repart NEUF à chaque tuto : même départ pour tous.
var TU_DOMAINE = 'Domaine des Grandes Vignes';
var TU_DONNEES = {"config":{"domaine_nom":"Domaine des Grandes Vignes","lat":47.22,"lon":4.97,"onboarding_done":true,"gnr":{"capacite":2000,"niveau":650,"seuil":300,"maj":"2026-10-02"}},"membres":[{"nom":"Marie","roles":["admin","ouvrier","tractoriste"],"couleur":"#3D6B27","statut":"actif"},{"nom":"Jean","roles":["ouvrier","tractoriste"],"couleur":"#1A4A7A","statut":"actif"},{"nom":"Sophie","roles":["ouvrier"],"couleur":"#7A4F2E","statut":"actif"},{"nom":"Paul","roles":["ouvrier","tractoriste"],"couleur":"#5B2D8E","statut":"actif"}],"saisons":[{"nom":"Printemps 2026","periode":"Mars — Juillet 2026","active":true,"taches":["Ebourgeonnage","Relevage","Accolage","Pioche","Palissage"]},{"nom":"Hiver 2025-2026","periode":"Nov. 2025 — Fév. 2026","active":false,"taches":["Taille","Tirage","Brulage"]}],"taches":[{"nom":"Taille","hha":70,"saison":"Hiver"},{"nom":"Tirage","hha":40,"saison":"Hiver"},{"nom":"Brulage","hha":40,"saison":"Hiver"},{"nom":"Ebourgeonnage","hha":35,"saison":"Printemps"},{"nom":"Relevage","hha":50,"saison":"Printemps"},{"nom":"Accolage","hha":50,"saison":"Printemps"},{"nom":"Pioche","hha":40,"saison":"Printemps"},{"nom":"Palissage","hha":50,"saison":"Printemps"}],"parcelles":[{"nom":"Clos du Moulin","surface":0.45,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"Les Charmes","surface":1.2,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":null,"n3":null,"ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":"Valide","ov":null},"Palissage":null}},{"nom":"Vieilles Vignes","surface":0.8,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}},{"nom":"Les Perrières","surface":1.05,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":"Valide"},"Relevage":{"n1":"Valide","n2":"Valide","n3":null,"ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"Champ de la Croix","surface":0.62,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"En Bertrange","surface":0.9,"statut":"Active","taches":{"Ebourgeonnage":{"p1":null,"p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}},{"nom":"La Combotte","surface":1.5,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":"Valide","n3":"Valide","ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":"Valide","ov":null},"Palissage":null}},{"nom":"Aux Murgers","surface":0.5,"statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}}],"conducteurs":[{"nom":"Marie"},{"nom":"Jean"},{"nom":"Paul"}],"activites":[{"nom":"Griffage"},{"nom":"Buttage"},{"nom":"Intercep"},{"nom":"Traitement"},{"nom":"Broyage"}]};

// ── 2. PETITS OUTILS ─────────────────────────────────────────────────────────────────────────────
function _avale(e, ou) { if (window._mvAvale) window._mvAvale(e, 'tutos.js/' + ou); }
function _q(s) { try { return document.querySelector(s); } catch (e) { _avale(e, '_q'); return null; } }
function _txt(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
// Le texte À L'ÉCRAN de ce qu'on montre : la consigne cite le vrai libellé, jamais une copie.
function L(sel) { return _txt(_q(sel)); }
function _vis(el) {
  if (!el || !el.getClientRects().length) return false;
  var r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  var cs = window.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
}
function _tactile() { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); }
// « Touchez » au doigt, « Cliquez » à la souris : la consigne suit l'appareil.
function _V() { return _tactile() ? 'Touchez' : 'Cliquez'; }
function _v() { return _tactile() ? 'touchez' : 'cliquez'; }
function _esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function _num(x) { var n = parseFloat(String(x == null ? '' : x).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : NaN; }
function _nb(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR'); }
function _ouvert(id) { var o = document.getElementById(id); return !!(o && o.classList.contains('open')); }
function _gnr() { var c = window.CONFIG || {}; return c.gnr || { capacite: 0, niveau: 0 }; }
function _ic(n, t) { return window._mvIcon ? window._mvIcon(n, t || 18) : ''; }
function _page() { var p = _q('.page.active'); return p ? String(p.id || '').replace(/^page-/, '') : ''; }
function _tuto(id) { for (var i = 0; i < TU_TUTOS.length; i++) { if (TU_TUTOS[i].id === id) return TU_TUTOS[i]; } return null; }
function _permis(t) {
  if (!t) return false;
  if (t.pour === 'tous') return true;
  var u = window.currentUser || {}, r = u.roles || [];
  if (r.indexOf('admin') >= 0) return true;
  return r.indexOf(t.pour) >= 0;
}
// Dans la fenêtre « Équipes du jour », une personne = son nom + sa rangée de choix.
function _zoneEquipe(chip) {
  var pk = chip && chip.parentNode;
  if (!pk) return [];
  var nom = pk.previousElementSibling;
  return nom ? [nom, pk] : [pk];
}

// ── 3. LES TUTOS ─────────────────────────────────────────────────────────────────────────────────
// Une étape = un geste. Types : toucher · choisir · taper · regarder · aller (le chemin vers un
// module, CALCULÉ à l'affichage depuis le vrai dock ou la vraie barre).
// `fait` : l'écran a-t-il vraiment changé ? · `{T}` devient « Touchez » ou « Cliquez ».
// `couvre` : les fonctions de l'appli que le tuto enseigne (le harnais vérifie qu'elles existent).
var TU_TUTOS = [
  { id: 'equipes', titre: 'Comment faire pour indiquer les équipes du jour\u00a0?', fin: 'indiquer les équipes du jour',
    module: 'Vigne', pages: ['home'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openEqJour', '_mvEqPick', 'saveEqJour'],
    avant: function (memo) { memo.eqj0 = L('#home-eqj-txt'); },
    retenir: ['Accueil › pastille « Équipes du jour ».',
              'Une équipe par personne. « Aucune » garde ses heures pour ses propres validations.',
              '« Enregistrer pour aujourd’hui » vaut jusqu’à ce soir.'],
    etapes: [
      { type: 'toucher', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'Vous commencez sur l’Accueil. Les équipes du jour se règlent ici, sous la tâche prioritaire. {T} la pastille « ' + (L('[data-tuto="home.eqj"]').split(':')[0].trim() || 'Équipes du jour') + ' ».'; },
        fait: function () { return _ouvert('ovEqJour'); },
        ok: 'La fenêtre des équipes s’est ouverte.' },
      { type: 'choisir', options: ['[data-eqj-n="Jean"][data-eqj-k="1"]', '[data-eqj-n="Sophie"][data-eqj-k="1"]'], zone: _zoneEquipe,
        txt: function () { return 'Mettez Jean et Sophie dans « ' + L('[data-eqj-n="Jean"][data-eqj-k="1"]') + ' ».'; },
        txtReel: 'choisissez l’équipe de chacun.', cibleReel: '#eqj-rows',
        reel: function () { return _ouvert('ovEqJour') && !!_q('#eqj-rows .pchk.sel:not([data-eqj-k="0"])'); },
        ok: 'Jean et Sophie travailleront ensemble aujourd’hui.' },
      { type: 'choisir', options: ['[data-eqj-n="Paul"][data-eqj-k="2"]'], zone: _zoneEquipe,
        txt: function () { return 'Paul part seul au tracteur : mettez-le dans « ' + L('[data-eqj-n="Paul"][data-eqj-k="2"]') + ' ». Marie reste sur « ' + L('[data-eqj-n="Marie"][data-eqj-k="0"]') + ' » : ses heures iront à ses propres validations.'; },
        txtReel: 'une équipe par personne ; « Aucune » garde ses heures pour ses propres validations.', cibleReel: '#eqj-rows',
        reel: function () { return _ouvert('ovEqJour') && !!_q('#eqj-rows .pchk.sel:not([data-eqj-k="0"])'); },
        ok: 'Paul a son équipe à lui.' },
      { type: 'toucher', cible: '[data-tuto="eqj.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="eqj.save"]') + ' ».'; },
        fait: function () { return !_ouvert('ovEqJour') && /Jean/.test(L('#home-eqj-txt')); },
        reel: function (memo) { return !_ouvert('ovEqJour') && L('#home-eqj-txt') !== memo.eqj0; },
        ok: 'C’est enregistré : le message vert le confirme.' },
      { type: 'regarder', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'La pastille dit maintenant « ' + L('#home-eqj-txt') + ' ». Chacun valide avec son équipe, sans pouvoir la changer. Demain, rien n’est réglé : tout le monde travaille ensemble.'; } }
    ] },
  { id: 'gnr', titre: 'Comment faire pour noter un plein de GNR\u00a0?', fin: 'noter un plein de GNR',
    module: 'Tracteur', pages: ['tracteur'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openGnrAppoint', 'saveGnrAppoint'],
    retenir: ['Tracteur › onglet Entretien.',
              '« Appoint de cuve » : les litres, et le prix s’il est sur la facture.',
              '« Enregistrer l’appoint » : la cuve remonte, le coût du GNR suit.'],
    avant: function (memo) { memo.gnr0 = _gnr().niveau; },
    etapes: [
      { type: 'aller', page: 'tracteur', pourquoi: 'Le plein de la cuve se note dans le module Tracteur.' },
      { type: 'toucher', cible: '[data-tuto="trac.entretien"]',
        txt: function () { return '{T} l’onglet « ' + L('[data-tuto="trac.entretien"]') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="trac.entretien"]'); return !!(b && b.classList.contains('active')); },
        ok: 'Voici l’entretien : la cuve GNR y a sa carte.' },
      { type: 'toucher', cible: '[data-tuto="gnr.appoint"]',
        txt: function () { var g = _gnr(); return 'La cuve est à ' + _nb(g.niveau) + ' litres sur ' + _nb(g.capacite) + '. {T} « ' + L('[data-tuto="gnr.appoint"]') + ' ».'; },
        fait: function () { return !!_q('[data-tuto="gnr.litres"]'); },
        ok: 'Le formulaire d’appoint est ouvert.' },
      { type: 'taper', cible: '[data-tuto="gnr.litres"]', exemple: '800',
        txt: function () { return 'Tapez les litres livrés, par exemple 800.'; }, txtReel: 'les litres de votre bon de livraison.',
        valide: function (x) { var n = _num(x); return n > 0 && n <= 20000; },
        ok: function (x) { return _nb(_num(x)) + ' litres : c’est noté.'; } },
      { type: 'taper', facultatif: true, cible: '[data-tuto="gnr.prix"]', exemple: '1.24',
        txt: function () { return 'Le prix du litre est sur la facture : tapez-le, par exemple 1,24. Vous ne l’avez pas ? Passez.'; }, txtReel: 'le prix du litre de votre facture, si vous l’avez.',
        valide: function (x) { var n = _num(x); return n > 0 && n < 10; },
        ok: function () { return 'Ce prix ira dans le coût du GNR, au Pilotage.'; } },
      { type: 'toucher', cible: '[data-tuto="gnr.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="gnr.save"]') + ' ».'; },
        fait: function (memo) { return !_q('[data-tuto="gnr.litres"]') && _gnr().niveau > (memo.gnr0 || 0); },
        ok: 'Le message vert confirme l’appoint.' },
      { type: 'regarder', cible: '[data-tuto="gnr.carte"]',
        txt: function () { var g = _gnr(); return 'La cuve remonte à ' + _nb(g.niveau) + ' litres sur ' + _nb(g.capacite) + '. Sur votre domaine, rien n’a bougé : c’était un entraînement.'; } }
    ] }
];

// ── 4. L'ALLURE : les jetons de l'appli, rien en dur sauf le voile ───────────────────────────────
var _PF = 'Outfit,system-ui,-apple-system,sans-serif';
var _MAIN_SVG = '<svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path style="fill:var(--or-clair);stroke:var(--cave)" stroke-width="2" stroke-linejoin="round" d="M19 6.5a3.5 3.5 0 0 1 7 0V21l1.2-.4a3.4 3.4 0 0 1 4.3 2l.1.3.9-.3a3.4 3.4 0 0 1 4.3 2.2l.1.3.6-.2a3.3 3.3 0 0 1 4.1 2.3l.2.7c1.3 4.6.6 9.6-2 13.6L39 43H20.5l-7.8-10.3a3.6 3.6 0 0 1 .5-4.9 3.6 3.6 0 0 1 4.8.1l1 1Z"/></svg>';
function _css() {
  if (document.getElementById('mvtu-css')) return;
  var tr = 'left var(--mv-d2,240ms) var(--mv-sortie,ease),top var(--mv-d2,240ms) var(--mv-sortie,ease),width var(--mv-d2,240ms) var(--mv-sortie,ease),height var(--mv-d2,240ms) var(--mv-sortie,ease)';
  var s = document.createElement('style');
  s.id = 'mvtu-css';
  s.textContent = [
    '.mvtu-m{position:fixed;left:0;top:0;width:0;height:0;z-index:100010;background:rgba(10,8,5,.72);transition:' + tr + '}',
    '.mvtu-ring{position:fixed;left:0;top:0;width:0;height:0;z-index:100011;border:2px solid var(--or-clair);border-radius:var(--r-md,12px);pointer-events:none;opacity:0;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 0 18px rgba(216,188,114,.45);transition:' + tr + ',opacity var(--mv-d1,140ms)}',
    '.mvtu-ring.attend{animation:mvtuPouls 1.7s ease-in-out infinite}',
    '.mvtu-ring.bon{border-color:var(--vert-med);animation:none}',
    '.mvtu-ring.fort{animation:mvtuFort .5s ease-in-out 2}',
    '@keyframes mvtuPouls{0%,100%{box-shadow:0 0 0 1px rgba(0,0,0,.25),0 0 12px rgba(216,188,114,.3)}50%{box-shadow:0 0 0 5px rgba(216,188,114,.22),0 0 30px rgba(216,188,114,.6)}}',
    '@keyframes mvtuFort{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}',
    '.mvtu-main{position:fixed;left:0;top:0;z-index:100017;width:44px;height:44px;pointer-events:none;opacity:0;filter:drop-shadow(0 3px 6px rgba(0,0,0,.45));transition:left var(--mv-d2,240ms) var(--mv-sortie,ease),top var(--mv-d2,240ms) var(--mv-sortie,ease),opacity var(--mv-d1,140ms)}',
    '.mvtu-main svg{display:block;animation:mvtuTape 1.15s ease-in-out infinite;transform-origin:20px 4px}',
    '.mvtu-main.fantome{transition:left .7s var(--mv-sortie,ease),top .7s var(--mv-sortie,ease),opacity var(--mv-d1,140ms)}',
    '.mvtu-main.fantome svg{animation:none}',
    '.mvtu-main.appuie svg{animation:mvtuAppui .32s ease-in-out}',
    '@keyframes mvtuTape{0%,100%{transform:translate(0,0) scale(1)}45%{transform:translate(-2px,-6px) scale(.93)}}',
    '@keyframes mvtuAppui{0%,100%{transform:scale(1)}50%{transform:scale(.82)}}',
    '.mvtu-cadre{position:fixed;inset:0;z-index:100012;pointer-events:none;box-shadow:inset 0 0 0 3px var(--acier)}',
    '.mvtu-tag{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:100016;padding:4px 12px;border-radius:999px;background:var(--cave);color:var(--or-clair);font:600 var(--pt-micro,12px)/1.3 ' + _PF + ';pointer-events:none;white-space:nowrap}',
    '.mvtu-coach{position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:100015;max-width:560px;margin:0 auto;padding:12px 14px 14px;border-radius:var(--r-lg,16px);border:1px solid var(--gris);background:var(--bg-card);color:var(--texte);box-shadow:var(--shadow-lg,0 14px 56px rgba(0,0,0,.5));font-family:' + _PF + ';transition:top var(--mv-d3,420ms) var(--mv-sortie,ease),bottom var(--mv-d3,420ms) var(--mv-sortie,ease)}',
    '.mvtu-coach.haut{top:calc(env(safe-area-inset-top,0px) + 36px);bottom:auto}',
    '.mvtu-coach.secoue{animation:mvtuSecoue .4s}',
    '@keyframes mvtuSecoue{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}',
    '.mvtu-hd{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.mvtu-n{font-size:var(--pt-micro,12px);font-weight:600;color:var(--texte-doux)}',
    '.mvtu-dots{display:flex;gap:4px;margin-right:auto}',
    '.mvtu-dots i{width:6px;height:6px;border-radius:3px;background:var(--gris)}',
    '.mvtu-dots i.f{background:var(--vert-med)}',
    '.mvtu-dots i.on{width:16px;background:var(--or-clair)}',
    '.mvtu-x{display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 8px;border:0;border-radius:10px;background:transparent;color:var(--texte-doux);font:600 var(--pt-micro,12px) ' + _PF + ';cursor:pointer}',
    '.mvtu-tx{margin:4px 0 0;font-size:var(--pt-sm,17px);line-height:1.38;font-weight:500}',
    '.mvtu-msg{display:none;align-items:flex-start;gap:7px;margin:8px 0 0;font-size:var(--pt-base,14px);line-height:1.35;font-weight:500}',
    '.mvtu-msg.on{display:flex}',
    '.mvtu-msg.ok{color:var(--vert-med)}',
    '.mvtu-msg.info{color:var(--orange)}',
    '.mvtu-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    '.mvtu-act:empty{display:none}',
    '.mvtu-b1,.mvtu-b2,.mvtu-b3{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:0 16px;border-radius:12px;font:600 var(--pt-base,14px) ' + _PF + ';cursor:pointer}',
    '.mvtu-b1{flex:1;border:0;background:var(--btn-pri,var(--vert-med));color:var(--btn-pri-tx,var(--blanc))}',
    '.mvtu-b1:disabled{opacity:.4;cursor:default}',
    '.mvtu-b2{border:1.5px solid var(--gris);background:transparent;color:var(--texte)}',
    '.mvtu-b3{border:0;background:transparent;color:var(--texte-doux);text-decoration:underline;text-underline-offset:3px}',
    '.mvtu-large{width:100%;margin-top:8px}',
    '.mvtu-tire{animation:mvtuInvite 1.3s ease-in-out infinite}',
    '@keyframes mvtuInvite{0%,100%{box-shadow:0 0 0 0 rgba(216,188,114,0)}50%{box-shadow:0 0 0 6px rgba(216,188,114,.3)}}',
    'body.mvtu-on #mv-toast{z-index:100020!important}',
    '.mvtu-fin{position:fixed;inset:0;z-index:100030;display:flex;align-items:flex-end;background:rgba(10,8,5,.55)}',
    '.mvtu-fin-in{width:100%;max-width:560px;max-height:92%;overflow:auto;margin:0 auto;padding:18px 18px calc(env(safe-area-inset-bottom,0px) + 22px);border-radius:22px 22px 0 0;background:var(--bg-card);color:var(--texte);font-family:' + _PF + '}',
    '.mvtu-fin h2{margin:8px 0 4px;font:600 var(--pt-lg,23px)/1.2 \'Cormorant Garamond\',Georgia,serif}',
    '.mvtu-fin ol{margin:6px 0 14px;padding-left:20px;font-size:var(--pt-base,14px);line-height:1.5;color:var(--texte-doux)}',
    '.mvtu-fin-ic{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--vert-pale);color:var(--vert-med)}',
    '.mvtu-aide{margin:2px 0 12px;padding:8px 12px 10px;border-radius:var(--r-lg,16px);background:var(--or-pale)}',
    '.mvtu-aide h4{display:flex;align-items:center;gap:8px;margin:6px 0 4px;font-size:var(--pt-base,14px);font-weight:600}',
    '.mvtu-aide p{margin:4px 0 8px;font-size:var(--pt-micro,12px);line-height:1.45;color:var(--texte-doux)}',
    '.mvtu-row{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:8px 0;border:0;border-top:1px solid var(--gris-clair);background:none;color:var(--texte);text-align:left;font:500 var(--pt-base,14px) ' + _PF + ';cursor:pointer}',
    '.mvtu-row > span{flex:1;min-width:0}',
    '.mvtu-row small{display:block;margin-top:2px;font-size:var(--pt-micro,12px);font-weight:400;color:var(--texte-doux)}',
    '.mvtu-tous{display:inline-flex;align-items:center;gap:4px;min-height:44px;padding:0;border:0;background:none;color:var(--or);font:600 var(--pt-base,14px) ' + _PF + ';cursor:pointer}',
    '.mvtu-mod{margin:14px 0 2px;font-size:var(--pt-micro,12px);font-weight:600;color:var(--texte-doux)}',
    '.mvtu-panneau{position:fixed;top:12px;bottom:12px;right:12px;width:min(420px,calc(100vw - 24px));z-index:100005;display:flex;flex-direction:column;overflow:hidden;border-radius:var(--r-lg,16px);border:1px solid var(--gris);background:var(--bg-card);box-shadow:var(--shadow-lg,0 14px 56px rgba(0,0,0,.5))}',
    '.mvtu-anneau{position:fixed;left:0;top:0;width:0;height:0;z-index:100004;border:2px solid var(--or-clair);border-radius:var(--r-md,12px);pointer-events:none;opacity:0;box-shadow:0 0 0 1px rgba(0,0,0,.2),0 0 16px rgba(216,188,114,.45);animation:mvtuPouls 1.7s ease-in-out infinite;transition:opacity var(--mv-d1,140ms)}',
    '.mvtu-reel{margin:6px 0 0;padding:6px 10px;border-radius:10px;background:var(--or-pale);font-size:var(--pt-base,14px);line-height:1.35}',
    '.mvtu-p-hd{display:flex;align-items:center;gap:6px;min-height:46px;padding:0 8px 0 14px;background:var(--cave);color:var(--or-clair);font:600 var(--pt-base,14px) ' + _PF + '}',
    '.mvtu-p-hd span{margin-right:auto}',
    '.mvtu-p-b{display:inline-flex;align-items:center;gap:4px;min-height:36px;padding:0 10px;border-radius:9px;border:1px solid rgba(232,210,148,.35);background:transparent;color:var(--or-clair);font:600 var(--pt-micro,12px) ' + _PF + ';cursor:pointer}',
    '.mvtu-p-if{flex:1;width:100%;border:0;background:var(--bg-app)}',
    '@media (prefers-reduced-motion:reduce){.mvtu-m,.mvtu-ring,.mvtu-main,.mvtu-coach{transition:none!important;animation:none!important}.mvtu-main svg,.mvtu-tire,.mvtu-ring.attend{animation:none!important}}'
  ].join('\n');
  document.head.appendChild(s);
}

// ── 5. LE MOTEUR ─────────────────────────────────────────────────────────────────────────────────
var E = { actif: false, t: null, i: 0, etat: 'attente', debut: 0, montre: false, rates: 0, valeur: '', memo: {}, perdu: 0, navCle: '', faits: 0 };
var D = {};
var GEO = {};
function _e() { return E.t ? E.t.etapes[E.i] : null; }
function _etat(champ, val) {
  var s = window.__MV_TUTO_ETAT || (window.__MV_TUTO_ETAT = { id: '', etape: 0, total: 0, fini: false, erreur: null });
  if (E.t) { s.id = E.t.id; s.etape = Math.min(E.i + 1, E.t.etapes.length); s.total = E.t.etapes.length; }
  s.bloques = window.__MV_TUTO_BLOQUES || 0;
  if (champ) s[champ] = val;
}
function _div(cls, html) { var d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; document.body.appendChild(d); return d; }
function _couches() {
  if (D.coach) return;
  _css();
  D.m = [];
  for (var i = 0; i < 4; i++) { var m = _div('mvtu-m'); m.addEventListener('click', _aCote); D.m.push(m); }
  D.ring = _div('mvtu-ring');
  D.cadre = _div('mvtu-cadre');
  D.tag = _div('mvtu-tag', 'Entraînement : rien n’est enregistré');
  D.coach = _div('mvtu-coach');
  D.coach.setAttribute('role', 'dialog');
  D.coach.setAttribute('aria-label', 'Consigne du tuto');
  D.coach.addEventListener('click', _coachClic);
  D.main = _div('mvtu-main', _MAIN_SVG);
  document.body.classList.add('mvtu-on');
}
function _pose(el, k, x, y, w, h) {
  var s = Math.round(x) + ',' + Math.round(y) + ',' + Math.round(w) + ',' + Math.round(h);
  if (GEO[k] === s) return;
  GEO[k] = s;
  el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
  el.style.width = Math.max(0, Math.round(w)) + 'px'; el.style.height = Math.max(0, Math.round(h)) + 'px';
}
// Le chemin vers un module se CALCULE : barre de gauche (ordinateur), dock (téléphone), ou « Plus ».
function _nav(page) {
  var b = _q('#mv-rail .mv-rail-b[data-page="' + page + '"]');
  if (_vis(b)) return { el: b, ou: 'dans la barre de gauche', lib: b.getAttribute('aria-label') || _txt(b) };
  b = _q('#mv-dock-inner .mv-dk[data-page="' + page + '"]');
  if (_vis(b)) return { el: b, ou: 'en bas de l’écran', lib: _txt(b.querySelector('.mv-dk-lb')) || _txt(b) };
  var sh = _q('#mv-dock-sheet'), it = _q('#mv-dock-sheet .mv-sg[data-page="' + page + '"]');
  if (it && sh && sh.classList.contains('show') && _vis(it)) return { el: it, ou: '', lib: _txt(it.querySelector('.mv-sg-lb')) || _txt(it) };
  var p = _q('#mv-dock-inner .mv-dk[data-plus]');
  if (_vis(p)) {
    var d = window._dockDef ? window._dockDef() : [], vers = page;
    for (var i = 0; i < d.length; i++) { if (d[i].p === page) vers = d[i].l; }
    return { el: p, ou: 'en bas de l’écran', lib: _txt(p.querySelector('.mv-dk-lb')) || 'Plus', plus: true, vers: vers };
  }
  return null;
}
function _pageActive(page) { var pg = document.getElementById('page-' + page); return !!(pg && pg.classList.contains('active')); }
function _optCourante() {
  var e = _e();
  for (var i = 0; i < e.options.length; i++) { var el = _q(e.options[i]); if (!el || !el.classList.contains('sel')) return e.options[i]; }
  return null;
}
function _zone() {
  var e = _e(); if (!e) return [];
  if (e.type === 'choisir') { var o = _optCourante(), el = o ? _q(o) : null; return el ? (e.zone ? e.zone(el) : [el]) : []; }
  if (e.type === 'aller') { var n = _nav(e.page); return n ? [n.el] : []; }
  var c = _q(e.cible); return c ? [c] : [];
}
function _pointe() {
  var e = _e(); if (!e || E.etat !== 'attente' || e.type === 'regarder') return null;
  if (e.type === 'choisir') { var o = _optCourante(); return o ? _q(o) : null; }
  if (e.type === 'aller') { var n = _nav(e.page); return n ? n.el : null; }
  if (e.type === 'taper') { var inp = _q(e.cible); if (inp && e.valide(inp.value)) return D.coach.querySelector('[data-c="suite"]'); return inp; }
  return _q(e.cible);
}
function _union(els) {
  var r = null;
  els.forEach(function (el) {
    if (!_vis(el)) return;
    var b = el.getBoundingClientRect();
    if (!r) r = { l: b.left, t: b.top, r: b.right, b: b.bottom };
    else { r.l = Math.min(r.l, b.left); r.t = Math.min(r.t, b.top); r.r = Math.max(r.r, b.right); r.b = Math.max(r.b, b.bottom); }
  });
  return r;
}
function _place() {
  var W = window.innerWidth, H = window.innerHeight, u = _union(_zone());
  var vv = window.visualViewport, clavier = !!(vv && (window.innerHeight - vv.height) > 140);
  if (!u) {
    _pose(D.m[0], 'm0', 0, 0, W, H); _pose(D.m[1], 'm1', 0, H, W, 0); _pose(D.m[2], 'm2', 0, 0, 0, 0); _pose(D.m[3], 'm3', W, 0, 0, 0);
    D.ring.style.opacity = '0'; if (!E.montre) D.main.style.opacity = '0';
    return false;
  }
  var pad = 6, x = u.l - pad, y = u.t - pad, w = (u.r - u.l) + 2 * pad, h = (u.b - u.t) + 2 * pad;
  _pose(D.m[0], 'm0', 0, 0, W, Math.max(0, y));
  _pose(D.m[1], 'm1', 0, y + h, W, Math.max(0, H - (y + h)));
  _pose(D.m[2], 'm2', 0, y, Math.max(0, x), h);
  _pose(D.m[3], 'm3', x + w, y, Math.max(0, W - (x + w)), h);
  _pose(D.ring, 'ring', x, y, w, h); D.ring.style.opacity = '1';
  var haut = clavier || ((u.t + u.b) / 2 > H * 0.5);
  if (D.coach.classList.contains('haut') !== haut) D.coach.classList.toggle('haut', haut);
  if (clavier) D.coach.style.top = Math.max(36, vv.offsetTop + 36) + 'px'; else if (D.coach.style.top) D.coach.style.top = '';
  if (!E.montre) {
    var p = _pointe();
    if (p && _vis(p)) {
      var pr = p.getBoundingClientRect();
      D.main.style.left = Math.round(pr.left + Math.min(pr.width * 0.55, pr.width - 14) - 20) + 'px';
      D.main.style.top = Math.round(pr.top + pr.height * 0.62 - 3) + 'px';
      D.main.style.opacity = '1';
    } else D.main.style.opacity = '0';
  }
  return true;
}
function _assureVisible(el) {
  if (!el || el.closest('#mv-dock') || el.closest('#mv-rail')) return;
  var r = el.getBoundingClientRect(), H = window.innerHeight;
  if (r.top < 60 || r.bottom > H - 210) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { _avale(e, '_assureVisible'); el.scrollIntoView(); } }
}

// ── 6. LA CONSIGNE ───────────────────────────────────────────────────────────────────────────────
function _texte(e) {
  var s;
  if (e.type === 'aller') {
    var n = _nav(e.page), avant = e.pourquoi ? e.pourquoi + ' ' : '';
    if (n && n.plus) s = avant + '{T} « ' + n.lib + ' », ' + n.ou + ' : le module « ' + n.vers + ' » s’y trouve.';
    else s = avant + '{T} « ' + (n ? n.lib : e.page) + ' »' + (n && n.ou ? ', ' + n.ou : '') + '.';
  } else s = e.txt();
  return _esc(s).replace(/\{T\}/g, _V());
}
function _coach() {
  var e = _e(), n = E.t.etapes.length, d = '';
  for (var k = 0; k < n; k++) d += '<i class="' + (k < E.i ? 'f' : (k === E.i ? 'on' : '')) + '"></i>';
  var montre = e.type !== 'regarder', suite = (e.type === 'regarder' || e.type === 'taper');
  D.coach.innerHTML = '<div class="mvtu-hd"><span class="mvtu-n">Étape ' + (E.i + 1) + ' sur ' + n + '</span><span class="mvtu-dots" aria-hidden="true">' + d + '</span>'
    + '<button type="button" class="mvtu-x" data-c="quitter">' + _ic('croix', 16) + 'Quitter</button></div>'
    + '<p class="mvtu-tx">' + _texte(e) + '</p>'
    + ((_cadre() && e.txtReel) ? '<p class="mvtu-reel">Sur votre domaine : ' + _esc(e.txtReel) + '</p>' : '')
    + '<p class="mvtu-msg" aria-live="polite"></p>'
    + '<div class="mvtu-act">'
    + (montre ? '<button type="button" class="mvtu-b2" data-c="montre">' + _ic('doigt', 17) + 'Montre-moi</button>' : '')
    + (e.facultatif ? '<button type="button" class="mvtu-b3" data-c="passer">Passer</button>' : '')
    + (suite ? '<button type="button" class="mvtu-b1" data-c="suite"' + (e.type === 'taper' ? ' disabled' : '') + '>' + (E.i === n - 1 ? 'Terminer' : 'Continuer') + '</button>' : '')
    + '</div>';
}
function _msg(genre, txt) {
  var m = D.coach && D.coach.querySelector('.mvtu-msg'); if (!m) return;
  if (!genre || !txt) { m.className = 'mvtu-msg'; m.innerHTML = ''; return; }
  m.className = 'mvtu-msg on ' + genre;
  m.innerHTML = _ic(genre === 'ok' ? 'check' : 'info', 17) + '<span>' + _esc(txt) + '</span>';
}
function _vide() { var a = D.coach && D.coach.querySelector('.mvtu-act'); if (a) a.innerHTML = ''; }
function _coachClic(ev) {
  var b = ev.target.closest('[data-c]'); if (!b) return;
  var c = b.getAttribute('data-c');
  if (c === 'quitter') _demandeQuitter();
  else if (c === 'montre') _montreMoi();
  else if (c === 'passer') _passer();
  else if (c === 'suite') _confirme();
  else if (c === 'reprendre') _reprendre();
  else if (c === 'sortir') _sortir();
}

// ── 7. LES ÉTAPES ────────────────────────────────────────────────────────────────────────────────
function _montrer() {
  var e = _e();
  E.etat = 'attente'; E.valeur = ''; E.rates = 0; E.debut = Date.now(); E.perdu = 0; E.navCle = ''; E.faits = 0;
  _coach();
  var z = _zone(); if (z.length) _assureVisible(z[0]);
  D.ring.className = 'mvtu-ring attend';
  _etat();
  if (window.__MV_TUTO_AUTO) {
    setTimeout(function () { if (E.actif && E.etat === 'attente' && _e() === e) { if (e.type === 'regarder') _confirme(); else _montreMoi(); } }, 700);
  }
  // TUTO-3 : la fenêtre dit à l'appli où elle en est ; si le domaine a déjà fait plus loin, elle rattrape.
  _dire({ mvtu: 'etape', id: E.t.id, i: E.i });
  if (E.miroirJusqua >= E.i) setTimeout(_jouerMiroir, 450);
}
function _verifie() {
  var e = _e(); if (!e || E.etat !== 'attente') return;
  if (e.type === 'toucher') { if (e.fait(E.memo)) _reussi(); return; }
  if (e.type === 'aller') { if (_pageActive(e.page)) _reussi(); return; }
  if (e.type === 'choisir') {
    var reste = _optCourante();
    if (!reste) { _reussi(); return; }
    var faits = e.options.indexOf(reste);
    if (faits > E.faits) {
      E.faits = faits;
      var el = _q(reste), z = (el && e.zone) ? e.zone(el) : [];
      _msg('ok', 'C’est fait. Maintenant : ' + (z.length > 1 ? _txt(z[0]) : _txt(el)) + '.');
    }
  }
}
function _reussi() {
  var e = _e(); E.etat = 'ok';
  var m = typeof e.ok === 'function' ? e.ok(E.valeur) : (e.ok || (e.type === 'aller' ? 'Vous y êtes.' : ''));
  if (m) _msg('ok', m);
  D.ring.className = 'mvtu-ring bon';
  _vide();
  var suiv = E.t.etapes[E.i + 1];
  if (e.type === 'taper' && (!suiv || suiv.type !== 'taper')) { var inp = _q(e.cible); if (inp) inp.blur(); }
  setTimeout(function () { if (E.actif && E.etat === 'ok') _suivant(); }, e.type === 'taper' ? 900 : 1200);
}
function _suivant() { E.i++; if (E.i >= E.t.etapes.length) { _fin(); return; } _montrer(); }
function _confirme() {
  var e = _e(); if (!e || E.etat !== 'attente') return;
  if (e.type === 'regarder') { _suivant(); return; }
  if (e.type === 'taper') {
    var c = _q(e.cible), val = c ? c.value : E.valeur;
    if (e.valide(val)) { E.valeur = val; _reussi(); }
    else _indice(e.facultatif ? 'Tapez une valeur, ou passez.' : 'Tapez un nombre, par exemple ' + String(e.exemple).replace('.', ',') + '.');
  }
}
function _passer() {
  var e = _e(); if (!e || !e.facultatif || E.etat !== 'attente') return;
  var c = _q(e.cible); if (c) c.value = '';
  E.etat = 'ok'; _msg('ok', 'Étape passée : le champ reste vide.'); _vide();
  setTimeout(function () { if (E.actif) _suivant(); }, 700);
}
function _indice(txt) {
  _msg('info', txt);
  D.coach.classList.remove('secoue'); void D.coach.offsetWidth; D.coach.classList.add('secoue');
  D.ring.classList.remove('fort'); void D.ring.offsetWidth; D.ring.classList.add('fort');
  E.rates++;
  if (E.rates >= 2) { var mm = D.coach.querySelector('[data-c="montre"]'); if (mm) mm.classList.add('mvtu-tire'); }
}
// Toucher dans le voile : on explique, on ne casse rien. Pendant que l'écran défile vers la cible, ce n'est pas une erreur.
function _aCote() {
  var e = _e();
  if (!E.actif || !e || E.etat !== 'attente' || Date.now() - E.debut < 700) return;
  if (e.type === 'regarder') { _indice('Lisez, puis ' + _v() + ' « ' + (E.i === E.t.etapes.length - 1 ? 'Terminer' : 'Continuer') + ' ».'); return; }
  _indice(e.type === 'taper' ? 'Pas ici : ' + _v() + ' le champ dans le cadre doré.' : 'Pas ici : ' + _v() + ' ce qui est dans le cadre doré.');
}
// Un choix à côté, DANS le cadre (une autre équipe) : l'appli le prend, la consigne recadre.
function _surClic(ev) {
  var e = _e(); if (!E.actif || !e || e.type !== 'choisir' || E.etat !== 'attente') return;
  var o = _optCourante(), att = o ? _q(o) : null; if (!att || att.contains(ev.target)) return;
  var dedans = _zone().some(function (z) { return z.contains(ev.target); });
  if (dedans) _indice('Pour l’entraînement : « ' + _txt(att) + ' ».');
}
function _surSaisie(ev) {
  var e = _e(); if (!E.actif || !e || e.type !== 'taper' || E.etat !== 'attente') return;
  var c = _q(e.cible); if (!c || ev.target !== c) return;
  E.valeur = c.value;
  var ok = e.valide(c.value), b = D.coach.querySelector('[data-c="suite"]');
  if (b) { b.disabled = !ok; b.classList.toggle('mvtu-tire', ok); }
  if (!ok && String(c.value).trim()) _msg('info', 'Par exemple ' + String(e.exemple).replace('.', ',') + '.');
  else _msg('', '');
}
function _surTouche(ev) {
  if (ev.key !== 'Enter') return;
  var e = _e(); if (!E.actif || !e || e.type !== 'taper') return;
  var c = _q(e.cible); if (c && ev.target === c) { ev.preventDefault(); _confirme(); }
}
function _attendre(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function _fantome(el) {
  return new Promise(function (res) {
    if (!el) { res(); return; }
    var h = D.main, b = D.coach.querySelector('[data-c="montre"]'), s = b ? b.getBoundingClientRect() : null;
    h.classList.add('fantome');
    if (s) { h.style.transition = 'none'; h.style.left = Math.round(s.left + s.width / 2 - 20) + 'px'; h.style.top = Math.round(s.top + s.height / 2 - 3) + 'px'; h.style.opacity = '1'; void h.offsetWidth; h.style.transition = ''; }
    var r = el.getBoundingClientRect();
    h.style.left = Math.round(r.left + Math.min(r.width * 0.55, r.width - 14) - 20) + 'px';
    h.style.top = Math.round(r.top + r.height * 0.62 - 3) + 'px'; h.style.opacity = '1';
    setTimeout(function () { h.classList.add('appuie'); setTimeout(function () { h.classList.remove('appuie'); res(); }, 330); }, 740);
  });
}
// « Montre-moi » fait le geste à la place de la personne — et c'est AUSSI ce qui rejoue les tutos au build.
function _montreMoi() {
  var e = _e(); if (!e || E.etat !== 'attente' || E.montre) return;
  E.montre = true;
  var fini = function () { E.montre = false; D.main.classList.remove('fantome', 'appuie'); };
  var ch = Promise.resolve();
  if (e.type === 'toucher') {
    ch = ch.then(function () { return _fantome(_q(e.cible)); }).then(function () { var t = _q(e.cible); if (t) t.click(); });
  } else if (e.type === 'aller') {
    var tour = 0;
    var va = function () { if (!E.actif || _pageActive(e.page) || tour++ > 3) return null; var n = _nav(e.page); if (!n) return null; return _fantome(n.el).then(function () { var m = _nav(e.page); if (m) m.el.click(); return _attendre(550); }).then(va); };
    ch = ch.then(va);
  } else if (e.type === 'choisir') {
    var choix = function () { var o = _optCourante(); if (!o || !E.actif) return null; return _fantome(_q(o)).then(function () { var el = _q(o); if (el) el.click(); return _attendre(450); }).then(choix); };
    ch = ch.then(choix);
  } else if (e.type === 'taper') {
    ch = ch.then(function () { return _fantome(_q(e.cible)); }).then(function () {
      var inp = _q(e.cible); if (!inp) return null;
      // Préfixe entier à chaque frappe (pas +=) : un champ nombre efface « 1. », la suite le rétablit.
      var mv = (E.miroirVal && E.miroirVal.i === E.i && e.valide(E.miroirVal.v)) ? E.miroirVal.v : null;   // TUTO-3 : la valeur tapée sur le domaine
      inp.value = ''; var s = String(mv != null ? mv : e.exemple), k = 0;
      return new Promise(function (res) { (function tape() { if (k >= s.length) { res(); return; } k++; inp.value = s.slice(0, k); inp.dispatchEvent(new Event('input', { bubbles: true })); setTimeout(tape, 140); })(); });
    }).then(function () { return _attendre(350); }).then(function () { E.montre = false; _confirme(); });
  }
  ch.then(fini, function (er) { _avale(er, '_montreMoi'); fini(); });
}
// La cible ne vient pas : l'écran a changé et ce tuto ne s'y retrouve plus. On le DIT (et le build l'a déjà vu).
function _perdu() {
  var e = _e(), quoi = e ? (e.cible || ('options ' + (e.options || []).join(' ')) || ('page ' + e.page)) : '';
  _etat('erreur', 'Étape ' + (E.i + 1) + ' : cible introuvable (' + quoi + ')');
  if (window.console) window.console.warn('[Tuto] ' + window.__MV_TUTO_ETAT.erreur);
  E.etat = 'perdu';
  _msg('info', 'Cet écran a changé et ce tuto ne s’y retrouve plus. Il va être corrigé.');
  var a = D.coach.querySelector('.mvtu-act'); if (a) a.innerHTML = '<button type="button" class="mvtu-b1" data-c="sortir">Revenir à mon domaine</button>';
}
function _demandeQuitter() {
  _msg('info', 'Quitter l’entraînement ? Rien n’a été enregistré.');
  var a = D.coach.querySelector('.mvtu-act');
  if (a) a.innerHTML = '<button type="button" class="mvtu-b2" data-c="reprendre">Reprendre</button><button type="button" class="mvtu-b1" data-c="sortir">Quitter</button>';
}
function _reprendre() {
  var e = _e(); _coach();
  if (E.etat === 'attente' && e && e.type === 'taper') { var c = _q(e.cible); if (c) _surSaisie({ target: c }); }
}
function _boucle() {
  if (E.actif) {
    var e = _e(), vu = _place();
    if (e && E.etat === 'attente') {
      if (!vu) { if (!E.perdu) E.perdu = Date.now(); else if (Date.now() - E.perdu > 12000) _perdu(); }
      else E.perdu = 0;
      _verifie();
      if (e.type === 'aller' && E.etat === 'attente') {
        var n = _nav(e.page), k = n ? (n.plus ? 'plus' : n.ou) : '';
        if (k !== E.navCle) { E.navCle = k; var tx = D.coach.querySelector('.mvtu-tx'); if (tx) tx.innerHTML = _texte(e); }
      }
    }
  }
  window.requestAnimationFrame(_boucle);
}

// ── 8. FIN, SORTIE, LANCEMENT ────────────────────────────────────────────────────────────────────
function _arrete() {
  E.actif = false;
  [D.ring, D.main, D.coach, D.cadre, D.tag].concat(D.m || []).forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
  D = {}; GEO = {};
  document.body.classList.remove('mvtu-on');
}
function _fin() {
  var t = E.t, idx = TU_TUTOS.indexOf(t), suiv = null;
  for (var i = 1; i < TU_TUTOS.length && !suiv; i++) { var c = TU_TUTOS[(idx + i) % TU_TUTOS.length]; if (c !== t && _permis(c)) suiv = c; }
  _arrete();
  _etat('fini', true);
  _dire({ mvtu: 'fini', id: t.id });
  var f = document.createElement('div');
  f.className = 'mvtu-fin';
  f.innerHTML = '<div class="mvtu-fin-in" role="dialog" aria-modal="true" aria-label="Tuto terminé">'
    + '<div class="mvtu-fin-ic">' + _ic('check', 28) + '</div>'
    + '<h2>Vous savez ' + _esc(t.fin) + '.</h2>'
    + '<ol>' + t.retenir.map(function (r) { return '<li>' + _esc(r) + '</li>'; }).join('') + '</ol>'
    + '<button type="button" class="mvtu-b1 mvtu-large" data-f="sortir">' + (_cadre() ? 'Fermer l’entraînement' : 'Revenir à mon domaine') + '</button>'
    + (suiv ? '<button type="button" class="mvtu-b2 mvtu-large" data-f="suivant" data-id="' + _esc(suiv.id) + '">Tuto suivant : ' + _esc(suiv.fin) + '</button>' : '')
    + '<button type="button" class="mvtu-b3 mvtu-large" data-f="refaire">Refaire ce tuto</button></div>';
  f.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-f]'); if (!b) return;
    var a = b.getAttribute('data-f');
    if (a === 'sortir') _sortir();
    else if (a === 'refaire') window.location.reload();
    else if (a === 'suivant') _rejouer(b.getAttribute('data-id'));
  });
  document.body.appendChild(f);
}
// ★ TUTO-2 (§359) — À CÔTÉ OU EN PLEIN ÉCRAN. Sur ordinateur, le tuto se joue dans un panneau à côté de l'appli : un
//   cadre de la même appli, en entraînement. La personne peut faire le geste pour de vrai en même temps, dans sa propre
//   session. Sur téléphone et tablette, plein écran comme avant. Le drapeau vit dans l'ADRESSE seule (?tuto=…) : la
//   mémoire de session est partagée entre l'appli et son cadre, l'entraînement n'y écrit jamais (boot.js la remplace).
function _cadre() { return !!window.__MV_TUTO_CADRE; }
function _retour() {
  var r = String(window.__MV_TUTO_RETOUR || '');
  return (r && r.charAt(0) === '/' && r.charAt(1) !== '/') ? r : window.location.pathname;
}
// Sortir : dans le panneau ou la fenêtre à part, on prévient l'appli qui l'a ouvert ; en plein écran, on recharge SANS
// ?tuto — la mémoire jetable disparaît, le vrai domaine revient tel quel.
function _sortir() {
  if (_cadre()) {
    _dire({ mvtu: 'fermer' });
    if (!(window.parent && window.parent !== window)) window.close();
    return;
  }
  window.location.replace(_retour());
}
// ★★ TUTO-3 (§360) — LE MIROIR. Dans le panneau (ou la fenêtre à part), la fenêtre d'entraînement dit à l'appli qui
//   l'a ouvert où elle en est (« etape », « fini », « fermer ») — RIEN d'autre ne part vers le vrai domaine. L'appli
//   regarde si l'étape en cours est faite sur le vrai domaine ; si oui, elle envoie « miroir » et la fenêtre joue
//   l'étape sur le domaine fictif. Un seul sens : du domaine vers la fenêtre, jamais l'inverse.
function _hote() {
  if (!_cadre()) return null;
  if (window.parent && window.parent !== window) return window.parent;
  return window.opener || null;
}
function _dire(m) {
  var h = _hote(); if (!h) return;
  try { h.postMessage(m, window.location.origin); } catch (e) { _avale(e, '_dire'); }
}
function _surMiroir(ev) {
  if (ev.origin !== window.location.origin || !ev.data || ev.data.mvtu !== 'miroir') return;
  var d = ev.data;
  if (!E.actif || d.i !== E.i) return;
  E.miroirJusqua = Math.max(typeof E.miroirJusqua === 'number' ? E.miroirJusqua : -1, typeof d.jusqua === 'number' ? d.jusqua : d.i);
  if (d.valeur != null) E.miroirVal = { i: d.i, v: String(d.valeur) };
  _jouerMiroir();
}
function _jouerMiroir() {
  var e = _e();
  if (!E.actif || !e || E.etat !== 'attente' || E.montre || !(E.miroirJusqua >= E.i)) return;
  _msg('ok', 'Fait sur votre domaine : la fenêtre suit.');
  if (e.type === 'regarder') { _confirme(); return; }
  if (e.type === 'taper' && e.facultatif && !(E.miroirVal && E.miroirVal.i === E.i)) { _passer(); return; }
  _montreMoi();
}
function _rejouer(id) {
  window.location.replace(window.location.pathname + '?tuto=' + encodeURIComponent(id) + (_cadre() ? '&tuto_cadre=1' : ''));
}
function _aCoteDispo() {
  return !!(window.matchMedia && window.matchMedia('(min-width: 1024px)').matches && !window.matchMedia('(pointer: coarse)').matches);
}
// Depuis le vrai domaine. Ordinateur : le panneau. Sinon : on note où revenir, puis on recharge en entraînement.
function _lancer(id) {
  if (!_tuto(id)) return;
  if (_aCoteDispo()) { _panneau(id); return; }
  try { sessionStorage.setItem('mavigne_tuto_retour', window.location.pathname + window.location.search + window.location.hash); }
  catch (e) { _avale(e, '_lancer'); }
  window.location.assign(window.location.pathname + '?tuto=' + encodeURIComponent(id));
}
// Le miroir côté vrai domaine : l'étape en cours (dite par la fenêtre) est-elle faite ICI ? Même vérification que le
// tuto — l'écran a vraiment changé —, sauf les étapes qui ont leur `reel` (les valeurs du domaine fictif n'existent
// pas ici). Un anneau doré discret, sans voile, montre le même bouton sur le vrai domaine.
var MI = null;
function _miroirFait(e, memo) {
  if (!e) return false;
  if (e.reel) return !!e.reel(memo || {});
  if (e.type === 'toucher') return !!e.fait(memo || {});
  if (e.type === 'aller') return _pageActive(e.page);
  if (e.type === 'taper') { var c = _q(e.cible); return !!(c && e.valide(c.value)); }
  return false;
}
function _miroirAnneau() {
  if (!MI || !MI.anneau) return;
  var e = MI.t.etapes[MI.i], el = null;
  if (e && e.type === 'aller') { var n = _nav(e.page); el = n ? n.el : null; }
  else if (e && e.type === 'choisir') el = e.cibleReel ? _q(e.cibleReel) : null;
  else if (e && e.type !== 'regarder') el = _q(e.cible);
  var r = MI.anneau;
  if (!el || !_vis(el) || MI.envoye === MI.i) { r.style.opacity = '0'; return; }
  var b = el.getBoundingClientRect();
  r.style.left = Math.round(b.left - 5) + 'px'; r.style.top = Math.round(b.top - 5) + 'px';
  r.style.width = Math.round(b.width + 10) + 'px'; r.style.height = Math.round(b.height + 10) + 'px';
  r.style.opacity = '1';
}
function _miroirTic() {
  if (!MI) return;
  _miroirAnneau();
  var e = MI.t.etapes[MI.i];
  if (!e || MI.envoye === MI.i || Date.now() - MI.depuis < 700) return;
  var k = -1;
  for (var j = MI.i; j < Math.min(MI.t.etapes.length, MI.i + 3); j++) { if (_miroirFait(MI.t.etapes[j], MI.memo)) k = j; }
  if (k < 0) { MI.ok = 0; return; }
  if (k === MI.i && e.type === 'taper') {   // une saisie : on attend qu'elle soit posée
    var c = _q(e.cible), v = c ? c.value : '';
    if (v !== MI.val) { MI.val = v; MI.valDepuis = Date.now(); return; }
    if (document.activeElement === c && Date.now() - MI.valDepuis < 1500) return;
  }
  if (++MI.ok < 2) return;
  MI.envoye = MI.i;
  var m = { mvtu: 'miroir', i: MI.i, jusqua: k };
  if (e.type === 'taper') { var c2 = _q(e.cible); if (c2 && c2.value) m.valeur = c2.value; }
  try { MI.cible.postMessage(m, window.location.origin); } catch (er) { _avale(er, '_miroirTic'); }
}
function _miroirBoucle() { if (!MI) return; _miroirAnneau(); window.requestAnimationFrame(_miroirBoucle); }
function _miroirDemarrer(t, cible) {
  _miroirArret();
  _css();
  MI = { t: t, i: 0, memo: {}, cible: cible, depuis: Date.now(), envoye: -1, ok: 0, val: null, valDepuis: 0 };
  if (t.avant) { try { t.avant(MI.memo); } catch (e) { _avale(e, '_miroirDemarrer#avant'); } }
  MI.anneau = document.createElement('div');
  MI.anneau.className = 'mvtu-anneau';
  MI.anneau.setAttribute('aria-hidden', 'true');
  document.body.appendChild(MI.anneau);
  MI.tic = setInterval(_miroirTic, 300);
  window.requestAnimationFrame(_miroirBoucle);
}
function _miroirArret() {
  if (!MI) return;
  clearInterval(MI.tic);
  if (MI.anneau && MI.anneau.parentNode) MI.anneau.parentNode.removeChild(MI.anneau);
  MI = null;
}
var _ecoute = false;
function _fermerPanneau(garderMiroir) {
  var p = document.getElementById('mvtu-panneau'); if (p && p.parentNode) p.parentNode.removeChild(p);
  if (!garderMiroir) _miroirArret();
}
function _panneau(id) {
  var t = _tuto(id); if (!t) return;
  _css();
  if (typeof window.closeAide === 'function') { try { window.closeAide(); } catch (e) { _avale(e, '_panneau#aide'); } }
  _fermerPanneau();
  var url = window.location.pathname + '?tuto=' + encodeURIComponent(id) + '&tuto_cadre=1';
  var p = document.createElement('div');
  p.id = 'mvtu-panneau';
  p.className = 'mvtu-panneau';
  p.setAttribute('role', 'complementary');
  p.setAttribute('aria-label', 'Entraînement');
  p.innerHTML = '<div class="mvtu-p-hd"><span>Entraînement</span>'
    + '<button type="button" class="mvtu-p-b" data-p="fenetre">Fenêtre à part</button>'
    + '<button type="button" class="mvtu-p-b" data-p="fermer" aria-label="Fermer l’entraînement">' + _ic('croix', 16) + '</button></div>'
    + '<iframe class="mvtu-p-if" title="' + _esc(t.titre) + '" src="' + _esc(url) + '"></iframe>';
  p.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-p]'); if (!b) return;
    var a = b.getAttribute('data-p');
    if (a === 'fermer') _fermerPanneau();
    else if (a === 'fenetre') {
      var w = window.open(url, 'mvtuto', 'popup=yes,width=440,height=900');
      if (w) { _fermerPanneau(true); _miroirDemarrer(t, w); }
    }
  });
  document.body.appendChild(p);
  _miroirDemarrer(t, p.querySelector('iframe').contentWindow);
  if (!_ecoute) {
    _ecoute = true;
    window.addEventListener('message', function (ev) {
      if (ev.origin !== window.location.origin || !ev.data || !ev.data.mvtu) return;
      var d = ev.data;
      if (d.mvtu === 'fermer') _fermerPanneau();
      else if (d.mvtu === 'fini') { if (MI) { MI.envoye = MI.i; _miroirArret(); } }
      else if (d.mvtu === 'etape' && MI && MI.t.id === d.id && typeof d.i === 'number') {
        MI.i = d.i; MI.depuis = Date.now(); MI.envoye = -1; MI.ok = 0; MI.val = null;
      }
    });
  }
}

// ── 9. L'ENTRÉE : « Me montrer comment faire », en tête de l'aide de chaque écran ──────────────
function _ligne(t) {
  return '<button type="button" class="mvtu-row" data-tu="voir" data-id="' + _esc(t.id) + '"><span>' + _esc(t.titre)
    + '<small>' + t.etapes.length + ' étapes, environ ' + _esc(t.duree) + '</small></span>' + _ic('chevron', 16) + '</button>';
}
function _aideBloc() {
  _css();
  var pg = _page(), tous = TU_TUTOS.filter(_permis);
  if (!tous.length) return '';
  var ici = tous.filter(function (t) { return t.pages.indexOf(pg) >= 0; });
  return '<div class="mvtu-aide"><h4>' + _ic('doigt', 18) + ' Me montrer comment faire</h4>'
    + (ici.length ? '' : '<p>Pas encore de tuto pour cet écran.</p>')
    + ici.map(_ligne).join('')
    + '<button type="button" class="mvtu-tous" data-tu="tous">Tous les tutos (' + tous.length + ')' + _ic('chevron', 14) + '</button></div>';
}
function _catalogue(el) {
  var tous = TU_TUTOS.filter(_permis), mods = [], h = '';
  tous.forEach(function (t) { if (mods.indexOf(t.module) < 0) mods.push(t.module); });
  mods.forEach(function (m) { h += '<div class="mvtu-mod">' + _esc(m) + '</div>' + tous.filter(function (t) { return t.module === m; }).map(_ligne).join(''); });
  el.innerHTML = '<div class="modal-hd"><div><div class="modal-title">Comment faire pour…</div><div class="modal-sub">Un geste à la fois, sur un domaine fictif</div></div></div>'
    + '<div class="mvtu-aide">' + h + '</div>'
    + '<button type="button" class="mvtu-b3 mvtu-large" data-tu="retour">Retour à l’aide</button>';
}
function _confirmer(el, id) {
  var t = _tuto(id); if (!t) return;
  el.innerHTML = '<div class="modal-hd"><div><div class="modal-title">' + _esc(t.titre) + '</div><div class="modal-sub">' + t.etapes.length + ' étapes, environ ' + _esc(t.duree) + '</div></div></div>'
    + '<div class="mvtu-aide"><h4>' + _ic('bouclier', 18) + ' Un entraînement, pas votre domaine</h4>'
    + '<p>Vous vous entraînez sur le ' + _esc(TU_DOMAINE) + ', un domaine fictif. Rien de ce que vous touchez n’arrive sur votre domaine. '
    + (_aCoteDispo() ? 'Il s’ouvre à côté de l’appli : vous pouvez faire le geste pour de vrai en même temps.' : 'À la fin, un bouton vous y ramène.') + '</p></div>'
    + '<button type="button" class="mvtu-b1 mvtu-large" data-tu="lancer" data-id="' + _esc(t.id) + '">Commencer l’entraînement</button>'
    + '<button type="button" class="mvtu-b3 mvtu-large" data-tu="retour">Retour à l’aide</button>';
}
function _aideBrancher(el) {
  if (!el || el.__mvtu) return;
  el.__mvtu = true;
  el.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tu]'); if (!b) return;
    var a = b.getAttribute('data-tu');
    if (a === 'tous') _catalogue(el);
    else if (a === 'voir') _confirmer(el, b.getAttribute('data-id'));
    else if (a === 'lancer') _lancer(b.getAttribute('data-id'));
    else if (a === 'retour' && window.openAide) window.openAide();
  });
}

// ── 10. LE DÉMARRAGE EN ENTRAÎNEMENT (appelé par app.js, à la place du chargement du domaine) ──
function _prepare() {
  var t = _tuto(String(window.__MV_TUTO || ''));
  if (!t) return null;
  return { utilisateur: { nom: 'Marie', roles: ['admin', 'ouvrier', 'tractoriste'], email: '', _isDemo: true, _isTuto: true },
           domaine: TU_DOMAINE, page: t.depart || 'home' };
}
function _charger() {
  var d = JSON.parse(JSON.stringify(TU_DONNEES));
  ['config', 'membres', 'saisons', 'taches', 'activites', 'conducteurs', 'parcelles'].forEach(function (k) {
    if (d[k] === undefined || typeof window.applyFbData !== 'function') return;
    try { window.applyFbData(k, d[k]); } catch (e) { _avale(e, '_charger#' + k); }
  });
}
function _demarrer() {
  var t = _tuto(String(window.__MV_TUTO || ''));
  if (!t || E.actif) return;
  E.t = t; E.i = 0; E.memo = {};
  if (t.avant) { try { t.avant(E.memo); } catch (e) { _avale(e, '_demarrer#avant'); } }
  _etat('fini', false);
  _etat('types', t.etapes.map(function (x) { return x.type; }));
  E.actif = true;
  _couches();
  document.addEventListener('click', _surClic, true);
  document.addEventListener('input', _surSaisie, true);
  document.addEventListener('keydown', _surTouche, true);
  if (_cadre()) window.addEventListener('message', _surMiroir);
  window.requestAnimationFrame(_boucle);
  setTimeout(_montrer, 300);
}

window._mvTutoPrepare = _prepare;
window._mvTutoCharger = _charger;
window._mvTutoLancer = _demarrer;
window._mvTutoAideBloc = _aideBloc;
window._mvTutoAideBrancher = _aideBrancher;
window._mvTutoListe = function () { return TU_TUTOS.map(function (t) { return t.id; }); };
window._mvTutoSortir = _sortir;
// Vérification du miroir (lecture seule) : l'étape i du tuto est-elle faite sur CE domaine ? mv-tutos-jeu.mjs s'en sert.
window._mvTutoAvant = function (id) { var t = _tuto(id), m = {}; if (t && t.avant) t.avant(m); return m; };
window._mvTutoMiroirFait = function (id, i, memo) { var t = _tuto(id); return t ? _miroirFait(t.etapes[i], memo || {}) : false; };
