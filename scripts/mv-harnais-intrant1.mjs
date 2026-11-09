/* ───────────────────────────────────────────────────────────────────────────────────────────────────────────
   HARNAIS — INTRANT-1 (§553) : LA FICHE D'UN INTRANT — LA PIÈCE, CORRIGER, RETIRER UN ACHAT, SUPPRIMER
   Lancer :          node scripts/mv-harnais-intrant1.mjs
   Contre-épreuves : node scripts/mv-harnais-intrant1.mjs --contre

   POURQUOI IL EXISTE
   Remonté du terrain (09/11) : des piquets enregistrés en kg. Trois défauts dans La Réserve : (1) la liste « Unité »
   ne proposait que kg et L ; (2) « Par unités » voulait dire « sacs × contenance » — sans contenance, l'achat était
   refusé… mais la fiche neuve était DÉJÀ dans la liste, et le second essai en créait une deuxième ; (3) rien ne
   permettait de corriger une fiche, d'en retirer un achat ni de la supprimer.
   Ce harnais JOUE les vraies fonctions, extraites de src/reserve.js, sur un petit DOM : les unités et leur accord,
   le formulaire d'achat (mots, mode, refus sans fiche fantôme), la carte, la fiche (corriger sans reconstruire,
   retirer un achat puis Annuler, supprimer puis Annuler, le refus quand une opération cite la fiche), et le câblage
   (fenêtre, tuto, Pilotage, feuille, classement AJOUR-1, liste du lanceur).
   ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rsv: lire('src/reserve.js'), pil: lire('src/pilotage.js'), tu: lire('src/tutos.js'), css: lire('src/styles.css'),
  aj: lire('scripts/mv-harnais-ajour1.mjs'), liste: lire('scripts/mv-harnais-liste.mjs'), couv: lire('scripts/tutos-couverture.json') };

// Une fonction par comptage d'accolades, chaînes et commentaires sautés (trois formes de déclaration).
function fonction(src, nom) {
  const formes = ['function ' + nom + '(', 'window.' + nom + ' = function(', 'window.' + nom + '=function('];
  let i = -1; for (const f of formes) { i = src.indexOf(f); if (i >= 0) break; }
  if (i < 0) throw new Error('introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') p++; else if (c === '}') { p--; if (p === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fin introuvable : ' + nom);
}
function decl(src, nom) { const m = new RegExp('var ' + nom.replace('$', '\\$') + '\\s*=[\\s\\S]*?;[^\\n]*\\n').exec(src); if (!m) throw new Error('déclaration introuvable : ' + nom); return m[0]; }
const FONCTIONS = ['_rid', '_fmt', '_frDate', '_uniqPush', '_invOuv', '_achatsQ', '_consoCuvier', '_conso', '_treatSurface', '_stock', '_nbUnites',
  '_rsvUnitesPour', '_rsvUniteDefaut', '_rsvContLblDe', '_rsvU', '_rsvPrixU', '_rsvPrixUSansPrix', '_eur2', '_consoSrcLbl', '_rsvNegEstime', '_consoCuvierEstime',
  '_rsvIntrantsHtml', '_rsvOnProdChange', '_rsvNorm', '_rsvEphyOn', '_rsvNpShow', '_rsvEphyReset', '_rsvAteNote', '_rsvNpCatChange', '_rsvCurProd', '_rsvContLbl',
  '_rsvCond', '_rsvPl', '_rsvContQuoi', '_rsvContTitre', '_rsvContEx', '_rsvUpdContHint', '_rsvSetSaisie', '_rsvCalcQ', '_rsvPrixOuNull', '_rsvSaveAchat',
  '_rsvAteDe', '_rsvPfProd', '_rsvProdRefs', '_rsvPfUnites', '_rsvPfLibelles', '_rsvPfListe', '_rsvOpenProd', '_rsvPfMaj', '_rsvSaveProd', '_rsvDelAchat', '_rsvDelProd'];
const DECLS = ['_RSV_UNITE_PIECE', '_CATLBL', '_CATCLS', '_CAT2ATE', '_ATELBL', '_ATECOL', '_rsvPfId', '_RSV_UNITES', '_RSV_CATS'];

// Le petit DOM : des champs qu'on remplit, des boîtes qu'on lit.
function monter(S, donnees, opts) {
  opts = opts || {};
  const els = {}, el = (id) => (els[id] = els[id] || { id, value: '', textContent: '', innerHTML: '', placeholder: '', disabled: false, readOnly: false, style: {}, classList: { toggle() {}, add() {}, remove() {} }, focus() {} });
  const journal = { toasts: [], sauv: 0, rendus: 0, ouverts: [], fermes: [], annuler: null, msgAnnuler: '' };
  let seq = 0;
  const ctx = {
    INTRANTS: donnees, console: { log() {} },
    isAdmin: () => opts.admin !== false,
    showToast: (m) => journal.toasts.push(String(m)),
    saveIntrants: () => { journal.sauv++; },
    _rsvRenderBody: () => { journal.rendus++; },
    _rsvEnsureOverlays() {}, _mvToday: () => '2026-11-09', _today: () => '2026-11-09',
    _escHtml: (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    _escAttr: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    _mvIcon: () => '', _mvIconInline: () => '',
    _rsvSaisie: 'u', _rsvEphySel: null, _rsvEphyRes: [],
    document: { getElementById: el },
  };
  ctx.window = { CAVE_VENDANGE: opts.cuvier || null, CAVE_ELEVAGE: opts.chai || null, EPHY: null,
    showToastAnnuler: (m, f) => { journal.msgAnnuler = String(m); journal.annuler = f; },
    openOv: (id) => journal.ouverts.push(id), closeOv: (e, id) => journal.fermes.push(id),
    _mvNomPrestation: (n) => /prestation/i.test(String(n || '')), _mvFactureOu: () => '' };
  vm.createContext(ctx);
  const code = DECLS.map((d) => decl(S.rsv, d)).join('') + FONCTIONS.map((f) => fonction(S.rsv, f).replace(/^window\.(\w+)\s*=\s*function\(/, 'function $1(')).join('\n')
    + '\nthis.F = {' + FONCTIONS.map((f) => f + ':' + f).join(',') + '}; this.lirePf = function(){ return _rsvPfId; };';
  vm.runInContext(code, ctx);
  return { ctx, F: ctx.F, els, el, journal };
}
const copie = (x) => JSON.parse(JSON.stringify(x));
const sp = (x) => String(x == null ? '' : x).replace(/\u00a0/g, ' ');   // l'écran sépare nombre et unité d'une espace insécable
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
const base = () => ({ produits: [
    { id: 'p1', nom: 'Piquets acacia', cat: 'vigne', unite: 'kg', contenance: 0, contLbl: 'sac', conso_src: 'manual', conso_manuel: 0, amm: '', x: 1 },
    { id: 'p2', nom: 'Bouillie bordelaise', cat: 'phyto', unite: 'kg', contenance: 25, contLbl: 'sac', conso_src: 'manual', conso_manuel: 5, amm: '2010001' },
    { id: 'p3', nom: 'Agrafes', cat: 'vigne', unite: 'kg', contenance: 0, contLbl: 'sac', conso_src: 'manual', conso_manuel: 0, amm: '' }],
  achats: [{ id: 'a1', prodId: 'p1', date: '2026-11-06', four: 'Comptoir', q: 500, unites: null, fact: 'F-12', prix: 425 },
    { id: 'a2', prodId: 'p2', date: '2026-10-01', four: 'Coop', q: 50, unites: 2, prix: 120 },
    { id: 'a3', prodId: 'p3', date: '2026-09-01', four: 'Coop', q: 10, unites: null, prix: null },
    { id: 'a4', prodId: 'p3', date: '2026-10-15', four: 'Coop', q: 5, unites: null, prix: null }],
  inventaires: [{ prodId: 'p3', date: '2026-08-01', q: 2 }, { prodId: 'p2', date: '2026-08-01', q: 1 }], futs: [], fertil: [] });

function jouer(S) {
  // ── A. LES UNITÉS ──
  let M = monter(S, base()), F = M.F;
  t('A · la pièce pour les fournitures (vigne, cave, tracteur, général), jamais pour le phyto ni l’œno',
    F._rsvUnitesPour('vigne').join() === 'kg,L,pièce' && F._rsvUnitesPour('trac').join() === 'kg,L,pièce' && F._rsvUnitesPour('gen').join() === 'kg,L,pièce'
    && F._rsvUnitesPour('phyto').join() === 'kg,L' && F._rsvUnitesPour('oeno').join() === 'kg,L');
  t('A · la pièce d’office pour vigne, cave et tracteur ; kg pour le phyto, l’œno et le général',
    ['vigne', 'cave', 'trac'].every((c) => F._rsvUniteDefaut(c) === 'pièce') && ['phyto', 'oeno', 'gen'].every((c) => F._rsvUniteDefaut(c) === 'kg'));
  t('A · « pièce » s’accorde (0 et 1 pièce, 2 et 500 pièces) ; kg, L et une unité d’avant ne bougent pas',
    F._rsvU('pièce', 0) === 'pièce' && F._rsvU('pièce', 1) === 'pièce' && F._rsvU('pièce', 2) === 'pièces' && F._rsvU('pièce', 500) === 'pièces'
    && F._rsvU('kg', 500) === 'kg' && F._rsvU('L', 3) === 'L' && F._rsvU('g', 9) === 'g' && F._rsvU('', 5) === 'kg');
  t('A · le contenant suit l’unité : sac (kg), bidon (L), lot (pièce)', F._rsvContLblDe('kg') === 'sac' && F._rsvContLblDe('L') === 'bidon' && F._rsvContLblDe('pièce') === 'lot');

  // ── B. LE FORMULAIRE D'ACHAT ──
  M = monter(S, base()); F = M.F;
  M.el('mvr-a-prod').value = '__new__'; M.el('mvr-np-cat').value = 'vigne'; F._rsvNpCatChange();
  t('B · « Fournitures vigne » : la liste propose kg, L, pièce, et la pièce est choisie d’office',
    /value="kg"/.test(M.els['mvr-np-unite'].innerHTML) && /value="pièce"/.test(M.els['mvr-np-unite'].innerHTML) && M.els['mvr-np-unite'].value === 'pièce');
  M.el('mvr-np-cat').value = 'phyto'; F._rsvNpCatChange();
  t('B · « Phyto » : la pièce disparaît de la liste, kg d’office', !/pièce/.test(M.els['mvr-np-unite'].innerHTML) && M.els['mvr-np-unite'].value === 'kg');
  M.el('mvr-np-cat').value = 'vigne'; F._rsvNpCatChange(); F._rsvOnProdChange();
  t('B · une fiche neuve sans contenance s’ouvre sur « Au total »', M.ctx._rsvSaisie === 'q');
  t('B · les mots suivent la pièce : « Par lots », « Nombre de lots », « en pièces », « Pièces dans un lot »',
    M.els['mvr-sg-u'].textContent === 'Par lots' && M.els['mvr-a-ulbl'].textContent === 'Nombre de lots' && M.els['mvr-a-qunit'].textContent === 'en pièces' && M.els['mvr-np-contl'].textContent === 'Pièces dans un lot');
  M.el('mvr-a-prod').value = 'p2'; F._rsvOnProdChange();
  t('B · une fiche qui a une contenance s’ouvre sur « Par sacs »', M.ctx._rsvSaisie === 'u' && M.els['mvr-sg-u'].textContent === 'Par sacs');

  // ── C. ENREGISTRER UN ACHAT : TOUT SE VÉRIFIE AVANT DE CRÉER LA FICHE ──
  M = monter(S, base()); F = M.F;
  M.el('mvr-a-prod').value = '__new__'; M.el('mvr-np-cat').value = 'vigne'; F._rsvNpCatChange();
  M.el('mvr-np-nom').value = 'Piquets châtaignier'; M.el('mvr-np-src').value = 'manual';
  F._rsvSetSaisie('u'); M.el('mvr-a-unites').value = '500'; F._rsvSaveAchat();
  const n0 = M.ctx.INTRANTS.produits.length;
  t('C · « Par lots » sans contenance : refusé, le message dit quoi faire, et AUCUNE fiche fantôme',
    n0 === 3 && M.journal.sauv === 0 && /combien de pièces dans un lot/.test(M.journal.toasts.pop() || ''));
  F._rsvSetSaisie('q'); M.el('mvr-a-qte').value = '500'; F._rsvSaveAchat();
  const neuves = M.ctx.INTRANTS.produits.filter((p) => p.nom === 'Piquets châtaignier');
  t('C · « Au total » 500 : UNE seule fiche, en pièces (lot), avec son achat de 500 ; un seul enregistrement',
    neuves.length === 1 && neuves[0].unite === 'pièce' && neuves[0].contLbl === 'lot' && M.journal.sauv === 1
    && M.ctx.INTRANTS.achats.some((a) => a.prodId === neuves[0].id && a.q === 500 && a.unites === null));
  M = monter(S, base()); F = M.F;
  M.el('mvr-a-prod').value = '__new__'; M.el('mvr-np-cat').value = 'vigne'; F._rsvNpCatChange(); M.el('mvr-np-nom').value = 'piquets ACACIA';
  F._rsvSetSaisie('q'); M.el('mvr-a-qte').value = '10'; F._rsvSaveAchat();
  t('C · un nom qui existe déjà (casse, accents) : refusé, rien d’écrit', M.ctx.INTRANTS.produits.length === 3 && M.journal.sauv === 0 && /existe déjà/.test(M.journal.toasts.pop() || ''));
  M.el('mvr-np-nom').value = 'Prestation arrachage'; F._rsvSaveAchat();
  t('C · une prestation : refusée AVANT toute création', M.ctx.INTRANTS.produits.length === 3 && M.journal.sauv === 0);
  M = monter(S, base()); F = M.F;
  M.el('mvr-a-prod').value = 'p2'; F._rsvOnProdChange(); M.el('mvr-a-unites').value = '6'; F._rsvSaveAchat();
  const a6 = M.ctx.INTRANTS.achats[M.ctx.INTRANTS.achats.length - 1];
  t('C · « Par sacs » sur une fiche de 25 kg : 6 sacs = 150 kg, le nombre de sacs gardé', a6.prodId === 'p2' && a6.q === 150 && a6.unites === 6);
  M.el('mvr-a-prod').value = 'p1'; F._rsvOnProdChange(); M.el('mvr-a-qte').value = ''; F._rsvSaveAchat();
  t('C · « Au total » vide : refusé (« Indique la quantité totale »)', /Indique la quantité totale/.test(M.journal.toasts.pop() || '') && M.ctx.INTRANTS.achats.length === 5);

  // ── D. LA CARTE ──
  M = monter(S, base()); F = M.F;
  M.ctx.INTRANTS.produits[0].unite = 'pièce';
  const h = F._rsvIntrantsHtml();
  t('D · la carte (admin) : « Modifier » avec son identifiant, le stock « 500 pièces en stock », le prix « €/pièce »',
    /data-tuto="rsv\.modifier" data-pid="p1" onclick="_rsvOpenProd\(this\.dataset\.pid\)"/.test(h) && /data-tuto="rsv\.stock" data-pid="p1"/.test(h)
    && h.includes('>500</span><span class="mvr-psu">pièces en stock</span>') && /€\/pièce/.test(h));
  const M2 = monter(S, base(), { admin: false });
  t('D · sans droit d’administrateur, pas de « Modifier »', !/rsv\.modifier/.test(M2.F._rsvIntrantsHtml()));

  // ── E. LA FICHE : CORRIGER SANS RECONSTRUIRE ──
  M = monter(S, base()); F = M.F;
  F._rsvOpenProd('p1');
  t('E · « Modifier » ouvre la fiche remplie : nom, type, unité (kg, L, pièce), la liste de ses achats, « Supprimer l’intrant et son achat »',
    M.journal.ouverts.includes('ovRsvProd') && M.els['mvr-pf-nom'].value === 'Piquets acacia' && M.els['mvr-pf-cat'].value === 'vigne'
    && M.els['mvr-pf-unite'].value === 'kg' && /pièce/.test(M.els['mvr-pf-unite'].innerHTML) && /500 kg/.test(sp(M.els['mvr-pf-achats'].innerHTML))
    && /_rsvDelAchat\(this\.dataset\.aid\)/.test(M.els['mvr-pf-achats'].innerHTML) && /Supprimer l’intrant et son achat/.test(M.els['mvr-pf-del'].innerHTML));
  M.els['mvr-pf-unite'].value = 'pièce'; F._rsvPfMaj(M.els['mvr-pf-unite']);
  t('E · l’unité choisie, la fiche dit ce qui arrive : « 500 kg deviennent 500 pièces », et la contenance devient « Pièces dans un lot »',
    /500 kg deviennent 500 pièces/.test(sp(M.els['mvr-pf-unote'].textContent)) && M.els['mvr-pf-contl'].textContent === 'Pièces dans un lot');
  M.els['mvr-pf-unite'].value = ''; F._rsvPfMaj(M.els['mvr-pf-unite']);
  t('E · un choix en cours (le tuto tape « pièce » lettre à lettre) ne casse rien', /500 kg deviennent 500 pièces/.test(sp(M.els['mvr-pf-unote'].textContent)));
  M.els['mvr-pf-unite'].value = 'pièce';
  F._rsvSaveProd();
  const p1 = M.ctx.INTRANTS.produits.find((p) => p.id === 'p1');
  t('E · « Enregistrer » : en pièces (lot), le reste de la fiche gardé (consommé, AMM, champ inconnu), l’achat garde ses 500 ; fermée, enregistrée',
    p1.unite === 'pièce' && p1.contLbl === 'lot' && p1.conso_manuel === 0 && p1.amm === '' && p1.x === 1 && M.ctx.INTRANTS.achats[0].q === 500
    && M.journal.sauv === 1 && M.journal.fermes.includes('ovRsvProd') && /Intrant modifié — compté en pièces/.test(M.journal.toasts.pop() || ''));
  F._rsvOpenProd('p1'); M.els['mvr-pf-cat'].value = 'phyto'; F._rsvPfMaj(M.els['mvr-pf-cat']);
  t('E · passé en phyto, la pièce n’est pas gardée (kg), et le consommé repart sur le registre', M.els['mvr-pf-unite'].value === 'kg' && !/pièce/.test(M.els['mvr-pf-unite'].innerHTML) && M.els['mvr-pf-src'].value === 'registre');
  M.els['mvr-pf-unite'].value = 'pièce'; const sv = M.journal.sauv; F._rsvSaveProd();
  t('E · une pièce forcée sur un phyto : refusée à l’enregistrement', M.journal.sauv === sv && M.ctx.INTRANTS.produits.find((p) => p.id === 'p1').cat === 'vigne');
  F._rsvOpenProd('p3'); M.els['mvr-pf-nom'].value = 'Piquets Acacia'; F._rsvSaveProd();
  t('E · renommer sur le nom d’une autre fiche : refusé', M.ctx.INTRANTS.produits.find((p) => p.id === 'p3').nom === 'Agrafes' && /s’appelle déjà/.test(M.journal.toasts.pop() || ''));
  F._rsvOpenProd('p2');
  t('E · une fiche E-Phy : son nom ne se modifie pas (champ fermé, il le dit)', M.els['mvr-pf-nom'].disabled === true && /E-Phy/.test(M.els['mvr-pf-nomnote'].textContent));
  M.els['mvr-pf-nom'].value = 'Autre nom'; F._rsvSaveProd();
  t('E · … et l’enregistrement garde le nom E-Phy', M.ctx.INTRANTS.produits.find((p) => p.id === 'p2').nom === 'Bouillie bordelaise');

  // ── F. RETIRER UN ACHAT ──
  M = monter(S, base()); F = M.F;
  F._rsvOpenProd('p3'); M.els['mvr-pf-nom'].value = 'Agrafes inox (en cours de saisie)';
  F._rsvDelAchat('a3');
  const ids = M.ctx.INTRANTS.achats.map((a) => a.id).join();
  t('F · « Retirer » : l’achat part tout de suite, la liste se repeint, les champs de la fiche ne bougent pas',
    ids === 'a1,a2,a4' && M.journal.sauv === 1 && !/a3/.test(M.els['mvr-pf-achats'].innerHTML) && M.els['mvr-pf-nom'].value === 'Agrafes inox (en cours de saisie)'
    && /^Achat retiré · 10 kg du /.test(sp(M.journal.msgAnnuler)));
  M.journal.annuler(); const ids2 = M.ctx.INTRANTS.achats.map((a) => a.id).join(); M.journal.annuler();
  t('F · « Annuler » le remet à sa place ; un second Annuler ne le double pas', ids2 === 'a1,a2,a3,a4' && M.ctx.INTRANTS.achats.map((a) => a.id).join() === 'a1,a2,a3,a4');

  // ── G. SUPPRIMER LA FICHE ──
  M = monter(S, base(), { cuvier: { cuves_vinif: [{ operations: [{ id: 'o1', prod_id: 'p2', qte: 1 }] }] } }); F = M.F;
  F._rsvOpenProd('p2');
  const refus = M.els['mvr-pf-del'].innerHTML; F._rsvDelProd();
  t('G · une fiche citée par une adjonction du Cuvier : pas de bouton, la raison dite, et la suppression se refuse elle-même',
    !/_rsvDelProd/.test(refus) && /1 adjonction du Cuvier/.test(refus) && M.ctx.INTRANTS.produits.length === 3 && M.journal.sauv === 0);
  M = monter(S, base()); F = M.F;
  const avant = copie(M.ctx.INTRANTS);
  F._rsvOpenProd('p3'); F._rsvDelProd();
  const I = M.ctx.INTRANTS;
  t('G · « Supprimer » : la fiche, ses deux achats et son inventaire partent, le reste ne bouge pas ; fermée, enregistrée',
    I.produits.map((p) => p.id).join() === 'p1,p2' && I.achats.map((a) => a.id).join() === 'a1,a2' && I.inventaires.length === 1 && I.inventaires[0].prodId === 'p2'
    && M.journal.sauv === 1 && M.journal.fermes.includes('ovRsvProd') && /^Intrant supprimé · Agrafes et ses 2 achats$/.test(M.journal.msgAnnuler));
  M.journal.annuler(); const rendu = JSON.stringify(M.ctx.INTRANTS); M.journal.annuler();
  t('G · « Annuler » remet tout tel quel, à sa place ; un second Annuler ne double rien', rendu === JSON.stringify(avant) && JSON.stringify(M.ctx.INTRANTS) === JSON.stringify(avant));

  // ── H. LE CÂBLAGE ──
  t('H · les gestes sont exposés (onclick d’un HTML écrit en JS)', ['_rsvOpenProd', '_rsvPfMaj', '_rsvSaveProd', '_rsvDelAchat', '_rsvDelProd'].every((n) => S.rsv.includes('window.' + n + '=' + n + ';')) && S.rsv.includes('window._rsvUnite = _rsvU;'));
  t('H · la fenêtre : l’unité suit au choix ET à la saisie (le tuto), « Enregistrer » et l’unité étiquetés pour le tuto',
    S.rsv.includes('id="ovRsvProd"') && S.rsv.includes('data-tuto="rsv.unite" onchange="_rsvPfMaj(this)" oninput="_rsvPfMaj(this)"') && S.rsv.includes('data-tuto="rsv.pf.save" onclick="_rsvSaveProd()"'));
  t('H · Pilotage › Économie › Achats accorde l’unité (deux endroits)', (S.pil.match(/window\._rsvUnite\(/g) || []).length === 2);
  t('H · le tuto « corriger une fiche d’intrant » couvre ses quatre gestes, sur des piquets saisis en kg',
    S.tu.includes("couvre: ['_rsvTabTo', '_rsvOpenProd', '_rsvPfMaj', '_rsvSaveProd']") && S.tu.includes("{ id: 'tu-piq', nom: 'Piquets acacia', cat: 'vigne', unite: 'kg'"));
  t('H · « Retirer » et « Supprimer » sont des exemptés motivés du compte des gestes', /"_rsvDelAchat": "INTRANT-1/.test(S.couv) && /"_rsvDelProd": "INTRANT-1/.test(S.couv));
  t('H · la feuille porte la liste des achats et la zone de suppression', S.css.includes('.mvr-pa-l{') && S.css.includes('.mvr-pf-danger{'));
  t('H · la fenêtre est classée (AJOUR-1)', S.aj.includes("ovRsvProd: ['MODULE'"));
  t('H · la liste joue ce fichier et sa contre-épreuve', S.liste.includes("mv-harnais-intrant1.mjs'") && S.liste.includes("mv-harnais-intrant1.mjs --contre'"));
}

if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la fiche neuve entre dans la liste avant le contrôle (la fiche fantôme revient)', (S) => m('rsv', '  if(np) INTRANTS.produits.push(np);\n', '')(m('rsv', '    p=np;\n', '    p=np; INTRANTS.produits.push(np);\n')(S))],
    ['la pièce retirée des fournitures', m('rsv', "['kg','L',_RSV_UNITE_PIECE]; }", "['kg','L']; }")],
    ['les fournitures repartent en kg d’office', m('rsv', "return (cat==='vigne'||cat==='cave'||cat==='trac') ? _RSV_UNITE_PIECE : 'kg';", "return 'kg';")],
    ['« pièce » ne s’accorde plus', m('rsv', "return Math.abs(Number(q)||0)>=2 ? 'pièces' : 'pièce';", "return 'pièce';")],
    ['« Par unités » revient', m('rsv', "mets('mvr-sg-u','Par '+cs);", "mets('mvr-sg-u','Par unités');")],
    ['la fiche est reconstruite de zéro à l’enregistrement', m('rsv', 'p.nom=nom; p.cat=cat; p.contenance=ct; p.conso_src=src;', 'var _ix=INTRANTS.produits.indexOf(p); INTRANTS.produits[_ix]=p={id:p.id,nom:nom,cat:cat,contenance:ct,conso_src:src,unite:p.unite,contLbl:p.contLbl};')],
    ['la garde de l’unité à l’enregistrement retirée', m('rsv', "if(_rsvUnitesPour(cat).indexOf(unite)<0&&(unite!==p.unite||unite===_RSV_UNITE_PIECE)){", 'if(false){')],
    ['un achat retiré revient en fin de liste', m('rsv', 'INTRANTS.achats.splice(Math.min(i,INTRANTS.achats.length),0,a);', 'INTRANTS.achats.push(a);')],
    ['un second Annuler double l’achat', m('rsv', "if(INTRANTS.achats.some(function(x){ return x&&x.id===aid; })) return;   // déjà revenu (un autre appareil, un double appui)", '')],
    ['« Retirer » repeint aussi les champs', m('rsv', 'saveIntrants(); _rsvPfListe(_rsvPfProd()); _rsvRenderBody();\n  var q=Number(a.q)||0', "saveIntrants(); var _nm=document.getElementById('mvr-pf-nom'); if(_nm) _nm.value=''; _rsvPfListe(_rsvPfProd()); _rsvRenderBody();\n  var q=Number(a.q)||0")],
    ['la suppression ignore ce qui cite la fiche', m('rsv', "if(r.n){ showToast(r.txt,'#B85A1A'); return; }", '')],
    ['la suppression oublie l’inventaire', m('rsv', 'INTRANTS.inventaires=INTRANTS.inventaires.filter(function(v){ return !(v&&v.prodId===pid); });', '')],
    ['la carte perd « Modifier »', m('rsv', "if(adm) h+='<div class=\"mvr-frow\">", "if(false) h+='<div class=\"mvr-frow\">")],
    ['le Pilotage n’accorde plus l’unité', (S) => Object.assign({}, S, { pil: S.pil.split('window._rsvUnite(').join('window._rsvUniteX(') })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-intrant1.mjs'").join("mv-harnais-intrantZ.mjs'") })],
  ];
  // La base d'abord : une contre-épreuve sur une base rouge mordrait à tous les coups, pour rien.
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
