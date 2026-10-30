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
var TU_DONNEES = {"config":{"domaine_nom":"Domaine des Grandes Vignes","lat":47.22,"lon":4.97,"onboarding_done":true,"gnr":{"capacite":2000,"niveau":650,"seuil":300,"maj":"2026-10-02"}},"membres":[{"nom":"Marie","roles":["admin","ouvrier","tractoriste"],"couleur":"#3D6B27","statut":"actif"},{"nom":"Jean","roles":["ouvrier","tractoriste"],"couleur":"#1A4A7A","statut":"actif"},{"nom":"Sophie","roles":["ouvrier"],"couleur":"#7A4F2E","statut":"actif"},{"nom":"Paul","roles":["ouvrier","tractoriste"],"couleur":"#5B2D8E","statut":"actif"}],"saisons":[{"nom":"Printemps 2026","periode":"Mars — Juillet 2026","active":true,"taches":["Ebourgeonnage","Relevage","Accolage","Pioche","Palissage"]},{"nom":"Hiver 2025-2026","periode":"Nov. 2025 — Fév. 2026","active":false,"taches":["Taille","Tirage","Brulage"]}],"taches":[{"nom":"Taille","hha":70,"saison":"Hiver"},{"nom":"Tirage","hha":40,"saison":"Hiver"},{"nom":"Brulage","hha":40,"saison":"Hiver"},{"nom":"Ebourgeonnage","hha":35,"saison":"Printemps"},{"nom":"Relevage","hha":50,"saison":"Printemps"},{"nom":"Accolage","hha":50,"saison":"Printemps"},{"nom":"Pioche","hha":40,"saison":"Printemps"},{"nom":"Palissage","hha":50,"saison":"Printemps"}],"parcelles":[{"nom":"Clos du Moulin","surface":0.45,"appellation":"Gevrey-Chambertin","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"Les Charmes","surface":1.2,"appellation":"Gevrey-Chambertin 1er cru","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":null,"n3":null,"ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":"Valide","ov":null},"Palissage":null}},{"nom":"Vieilles Vignes","surface":0.8,"appellation":"Gevrey-Chambertin","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}},{"nom":"Les Perrières","surface":1.05,"appellation":"Bourgogne","cepage":"Chardonnay","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":"Valide"},"Relevage":{"n1":"Valide","n2":"Valide","n3":null,"ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"Champ de la Croix","surface":0.62,"appellation":"Bourgogne","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":"Valide","p2":null,"ov":null},"Palissage":null}},{"nom":"En Bertrange","surface":0.9,"appellation":"Côte de Nuits-Villages","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":null,"p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}},{"nom":"La Combotte","surface":1.5,"appellation":"Bourgogne","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":"Valide","ov":null},"Relevage":{"n1":"Valide","n2":"Valide","n3":"Valide","ov":null},"Accolage":"Valide","Pioche":{"p1":"Valide","p2":"Valide","ov":null},"Palissage":null}},{"nom":"Aux Murgers","surface":0.5,"appellation":"Fixin","cepage":"Pinot noir","statut":"Active","taches":{"Ebourgeonnage":{"p1":"Valide","p2":null,"ov":null},"Relevage":{"n1":null,"n2":null,"n3":null,"ov":null},"Accolage":null,"Pioche":{"p1":null,"p2":null,"ov":null},"Palissage":null}}],"conducteurs":[{"nom":"Marie"},{"nom":"Jean"},{"nom":"Paul"}],"activites":[{"nom":"Griffage"},{"nom":"Buttage"},{"nom":"Intercep"},{"nom":"Traitement"},{"nom":"Broyage"}]};

// ★ TUTO-4 (§361) — UN ENTRAÎNEMENT EXIGE LE boot.js DE SA VERSION. boot.js (sans numéro dans son nom) a survécu à des
//   mises à jour dans le cache : un panneau démarré avec un ancien boot.js ne savait plus qu'il était un panneau — et avec
//   un boot.js d'avant les tutos, c'est la VRAIE appli qui se serait ouverte dedans. Marque absente ou autre : app.js
//   n'ouvre ni l'entraînement ni l'appli ; un message dit quoi faire.
var TU_BOOT_V = 4;
if (/[?&]tuto=/.test(window.location.search || '') && window.__MV_BOOT_TUTO_V !== TU_BOOT_V) window.__MV_TUTO_BLOQUE = true;

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
// FERTI-7 (§464) : le bouton « nouveau » de Phyto est rond au téléphone, en texte sur ordinateur — viser celui qui se voit.
// FERTI-8 (§466) : deux apports de Terrafumur, aux teneurs différentes d'une campagne à l'autre, pour « Vos produits ».
function _tuIntrants() {
  var op = function (id, cree, N, P, K, MO) { return { id: id, cree: cree, prodId: 'tu-terra', prod: { nom: 'Terrafumur', ref: 'NF U 44-051', origine: 'norme', amm: '', four: 'Coopérative de la Côte', nat: 'compost', vg: '', N: N, P: P, K: K, MO: MO, CN: null, typ: 'Ia', ab: true }, dose: 2, kgSac: 25, prix: null, pu: 't', cout: null, sacs: null, parcs: ['Clos du Moulin'], trac: {}, sem: '', enf: 'non', man: {} }; };
  return { produits: [{ id: 'tu-terra', nom: 'Terrafumur', cat: 'vigne', unite: 'kg', contenance: 25, contLbl: 'sac', conso_src: 'manual', conso_manuel: 0, amm: '' }],
           fertil: [op('tu-f1', '2024-11-14', 2, 1.7, 3.5, 30), op('tu-f2', '2025-11-20', 2.2, 1.6, 3.8, 32)] };
}
function _tuFerNouveau() { return _vis(_q('[data-tuto="phy.nouveau.pc"]')) ? '[data-tuto="phy.nouveau.pc"]' : '[data-tuto="phy.nouveau"]'; }
function _ouvert(id) { var o = document.getElementById(id); return !!(o && o.classList.contains('open')); }
function _gnr() { var c = window.CONFIG || {}; return c.gnr || { capacite: 0, niveau: 0 }; }
// ★ JCAVE-1 (§428) : le nombre de cases marquées en cave (CONFIG.cave_jours), pour voir qu'une marque vient d'être posée.
function _caveN() { var C = (window.CONFIG || {}).cave_jours || {}, n = 0; Object.keys(C).forEach(function (k) { n += Object.keys(C[k] || {}).length; }); return n; }
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
  // ★ ACCV-4 (§419) : corriger l'équipe d'une validation, au Journal (administrateur).
  { id: 'jequipe', titre: 'Comment faire pour corriger l’équipe d’une validation\u00a0?', fin: 'corriger l’équipe d’une validation',
    module: 'Vigne', pages: ['journal'], pour: 'admin', duree: '1 min', depart: 'journal',
    couvre: ['openJEquipe', '_jEqBasc', 'saveJEquipe'],
    avant: function (m) { m.jeq0 = new Date().toISOString(); },   // ★ TUTO-9 (§423) : l'heure du départ, pour l'étape 3
    retenir: ['Journal › bouton « Équipe » sur une validation (administrateur).',
              'Cochez qui a vraiment travaillé ; celui qui a validé peut rester décoché : il reste l’auteur de l’entrée.',
              '« Toute la journée » corrige d’un coup les validations de la même tâche, le même jour.'],
    etapes: [
      { type: 'toucher', cible: '[data-tuto="journal.equipe"]',
        txt: function () { return 'Vous êtes dans le Journal. Chaque validation porte un bouton « Équipe ». {T} celui de la première.'; },
        fait: function () { return _ouvert('ovJEquipe'); },
        ok: 'La fenêtre « Qui a fait ce travail ? » s’est ouverte.' },
      { type: 'choisir', options: ['[data-jeq-n="Jean"]', '[data-jeq-n="Sophie"]'], zone: function () { var z = _q('#jeq-pick'); return z ? [z] : []; },   // TUTO-9 : une LISTE (le moteur la parcourt)
        txt: function () { return 'Cochez Jean et Sophie : ce sont eux qui ont fait le travail. Celui qui a validé peut rester décoché.'; },
        txtReel: 'cochez qui a vraiment travaillé' },
      { type: 'toucher', cible: '[data-tuto="journal.equipe.ok"]',
        txt: function () { return '{T} « Enregistrer ». L’entrée garde la trace de la correction.'; },
        // ★ TUTO-9 (§423) : « la fenêtre est fermée » était vrai AVANT même de l'ouvrir — côté domaine, le panneau voyait
        //   l'étape 3 faite dès l'étape 1 (saut d'étape, la règle de TUTO-7). Fait = fenêtre refermée ET une validation corrigée
        //   depuis le départ du tuto (la trace « Équipe corrigée par… » que pose saveJEquipe).
        fait: function (memo) { return !_ouvert('ovJEquipe') && _jeqCorrigee(memo); },
        ok: 'L’équipe est corrigée : la saison de chacun suit.' }
    ] },
  { id: 'equipes', titre: 'Comment faire pour indiquer les équipes du jour\u00a0?', fin: 'indiquer les équipes du jour',
    module: 'Vigne', pages: ['home'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['openEqJour', '_mvEqPick', 'saveEqJour'],
    retenir: ['Accueil › pastille « Équipes du jour ».',
              'Tout le monde arrive en Équipe 1. Pour mettre quelqu’un seul, donnez-lui une équipe à lui.',
              '« Enregistrer » : les équipes restent en place les jours suivants, jusqu’à ce que vous les changiez.'],
    etapes: [
      { type: 'toucher', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'Vous commencez sur l’Accueil. Les équipes du jour se règlent ici, sous la tâche prioritaire. {T} la pastille « ' + (L('[data-tuto="home.eqj"]').split(':')[0].trim() || 'Équipes du jour') + ' ».'; },
        fait: function () { return _ouvert('ovEqJour'); },
        reel: function (memo) { var o = _ouvert('ovEqJour'); if (o) { memo.eqjVu = true; memo.eqjAvant = L('#home-eqj-txt'); } return o; },
        ok: 'La fenêtre des équipes s’est ouverte.' },
      // ★ EQDEF-1 (§492) : plus de « Aucune » — tout le monde arrive en Équipe 1. Jean, Sophie et Marie y sont déjà : l'ancienne
      //   étape « Mettez Jean et Sophie dans Équipe 1 » se serait validée toute seule. Il reste le seul geste à apprendre : sortir
      //   quelqu'un de l'Équipe 1. TUTO-7 (§364) : pas de `reel` sur un choix — sur le vrai domaine, on ne sait pas qui le client
      //   déplace ; le panneau suit quand le client ENREGISTRE (étape suivante), et rejoue alors les choix d'un coup.
      { type: 'choisir', options: ['[data-eqj-n="Paul"][data-eqj-k="2"]'], zone: _zoneEquipe,
        txt: function () { return 'Tout le monde arrive dans « ' + L('[data-eqj-n="Jean"][data-eqj-k="1"]') + ' » : Jean, Sophie et Marie travailleront ensemble. Paul part seul au tracteur : mettez-le dans « ' + L('[data-eqj-n="Paul"][data-eqj-k="2"]') + ' », une équipe à lui.'; },
        txtReel: 'tout le monde arrive en Équipe 1 ; touchez l’équipe de ceux qui travaillent ailleurs — une équipe à lui pour quelqu’un de seul —, puis enregistrez.', cibleReel: '#eqj-rows',
        ok: 'Paul a son équipe à lui ; les autres restent ensemble.' },
      { type: 'toucher', cible: '[data-tuto="eqj.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="eqj.save"]') + ' ».'; },
        fait: function () { return !_ouvert('ovEqJour') && /Jean/.test(L('#home-eqj-txt')); },
        // TUTO-7 : la pastille « d'avant » est lue pendant que la fenêtre est ouverte chez le client (avant, elle pouvait être
        //   lue avant même d'être dessinée, et tout texte ensuite passait pour un enregistrement).
        reel: function (memo) {
          if (_ouvert('ovEqJour')) { memo.eqjVu = true; memo.eqjAvant = L('#home-eqj-txt'); return false; }
          return !!memo.eqjVu && L('#home-eqj-txt') !== memo.eqjAvant;
        },
        ok: 'C’est enregistré : le message vert le confirme.' },
      { type: 'regarder', cible: '[data-tuto="home.eqj"]',
        txt: function () { return 'La pastille dit maintenant « ' + L('#home-eqj-txt') + ' ». Chacun valide avec son équipe, sans pouvoir la changer. Demain, elles sont toujours là : elles restent en place jusqu’à ce que vous les changiez.'; } }
    ] },
  // ★ JCAVE-1 (§428) — la journée de cave, au Planning (administrateur). Elle couvre les quatre gestes de la fenêtre « Travail de cave ».
  { id: 'cave', titre: 'Comment faire pour noter une journée de cave\u00a0?', fin: 'noter une journée de cave',
    module: 'Planning', pages: ['planning'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['planCaveSheet', 'planCaveMode', 'planCaveApply', 'planCaveRetirer'],
    avant: function (memo) { memo.cav0 = _caveN(); },
    retenir: ['Planning › Le mois : cochez les cases de ceux qui étaient en cave, puis « Cave » dans la barre.',
              'La journée, le matin ou l’après-midi : la case garde ses heures, la paie ne change pas.',
              'Le Pilotage ne verse plus ces heures aux parcelles validées. Pour défaire : les mêmes cases, « Cave », « Retirer la cave ».'],
    etapes: [
      { type: 'aller', page: 'planning', pourquoi: 'Une journée de cave se note au Planning, sur les cases du jour.' },
      { type: 'toucher', cible: '[data-tuto="plan.jour"]',
        txt: function () { return '{T} le numéro d’un jour, en haut de la grille : toute l’équipe est cochée ce jour-là. Les cases se cochent aussi une par une.'; },
        fait: function () { var b = _q('#plan-mbar'); return !!(b && b.classList.contains('open')); },
        ok: 'La barre du bas dit qui est coché.' },
      { type: 'toucher', cible: '[data-tuto="plan.cave"]',
        txt: function () { return '{T} « ' + L('[data-tuto="plan.cave"]') + ' » dans la barre.'; },
        fait: function () { return _ouvert('ovPlanDay') && !!_q('#plan-cave-q'); },
        ok: 'La fenêtre « Travail de cave » s’est ouverte.' },
      { type: 'toucher', cible: '[data-tuto="plan.cave.m"]',
        txt: function () { return 'Ce jour-là, l’équipe était en cave le matin. {T} « ' + L('[data-tuto="plan.cave.m"]') + ' » : le ruban montre la part de la journée qui sort de la vigne.'; },
        fait: function () { var b = _q('[data-tuto="plan.cave.m"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Le matin va de la prise à la coupure, d’après l’horaire du jour.' },
      { type: 'toucher', cible: '[data-tuto="plan.cave.ok"]',
        txt: function () { return '{T} « ' + L('[data-tuto="plan.cave.ok"]') + ' ».'; },
        fait: function (memo) { return !_ouvert('ovPlanDay') && _caveN() > (memo.cav0 || 0); },
        ok: 'C’est noté : le message vert le confirme.' },
      { type: 'regarder', cible: '[data-tuto="plan.jour"]',
        txt: function () { return 'Au pied de chaque case de ce jour, une bande à gauche dit « cave le matin ». Les heures restent au planning ; au Pilotage, elles ne vont plus aux parcelles validées. Sur votre domaine, rien n’a bougé : c’était un entraînement.'; } }
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
      { type: 'toucher', chemin: true, cible: '[data-tuto="trac.entretien"]',
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
        reel: function () { var l = _q('[data-tuto="gnr.litres"]'), p = _q('[data-tuto="gnr.prix"]'); return !!(l && p && _num(l.value) > 0 && _num(p.value) > 0 && _num(p.value) < 10); },
        valide: function (x) { var n = _num(x); return n > 0 && n < 10; },
        ok: function () { return 'Ce prix ira dans le coût du GNR, au Pilotage.'; } },
      { type: 'toucher', cible: '[data-tuto="gnr.save"]',
        txt: function () { return '{T} « ' + L('[data-tuto="gnr.save"]') + ' ».'; },
        fait: function (memo) { return !_q('[data-tuto="gnr.litres"]') && _gnr().niveau > (memo.gnr0 || 0); },
        ok: 'Le message vert confirme l’appoint.' },
      { type: 'regarder', cible: '[data-tuto="gnr.carte"]',
        txt: function () { var g = _gnr(); return 'La cuve remonte à ' + _nb(g.niveau) + ' litres sur ' + _nb(g.capacite) + '. Sur votre domaine, rien n’a bougé : c’était un entraînement.'; } }
    ] },
  // ★ FERTI-7 (§464) — l'amendement (FERTI-5 et FERTI-6) : un produit normé, sa norme, sa formule, sa nature, puis les
  //   parcelles choisies par appellation. Il fait redescendre le compte des gestes sans tuto (817 → 807 et moins).
  //   Le domaine d'entraînement n'a ni catalogue E-Phy ni vendange : le produit est un engrais normé (pas d'AMM, saisi à
  //   la main), et la règle joue sur les appellations seules. Le bouton « nouveau » est rond au téléphone, en texte sur
  //   ordinateur : _tuFerNouveau() vise celui qui se voit.
  { id: 'amendement', titre: 'Comment faire pour saisir un amendement\u00a0?', fin: 'saisir un amendement',
    module: 'Phyto', pages: ['phyto'], pour: 'admin', duree: '2 min', depart: 'home',
    couvre: ['switchPhytoTab', '_phytoFab', '_ferSet', '_ferNorme', '_ferSacTog', '_ferNpk', '_ferNat', '_ferTog', '_ferSauf', '_ferRegleGo'],
    retenir: ['Phyto › Fertilisation › le bouton « nouveau ».',
              'Un produit normé n’a pas d’AMM : son nom, puis sa norme, écrite sur le sac. La formule « 4-10-1 » remplit azote, phosphore et potasse.',
              '« Ce que c’est » pose le type nitrates ; aux parcelles, « Choisir par règle » coche sous un rendement, sauf des appellations.'],
    etapes: [
      { type: 'aller', page: 'phyto', pourquoi: 'L’amendement se saisit dans le module Phyto, onglet Fertilisation.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="phy.fer"]',
        txt: function () { return '{T} l’onglet « ' + (L('[data-tuto="phy.fer"]') || 'Fertilisation') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="phy.fer"]'); return !!(b && b.classList.contains('active')); },
        ok: 'Voici le registre de fertilisation de la campagne.' },
      { type: 'toucher', get cible() { return _tuFerNouveau(); },
        txt: function () { return /\.pc/.test(_tuFerNouveau()) ? 'Le fournisseur est passé. {T} « ' + L(_tuFerNouveau()) + ' ».' : 'Le fournisseur est passé. {T} le bouton rond, en bas à droite.'; },
        fait: function () { return _ouvert('ovFerti') && !!_q('[data-tuto="fer.nom"]'); },
        ok: 'L’amendement s’ouvre sur le produit.' },
      { type: 'taper', cible: '[data-tuto="fer.nom"]', exemple: 'Engrais organique 4-10-1',
        txt: function () { return 'Un produit vendu sous une norme n’a pas de numéro d’AMM : il n’est pas dans E-Phy. Tapez son nom, par exemple «\u00a0Engrais organique 4-10-1\u00a0».'; },
        txtReel: 'le nom écrit sur votre sac.',
        valide: function (x) { return String(x || '').trim().length >= 2; },
        ok: 'Le nom est noté.' },
      { type: 'toucher', cible: '[data-tuto="fer.norme"]',
        txt: function () { return 'La norme est imprimée sur le sac, à côté du nom du type\u00a0: pour un engrais, ' + (L('[data-tuto="fer.norme"] b') || 'NF U 42-001') + '. {T} ce bouton.'; },
        fait: function () { var r = _q('#fer-ref'); return !!(r && r.value === 'NF U 42-001'); },
        ok: 'La norme est posée. Le champ reste libre si votre sac dit autre chose.' },
      { type: 'toucher', cible: '[data-tuto="fer.sac"]',
        txt: function () { return 'Où lire tout ça\u00a0? {T} « ' + (L('[data-tuto="fer.sac"]') || 'Où lire tout ça sur le sac') + ' ».'; },
        fait: function () { var b = _q('#fer-sac'); return !!(b && b.style.display !== 'none'); },
        ok: 'Un exemple d’étiquette montre où lire la norme, la composition et la mention bio.' },
      { type: 'taper', cible: '[data-tuto="fer.npk"]', exemple: '4-10-1',
        txt: function () { return 'Les trois chiffres du sac sont l’azote, le phosphore et la potasse. Tapez la formule, par exemple 4-10-1.'; },
        txtReel: 'la formule de votre sac.',
        valide: function (x) { return /\d+\D+\d+/.test(String(x || '')); },
        ok: function () { var v = function (k) { var e = _q('#fer-' + k); return e && e.value ? e.value : '\u2014'; }; return 'Azote ' + v('N') + '\u00a0%, phosphore ' + v('P') + '\u00a0%, potasse ' + v('K') + '\u00a0% : remplis.'; } },
      { type: 'taper', cible: '[data-tuto="fer.nat"]', exemple: 'orga',
        txt: function () { return 'Dites ce qu’est le produit\u00a0: choisissez «\u00a0Engrais organique, fientes, fumier de volaille\u00a0».'; },
        txtReel: 'ce qu’est votre produit.',
        valide: function (x) { return !!x; },
        ok: 'Le type nitrates est posé, avec sa raison juste en dessous.' },
      { type: 'toucher', cible: '[data-tuto="fer.etape2"]',
        txt: function () { return 'Passons aux parcelles. {T} « Les parcelles ».'; },
        fait: function () { var s = _q('#fer-s2'); return !!(s && !s.classList.contains('ferme')) && !!_q('[data-tuto="fer.regle"]'); },
        ok: 'En tête, « Choisir par règle ».' },
      { type: 'toucher', cible: '[data-tuto="fer.aoc"][data-aoc="Bourgogne"]',
        txt: function () { return 'Au domaine, les Bourgognes ne reçoivent pas cet amendement. {T} «\u00a0Bourgogne\u00a0» pour les retirer.'; },
        fait: function () { var b = _q('[data-tuto="fer.aoc"][data-aoc="Bourgogne"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Bourgogne est barrée\u00a0: la règle la laisse de côté.' },
      { type: 'toucher', cible: '[data-tuto="fer.regle"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="fer.regle"]') || 'Cocher ces parcelles') + ' ».'; },
        fait: function () { return document.querySelectorAll('[data-tuto="fer.plist"] .fer-pl.on').length > 0; },
        ok: function () { var n = document.querySelectorAll('[data-tuto="fer.plist"] .fer-pl.on').length; return n + '\u00a0parcelle' + (n > 1 ? 's cochées' : ' cochée') + '. Vous pouvez encore en cocher ou décocher à la main.'; } },
      { type: 'regarder', cible: '[data-tuto="fer.plist"]',
        txt: function () { return 'Chaque ligne montre son appellation, ses sacs et son azote. Avec un seuil, la règle garderait aussi les parcelles sous ce rendement, celui de la vendange au Cuvier. Sur votre domaine, rien n’a bougé\u00a0: c’était un entraînement.'; } }
    ] },
  // ★ FERTI-8 (§466) — « Vos produits » : reprendre un produit déjà utilisé, puis les teneurs d'une autre campagne.
  { id: 'produit-repris', titre: 'Comment faire pour reprendre un produit déjà utilisé\u00a0?', fin: 'reprendre un produit déjà utilisé',
    module: 'Phyto', pages: ['phyto'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['_ferSearch', '_ferPickVos', '_ferVer'],
    retenir: ['La recherche trouve d’abord vos produits : la fiche se remplit comme au dernier apport.',
              'Les teneurs changent d’une année à l’autre : celles de chaque campagne restent à un geste, à vérifier sur le sac.'],
    etapes: [
      { type: 'aller', page: 'phyto', pourquoi: 'L’amendement se saisit dans le module Phyto, onglet Fertilisation.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="phy.fer"]',
        txt: function () { return '{T} l’onglet « ' + (L('[data-tuto="phy.fer"]') || 'Fertilisation') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="phy.fer"]'); return !!(b && b.classList.contains('active')); },
        ok: 'Voici le registre de fertilisation.' },
      { type: 'toucher', get cible() { return _tuFerNouveau(); },
        txt: function () { return /\.pc/.test(_tuFerNouveau()) ? '{T} « ' + L(_tuFerNouveau()) + ' ».' : '{T} le bouton rond, en bas à droite.'; },
        fait: function () { return _ouvert('ovFerti') && !!_q('[data-tuto="fer.q"]'); },
        ok: 'L’amendement s’ouvre sur la recherche.' },
      { type: 'taper', cible: '[data-tuto="fer.q"]', exemple: 'terra',
        txt: function () { return 'Cherchez le produit, par exemple «\u00a0terra\u00a0» pour Terrafumur.'; },
        txtReel: 'le début du nom de votre produit.',
        valide: function (x) { return String(x || '').trim().length >= 2; },
        ok: 'Vos produits d’abord, E-Phy ensuite.' },
      { type: 'toucher', cible: '[data-tuto="fer.vos"]',
        txt: function () { return '{T} «\u00a0Terrafumur\u00a0», sous «\u00a0Vos produits\u00a0».'; },
        fait: function () { var e = _q('#fer-nom'); return !!(e && e.value === 'Terrafumur'); },
        ok: 'La fiche est remplie comme au dernier apport, avec les teneurs de la dernière campagne.' },
      { type: 'toucher', cible: '[data-tuto="fer.ver"][data-ver="1"]',
        txt: function () { return 'Les teneurs changent d’une année à l’autre. {T} celles de l’autre campagne.'; },
        fait: function () { var b = _q('[data-tuto="fer.ver"][data-ver="1"]'); return !!(b && b.classList.contains('on')); },
        ok: 'Les teneurs de cette campagne-là sont reprises.' },
      { type: 'regarder', cible: '[data-tuto="fer.src"]',
        txt: function () { return 'La date des teneurs est rappelée. Comparez-les avec le sac ou l’analyse de cette année\u00a0: retouchées, elles partent avec ce nouvel apport. Sur votre domaine, rien n’a bougé.'; } }
    ] },
  // ★ TUTO-8 (§388) — les maturités (MATU-1) : la saisie en série. Il fait redescendre le compte des gestes sans tuto.
  { id: 'maturites', titre: 'Comment faire pour noter des mesures de maturité\u00a0?', fin: 'noter des mesures de maturité',
    module: 'Cave', pages: ['cave'], pour: 'admin', duree: '1 min', depart: 'home',
    couvre: ['selectCaveSection', 'switchVendOng', '_matSaisie', '_matSaisieIn', '_vendAnaAdd'],
    retenir: ['Cave › Le Cuvier › Maturités.',
              '« Noter des mesures » : toutes les parcelles sur pied, sur une seule feuille.',
              'Remplissez celles que vous avez mesurées, puis enregistrez tout d’un coup.'],
    avant: function (memo) { memo.n0 = ((window.CAVE_VENDANGE || {}).analyses || []).length; },
    etapes: [
      { type: 'aller', page: 'cave', pourquoi: 'Les maturités se notent dans la Cave, au Cuvier.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="cave.cuvier"]',
        txt: function () { return '{T} « ' + (L('[data-tuto="cave.cuvier"]') || 'Le Cuvier') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="cave.cuvier"]'); return !!(b && b.classList.contains('active')); },
        ok: 'Voici le Cuvier : maturités, récoltes, cuves, tournée.' },
      { type: 'toucher', chemin: true, cible: '[data-tuto="cuv.maturites"]',
        txt: function () { return '{T} l’onglet « ' + (L('[data-tuto="cuv.maturites"]') || 'Maturités') + ' ».'; },
        fait: function () { var b = _q('[data-tuto="cuv.maturites"]'); return !!(b && b.classList.contains('active')) && !!_q('[data-tuto="mat.noter"]'); },
        ok: 'Les parcelles sont rangées de la plus avancée à la moins avancée.' },
      { type: 'toucher', cible: '[data-tuto="mat.noter"]',
        txt: function () { return 'Vous revenez du réfractomètre. {T} « ' + (L('[data-tuto="mat.noter"] .lg') || L('[data-tuto="mat.noter"]')) + ' ».'; },
        fait: function () { return _ouvert('ovMatSaisie') && !!_q('[data-tuto="mat.champ"]'); },
        ok: 'Toutes les parcelles sur pied sont sur la feuille, la plus mûre en tête.' },
      { type: 'taper', cible: '[data-tuto="mat.champ"]', exemple: '214',
        txt: function () { var c = _q('[data-tuto="mat.champ"]'); return 'Tapez le sucre lu pour « ' + ((c && c.getAttribute('data-nom')) || 'cette parcelle') + ' », par exemple 214.'; },
        txtReel: 'le sucre lu, parcelle par parcelle — celles que vous n’avez pas mesurées restent vides.',
        valide: function (x) { var n = _num(x); return n >= 120 && n <= 290; },
        ok: function (x) { return _nb(_num(x)) + ' g/L : la conversion en degré s’affiche sous le champ.'; } },
      { type: 'toucher', cible: '[data-tuto="mat.ok"]',
        txt: function () { return '{T} « ' + L('[data-tuto="mat.ok"]') + ' ».'; },
        fait: function (memo) { return !_ouvert('ovMatSaisie') && ((window.CAVE_VENDANGE || {}).analyses || []).length > (memo.n0 || 0); },
        ok: 'C’est enregistré : le message vert le confirme.' },
      { type: 'regarder', cible: '[data-tuto="mat.ordre"]',
        txt: function () { return 'La mesure prend sa place dans l’ordre de maturité, face à la fourchette visée. Sur votre domaine, rien n’a bougé : c’était un entraînement.'; } }
    ] }
];

// ── 4. L'ALLURE : les jetons de l'appli, rien en dur sauf le voile ───────────────────────────────
var _PF = 'var(--font-ui,Outfit,system-ui,-apple-system,sans-serif)';   // ★ CHARTE-1 (§367) : la police du réglage, son repli pour une fenêtre sans styles.css
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
    '.mvtu-fin h2{margin:8px 0 4px;font:600 var(--pt-lg,23px)/1.2 var(--font-titre,\'Cormorant Garamond\',Georgia,serif)}',
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
    _coteCss(),   // ★ COTE-1 (§424) : collé à droite, l'appli à côté
    '.mvtu-anneau{position:fixed;left:0;top:0;width:0;height:0;z-index:100004;border:2px solid var(--or-clair);border-radius:var(--r-md,12px);pointer-events:none;opacity:0;box-shadow:0 0 0 1px rgba(0,0,0,.2),0 0 16px rgba(216,188,114,.45);animation:mvtuPouls 1.7s ease-in-out infinite;transition:opacity var(--mv-d1,140ms)}',
    '.mvtu-bloque{position:fixed;inset:0;z-index:100030;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg-app);font-family:' + _PF + '}',
    '.mvtu-bloque > div{max-width:420px;padding:20px;border-radius:var(--r-lg,16px);border:1px solid var(--gris);background:var(--bg-card);color:var(--texte)}',
    '.mvtu-bloque h2{margin:0 0 8px;font:600 var(--pt-lg,23px)/1.2 var(--font-titre,\'Cormorant Garamond\',Georgia,serif)}',
    '.mvtu-bloque p{margin:0 0 12px;font-size:var(--pt-base,14px);line-height:1.5;color:var(--texte-doux)}',
    '.mvtu-reel{margin:6px 0 0;padding:6px 10px;border-radius:10px;background:var(--or-pale);font-size:var(--pt-base,14px);line-height:1.35}',
    '.mvtu-p-hd{display:flex;align-items:center;gap:6px;min-height:46px;padding:0 8px 0 14px;background:var(--cave);color:var(--or-clair);font:600 var(--pt-base,14px) ' + _PF + '}',
    '.mvtu-p-hd span{margin-right:auto}',
    '.mvtu-p-b{display:inline-flex;align-items:center;gap:4px;min-height:36px;padding:0 10px;border-radius:9px;border:1px solid rgba(232,210,148,.35);background:transparent;color:var(--or-clair);font:600 var(--pt-micro,12px) ' + _PF + ';cursor:pointer}',
    '.mvtu-p-corps{position:relative;flex:1;display:flex;min-height:0}',
    '.mvtu-p-if{flex:1;width:100%;border:0;background:var(--bg-app)}',
    '.mvtu-p-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg-app);color:var(--texte-doux);font:500 var(--pt-base,14px) ' + _PF + ';animation:mvtuCharge 1.2s ease-in-out infinite}',
    '@keyframes mvtuCharge{0%,100%{opacity:.55}50%{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.mvtu-p-load{animation:none!important}.mvtu-m,.mvtu-ring,.mvtu-main,.mvtu-coach{transition:none!important;animation:none!important}.mvtu-main svg,.mvtu-tire,.mvtu-ring.attend{animation:none!important}}'
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
  // TUTO-5 : la lecture de l'appli repart à zéro à chaque étape ; si le domaine a déjà fait plus loin, la fenêtre rattrape.
  E.lu = { v: undefined, depuis: 0 }; E.luOk = 0; E.vite = false; E.joue = -1;
  if (E.miroirJusqua >= E.i) setTimeout(_jouerMiroir, 80);
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
  // TUTO-6 (§363) : en miroir, le geste est déjà fait sur le domaine — on passe à la suite presque aussitôt.
  setTimeout(function () { if (E.actif && E.etat === 'ok') _suivant(); }, E.vite ? 300 : (e.type === 'taper' ? 700 : 800));
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
  setTimeout(function () { if (E.actif) _suivant(); }, E.vite ? 250 : 500);
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
  if (E.actif && !E.aligne) {
    var e = _e(), vu = _place();
    if (e && E.etat === 'attente') {
      if (!vu) { if (!E.perdu) E.perdu = Date.now(); else if (Date.now() - E.perdu > 12000) _perdu(); }
      else E.perdu = 0;
      _verifie();
      if (_cadre()) _miroirLire();
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
  var hf = _hoteLu(); if (hf) { try { hf._mvTutoAnneau(t.id, -1); } catch (e) { _avale(e, '_fin#anneau'); } }
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
  // Un drapeau d'une version précédente (boot.js de TUTO-1) dans la mémoire de session : effacé, sinon l'appli y revient.
  try { sessionStorage.removeItem('mavigne_tuto'); sessionStorage.removeItem('mavigne_tuto_auto'); } catch (e) { _avale(e, '_sortir#session'); }
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
// ★★ TUTO-5 (§362) — LE PANNEAU LIT LUI-MÊME L'APPLI. Au lieu d'attendre ses messages (TUTO-4 : s'ils s'arrêtaient, le
//   panneau disait « ne répond pas » alors qu'elle allait bien), il lui demande toutes les 300 ms — même site, il en a le
//   droit — « cette étape est-elle faite chez toi ? ». Par des fonctions en LECTURE SEULE (_mvTutoMiroirFait, _mvTutoAvant,
//   _mvTutoValeur), plus _mvTutoAnneau pour l'anneau doré. Jamais le document ni les données de l'appli.
function _hoteLu() {
  var h = _hote();
  try { return (h && typeof h._mvTutoMiroirFait === 'function') ? h : null; } catch (e) { return null; }
}
var _luA = 0;
function _miroirLire() {
  var now = Date.now(); if (now - _luA < 150 || E.aligne || !E.debut) return; _luA = now;
  var h = _hoteLu(), e = _e();
  if (!h || !E.actif || !e) return;
  try {
    if (!E.memoHote) E.memoHote = h._mvTutoAvant(E.t.id) || {};
    var k = -1;
    if (E.etat === 'attente' && !E.montre && now - E.debut >= 250) {
      for (var j = E.i; j < Math.min(E.t.etapes.length, E.i + 3); j++) { if (h._mvTutoMiroirFait(E.t.id, j, E.memoHote)) k = j; }
      if (k === E.i && e.type === 'taper') {   // une saisie : on attend qu'elle soit posée
        var s = h._mvTutoValeur(E.t.id, E.i) || {};
        if (s.v !== E.lu.v) { E.lu = { v: s.v, depuis: now }; k = -1; }
        else if (s.focus && now - E.lu.depuis < 800) k = -1;   // posée : champ quitté, ou 0,8 s sans frappe
      }
    }
    h._mvTutoAnneau(E.t.id, (E.etat === 'attente' && k < 0) ? E.i : -1);
    if (k >= 0) {
      E.miroirJusqua = Math.max(typeof E.miroirJusqua === 'number' ? E.miroirJusqua : -1, k);
      if (k === E.i && e.type === 'taper' && E.lu.v) E.miroirVal = { i: E.i, v: String(E.lu.v) };
      _jouerMiroir();
    }
  } catch (er) { _avale(er, '_miroirLire'); }
}
// Le panneau démarre là où vous êtes : les étapes de CHEMIN (aller vers un module, choisir un onglet) déjà faites dans
// l'appli sont jouées ici tout de suite, avant la première consigne — pas de rattrapage en rafale ensuite.
function _alignerDepart(fin) {
  var h = _hoteLu(), memo = {};
  if (!h) { E.aligne = false; fin(); return; }
  try { memo = h._mvTutoAvant(E.t.id) || {}; } catch (e) { memo = {}; }
  E.memoHote = memo; E.aligne = true;
  var finir = function () { E.aligne = false; _etat('depart', E.i); fin(); };
  (function pas() {
    var e = _e(), deja = false;
    if (!e || !(e.chemin || e.type === 'aller')) { finir(); return; }
    try { deja = !!h._mvTutoMiroirFait(E.t.id, E.i, memo); } catch (er) { deja = false; }
    if (!deja) { finir(); return; }
    var t0 = Date.now(), coups = 0;
    (function joue() {
      var ok = e.type === 'aller' ? _pageActive(e.page) : !!e.fait(E.memo);
      if (ok) { E.i++; pas(); return; }
      if (Date.now() - t0 > 3000) { finir(); return; }
      if (coups < 3) {
        coups++;
        if (e.type === 'aller') { var n = _nav(e.page); if (n) n.el.click(); }
        else { var c = _q(e.cible); if (c) c.click(); }
      }
      setTimeout(joue, 250);
    })();
  })();
}
function _bloque() {
  _css();
  var dansCadre = !!(window.parent && window.parent !== window), hote = dansCadre ? window.parent : window.opener;
  var ls = document.getElementById('login-screen'); if (ls) ls.style.display = 'none';
  var sp = document.getElementById('splash-screen'); if (sp) sp.style.display = 'none';
  var f = document.createElement('div');
  f.className = 'mvtu-bloque';
  f.innerHTML = '<div role="alertdialog" aria-label="Mise à jour à finir"><h2>Une mise à jour à finir</h2>'
    + '<p>Ce tuto a besoin de la dernière version de l’appli. Fermez tous les onglets Ma Vigne, puis rouvrez-la : le tuto marchera.</p>'
    + '<button type="button" class="mvtu-b1 mvtu-large" data-b="ok">Fermer</button></div>';
  f.addEventListener('click', function (ev) {
    if (!ev.target.closest('[data-b]')) return;
    if (hote) { try { hote.postMessage({ mvtu: 'fermer' }, window.location.origin); } catch (e) { _avale(e, '_bloque'); } if (!dansCadre) window.close(); return; }
    try { sessionStorage.removeItem('mavigne_tuto'); sessionStorage.removeItem('mavigne_tuto_auto'); } catch (e) { _avale(e, '_bloque#session'); }
    window.location.replace(window.location.pathname);
  });
  document.body.appendChild(f);
}
function _jouerMiroir() {
  var e = _e();
  if (!E.actif || !e || E.etat !== 'attente' || E.montre || E.joue === E.i || !(E.miroirJusqua >= E.i)) return;
  _msg('ok', 'Fait sur votre domaine : la fenêtre suit.');
  E.vite = true;
  if (e.type === 'regarder') { _confirme(); return; }
  if (e.type === 'taper' && e.facultatif && !(E.miroirVal && E.miroirVal.i === E.i)) { _passer(); return; }
  _jouerVite();
}
// ★ TUTO-6 (§363) — LE GESTE D'UN COUP. En miroir, le geste est déjà fait sur le domaine : le panneau le refait ici sans le
//   doigt animé (1,1 s de trajet et d'appui), et la pause de réussite tombe à 0,3 s ; plusieurs étapes d'avance s'enchaînent.
function _jouerVite() {
  var e = _e(); if (!e || E.etat !== 'attente') return;
  // TUTO-7 : la lecture repasse toutes les 150 ms ; sans ce verrou, le même geste se rejouait tant que l'écran n'avait pas
  //   changé (la pastille re-cliquée rouvrait la fenêtre et effaçait les choix). Un geste par étape.
  if (E.joue === E.i) return;
  E.joue = E.i;
  _etat('vites', ((window.__MV_TUTO_ETAT && window.__MV_TUTO_ETAT.vites) || 0) + 1);
  if (e.type === 'toucher') { var c = _q(e.cible); if (c) c.click(); return; }
  if (e.type === 'aller') {
    var n = 0;
    (function va() { if (!E.actif || _pageActive(e.page) || n++ > 4) return; var m = _nav(e.page); if (m) m.el.click(); setTimeout(va, 120); })();
    return;
  }
  if (e.type === 'choisir') {
    (function choix() { var o = _optCourante(); if (!o || !E.actif || E.etat !== 'attente') return; var el = _q(o); if (el) el.click(); setTimeout(choix, 60); })();
    return;
  }
  if (e.type === 'taper') {
    var inp = _q(e.cible); if (!inp) return;
    var mv = (E.miroirVal && E.miroirVal.i === E.i && e.valide(E.miroirVal.v)) ? E.miroirVal.v : e.exemple;
    inp.value = String(mv);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    _confirme();
  }
}
function _rejouer(id) {
  window.location.replace(window.location.pathname + '?tuto=' + encodeURIComponent(id) + (_cadre() ? '&tuto_cadre=1' : ''));
}
/* ★★ COTE-1 (§424) — LE PANNEAU COLLÉ À DROITE, L'APPLI RESSERRÉE À CÔTÉ. Nico (20/10), capture à l'appui : le panneau posé
   par-dessus la droite de l'appli cachait le bouton à toucher (« Noter des mesures », au bout de l'en-tête des Maturités) ;
   l'anneau doré était bien sur le vrai bouton, mais dessous. TUTO-2 avait choisi « un panneau qui se déplace plutôt qu'une
   appli qu'on retaille » : ce choix s'inverse. Le panneau prend sa largeur à la page ; l'appli — et tout ce qu'elle pose sur
   la fenêtre : fenêtres, tiroirs, barres, messages, recherche — vit dans la place qui reste. Rien ne passe dessous.
   Seuil 1 280 px (au-dessous, l'appli garderait moins de ~850 px : plein écran, comme au téléphone). Largeur de 360 px (le
   plus petit téléphone courant) à 420 px, 28 % de l'écran entre les deux. Une fenêtre rétrécie sous le seuil APRÈS
   l'ouverture rend au panneau son ancienne place, flottante : cas limite assumé.
   ⚠ Une couche fixe NEUVE de la feuille (voile, tiroir, barre, message centré) se range ici ou s'exempte dans
   mv-harnais-cote1, qui lit la feuille et rougit sinon ; test:tutos mesure la page au navigateur (rien sous le panneau). */
var COTE_MQ = '(min-width: 1280px)';
var COTE_L = 'clamp(360px, 28vw, 420px)';
var COTE_VOILES = ['.overlay', '.mvv-ov', '.mvz-ov', '.pil-scrim', '.pil-diagwrap', '.pil-dz-shw', '.pil-dz-fm', '.mvds-bg', '.mv-pal-voile', '.ck-agr', '.trn-ov', '.trn-layer', '#mv-perime-ov', '#mv-expired-ov', '#ovCloture', '.dgn-voile'];
var COTE_DROITE = ['.pil-drawer', '.dgn-tiroir'];
var COTE_BARRES = ['#demo-banner', '#mv-trial-bar', '#mv-maj-barre', '.trn-toast', '.pl2-abar', '.pl2-mbar'];
var COTE_CENTRES = ['#mv-toast', '#pv-toast', '.mv-pal', '.pil-dz-pk', '.vt-bot', '.dgn-fen'];
var COTE_BOUTONS = ['#trac-fab', '#phyto-fab'];
function _coteCss() {
  var h = function (l) { return l.map(function (s) { return 'html.mvtu-cote ' + s; }).join(','); };
  return '@media ' + COTE_MQ + '{'
    + 'html.mvtu-cote .mvtu-panneau{top:0;bottom:0;right:0;width:' + COTE_L + ';border-radius:0;border-width:0 0 0 1px;box-shadow:none}'
    + 'html.mvtu-cote #app-root{padding-right:' + COTE_L + '}'
    + h(COTE_VOILES) + '{right:' + COTE_L + '!important}'
    + h(COTE_DROITE) + '{right:' + COTE_L + '!important}'
    + h(COTE_BARRES) + '{right:' + COTE_L + '!important;width:auto!important}'
    + h(COTE_CENTRES) + '{left:calc((100% - ' + COTE_L + ') / 2)!important}'
    + h(COTE_BOUTONS) + '{right:calc(' + COTE_L + ' + 24px)!important}'
    + '}';
}
// La page change de largeur sans que la fenêtre bouge : on prévient tout ce qui se recale sur un redimensionnement (barre
// latérale, carte, graphiques, grilles) — le geste de coquille.js après avoir plié la barre (PRO-1).
function _coteRecaler() {
  setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) { _avale(e, '_coteRecaler'); } }, 60);
}
function _aCoteDispo() {
  return !!(window.matchMedia && window.matchMedia(COTE_MQ).matches && !window.matchMedia('(pointer: coarse)').matches);
}
// Depuis le vrai domaine. Ordinateur : le panneau. Sinon : on note où revenir, puis on recharge en entraînement.
function _lancer(id) {
  if (!_tuto(id)) return;
  if (_aCoteDispo()) { _panneau(id); return; }
  try { sessionStorage.setItem('mavigne_tuto_retour', window.location.pathname + window.location.search + window.location.hash); }
  catch (e) { _avale(e, '_lancer'); }
  window.location.assign(window.location.pathname + '?tuto=' + encodeURIComponent(id));
}
// Côté vrai domaine : la vérification que le panneau vient lire (même vérification que le tuto — l'écran a vraiment changé —,
// sauf les étapes qui ont leur `reel`, les valeurs du domaine fictif n'existant pas ici).
function _miroirFait(e, memo) {
  if (!e) return false;
  if (e.reel) return !!e.reel(memo || {});
  if (e.type === 'toucher') return !!e.fait(memo || {});
  if (e.type === 'aller') return _pageActive(e.page);
  if (e.type === 'taper') { var c = _q(e.cible); return !!(c && e.valide(c.value)); }
  return false;
}
// L'anneau doré sur le vrai bouton : dessiné À LA DEMANDE du panneau, qui le redemande à chaque tour ; il s'efface tout seul
// s'il ne le redemande plus (panneau fermé, tuto fini) — aucun lien de vie à tenir entre les deux fenêtres.
var AN = { el: null, id: '', i: -1, vu: 0, tourne: false };
function _anneauDessin() {
  if (!AN.el) return;
  var actif = AN.i >= 0 && Date.now() - AN.vu < 1200, t = actif ? _tuto(AN.id) : null, e = t ? t.etapes[AN.i] : null, el = null;
  if (e && e.type === 'aller') { var n = _nav(e.page); el = n ? n.el : null; }
  else if (e && e.type === 'choisir') el = e.cibleReel ? _q(e.cibleReel) : null;
  else if (e && e.type !== 'regarder') el = _q(e.cible);
  if (!el || !_vis(el)) AN.el.style.opacity = '0';
  else {
    var r = el.getBoundingClientRect();
    AN.el.style.left = Math.round(r.left - 5) + 'px'; AN.el.style.top = Math.round(r.top - 5) + 'px';
    AN.el.style.width = Math.round(r.width + 10) + 'px'; AN.el.style.height = Math.round(r.height + 10) + 'px';
    AN.el.style.opacity = '1';
  }
  if (actif) window.requestAnimationFrame(_anneauDessin); else { AN.tourne = false; AN.el.style.opacity = '0'; }
}
function _anneau(id, i) {
  _css();
  if (!AN.el) { AN.el = document.createElement('div'); AN.el.className = 'mvtu-anneau'; AN.el.setAttribute('aria-hidden', 'true'); document.body.appendChild(AN.el); }
  AN.id = String(id || ''); AN.i = typeof i === 'number' ? i : -1; AN.vu = Date.now();
  if (AN.i < 0) { AN.el.style.opacity = '0'; return; }
  if (!AN.tourne) { AN.tourne = true; window.requestAnimationFrame(_anneauDessin); }
}
var _ecoute = false;
function _fermerPanneau(remplace) {
  var p = document.getElementById('mvtu-panneau'); if (p && p.parentNode) p.parentNode.removeChild(p);
  _anneau('', -1);
  // COTE-1 : la page reprend toute sa largeur — sauf quand un panneau en remplace un autre (pas de va-et-vient)
  if (!remplace && document.documentElement.classList.contains('mvtu-cote')) { document.documentElement.classList.remove('mvtu-cote'); _coteRecaler(); }
}
function _panneau(id) {
  var t = _tuto(id); if (!t) return;
  _css();
  if (typeof window.closeAide === 'function') { try { window.closeAide(); } catch (e) { _avale(e, '_panneau#aide'); } }
  _fermerPanneau(true);
  var url = window.location.pathname + '?tuto=' + encodeURIComponent(id) + '&tuto_cadre=1';
  var p = document.createElement('div');
  p.id = 'mvtu-panneau';
  p.className = 'mvtu-panneau';
  p.setAttribute('role', 'complementary');
  p.setAttribute('aria-label', 'Entraînement');
  p.innerHTML = '<div class="mvtu-p-hd"><span>Entraînement</span>'
    + '<button type="button" class="mvtu-p-b" data-p="fenetre">Fenêtre à part</button>'
    + '<button type="button" class="mvtu-p-b" data-p="fermer" aria-label="Fermer l’entraînement">' + _ic('croix', 16) + '</button></div>'
    + '<div class="mvtu-p-corps"><iframe class="mvtu-p-if" title="' + _esc(t.titre) + '" src="' + _esc(url) + '"></iframe>'
    + '<div class="mvtu-p-load" role="status">Préparation de l’entraînement…</div></div>';
  p.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-p]'); if (!b) return;
    var a = b.getAttribute('data-p');
    if (a === 'fermer') _fermerPanneau();
    else if (a === 'fenetre') { var w = window.open(url, 'mvtuto', 'popup=yes,width=440,height=900'); if (w) _fermerPanneau(); }
  });
  document.body.appendChild(p);
  document.documentElement.classList.add('mvtu-cote');   // ★ COTE-1 : la page lui fait sa place
  _coteRecaler();
  // TUTO-6 : « Préparation de l'entraînement… » jusqu'à ce que la première consigne soit prête (lue dans le cadre).
  var ifr = p.querySelector('iframe'), lo = p.querySelector('.mvtu-p-load'), t0 = Date.now();
  (function pret() {
    var ok = false;
    try { var s = ifr.contentWindow && ifr.contentWindow.__MV_TUTO_ETAT; ok = !!(s && s.etape >= 1 && typeof s.depart === 'number'); } catch (e) { ok = true; }
    if (ok || Date.now() - t0 > 15000 || !p.parentNode) { if (lo && lo.parentNode) lo.parentNode.removeChild(lo); return; }
    setTimeout(pret, 150);
  })();
  if (!_ecoute) {
    _ecoute = true;
    window.addEventListener('message', function (ev) {
      if (ev.origin !== window.location.origin || !ev.data || ev.data.mvtu !== 'fermer') return;
      _fermerPanneau();
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
    + (_aCoteDispo() ? 'Il s’ouvre à côté de l’appli, qui se resserre pour lui faire de la place : vous pouvez faire le geste pour de vrai en même temps.' : 'À la fin, un bouton vous y ramène.') + '</p></div>'
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
/* ★ TUTO-8 (§388) — UNE VENDANGE POUR LE DOMAINE FICTIF. Les maturités se notent sur la vendange EN COURS : des dates
   écrites en dur deviendraient une vendange passée l'an prochain, et « Noter des mesures » disparaîtrait (il n'est offert
   que pour la vendange en cours). Les dates se calculent donc au chargement, à quelques jours d'aujourd'hui. */
function _tuJour(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function _tuCave() {
  var a = function (id, p, j, v) { return { id: 'tu_' + id, parcelle: p, date: _tuJour(j), mode: 'sucre', val: v, spd: 16.83 }; };
  return { config: { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140, sucre_par_degre: 16.83, mat_four: { r: { min: 205, max: 225 }, b: { min: 195, max: 215 } } },
    analyses: [a(1, 'Les Charmes', -6, 196), a(2, 'Les Charmes', -2, 204), a(3, 'Clos du Moulin', -5, 203), a(4, 'Clos du Moulin', -1, 211), a(5, 'Vieilles Vignes', -2, 199)],
    recoltes: [], cuves_vinif: [] };
}
/* ★ TUTO-9 (§423) — UN JOURNAL POUR LE DOMAINE FICTIF. Le tuto « corriger l'équipe d'une validation » (ACCV-4, §419) vise le
   bouton « Équipe » d'une validation : le domaine fictif n'en avait AUCUNE (« Journal vide »), le tuto restait à l'étape 1
   partout. test:tutos ne l'a pas vu au téléphone : il y jouait un autre tuto sous son nom (§423b). La première validation est
   celle que le tuto corrige : Paul l'a validée seul, Jean et Sophie ont fait le travail. Dates CALCULÉES (_tuJour), comme la
   vendange : ce sont toujours les derniers jours. */
function _tuJournal() {
  var v = function (n, j, p, t, qui, eq) { return { id: 'tu_j' + n, date: _tuJour(j), parcelle: p, tache: t, qui: qui, statut: 'Validé', equipe: eq.length > 0, membresEquipe: eq }; };
  return [v(1, -1, 'Les Charmes', 'Relevage', 'Paul', []), v(2, -1, 'Clos du Moulin', 'Relevage', 'Marie', ['Jean']), v(3, -2, 'Vieilles Vignes', 'Palissage', 'Sophie', ['Paul'])];
}
function _jeqCorrigee(memo) {
  var t0 = memo && memo.jeq0;
  if (!t0) return false;
  return (window.JOURNAL || []).some(function (x) { return !!(x && x.eqCorr && String(x.eqCorr.le || '') >= t0); });
}
function _charger() {
  var d = JSON.parse(JSON.stringify(TU_DONNEES));
  ['config', 'membres', 'saisons', 'taches', 'activites', 'conducteurs', 'parcelles'].forEach(function (k) {
    if (d[k] === undefined || typeof window.applyFbData !== 'function') return;
    try { window.applyFbData(k, d[k]); } catch (e) { _avale(e, '_charger#' + k); }
  });
  if (typeof window.applyFbData === 'function') { try { window.applyFbData('cave_vendange', _tuCave()); } catch (e) { _avale(e, '_charger#cave_vendange'); } }
  if (typeof window.applyFbData === 'function') { try { window.applyFbData('journal', _tuJournal()); } catch (e) { _avale(e, '_charger#journal'); } }   // TUTO-9
    if (typeof window.applyFbData === 'function') { try { window.applyFbData('intrants', _tuIntrants()); } catch (e) { _avale(e, '_charger#intrants'); } }   // FERTI-8 (§466)
}
function _demarrer() {
  var t = _tuto(String(window.__MV_TUTO || ''));
  if (!t || E.actif) return;
  E.t = t; E.i = 0; E.memo = {}; E.lance = Date.now();
  // TUTO-6 : rien ne lit l'appli avant la première consigne — dans un cadre, l'alignement du départ passe d'abord.
  E.debut = 0; E.aligne = _cadre();
  if (t.avant) { try { t.avant(E.memo); } catch (e) { _avale(e, '_demarrer#avant'); } }
  _etat('fini', false);
  _etat('types', t.etapes.map(function (x) { return x.type; }));
  // TUTO-7 : les étapes que le miroir suit une à une (un choix sans `reel` se rattrape à l'étape suivante).
  _etat('suivis', t.etapes.map(function (x) { return x.type !== 'regarder' && (x.type !== 'choisir' || !!x.reel); }));
  E.actif = true;
  _couches();
  document.addEventListener('click', _surClic, true);
  document.addEventListener('input', _surSaisie, true);
  document.addEventListener('keydown', _surTouche, true);
  window.requestAnimationFrame(_boucle);
  setTimeout(function () { if (_cadre()) _alignerDepart(_montrer); else _montrer(); }, 300);
}

window._mvTutoPrepare = _prepare;
window._mvTutoCharger = _charger;
window._mvTutoLancer = _demarrer;
window._mvTutoAideBloc = _aideBloc;
window._mvTutoAideBrancher = _aideBrancher;
window._mvTutoListe = function () { return TU_TUTOS.map(function (t) { return t.id; }); };
window._mvTutoSortir = _sortir;
window._mvTutoBloque = _bloque;
// Vérification du miroir (lecture seule) : l'étape i du tuto est-elle faite sur CE domaine ? mv-tutos-jeu.mjs s'en sert.
window._mvTutoAvant = function (id) { var t = _tuto(id), m = {}; if (t && t.avant) t.avant(m); return m; };
window._mvTutoMiroirFait = function (id, i, memo) { var t = _tuto(id); return t ? _miroirFait(t.etapes[i], memo || {}) : false; };
// TUTO-5 : la saisie de l'étape i sur CE domaine (valeur, et le champ a-t-il la main) ; l'anneau doré à la demande du panneau.
window._mvTutoValeur = function (id, i) { var t = _tuto(id), e = t ? t.etapes[i] : null, c = e && e.cible ? _q(e.cible) : null; return c ? { v: c.value, focus: document.activeElement === c } : { v: undefined, focus: false }; };
window._mvTutoAnneau = _anneau;
// ★ COTE-1 (§424) : la largeur que le panneau prend à la page (0 s'il n'est pas collé) — coquille.js en juge la barre latérale.
window._mvTutoCote = function () {
  var p = document.getElementById('mvtu-panneau');
  if (!p || !document.documentElement.classList.contains('mvtu-cote') || !window.matchMedia || !window.matchMedia(COTE_MQ).matches) return 0;
  return Math.round(p.getBoundingClientRect().width) || 0;
};
