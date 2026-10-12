#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais LABO-1 (§319) : LES RAPPORTS DU LABO
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 12/10 : une fiche par envoi au labo, chaque chiffre rangé sur sa cuvée ; ressaisir la même
//  date ou le même n° de rapport ne doit RIEN effacer.
//
//  L'APPLICATION ENTIÈRE dans Node (scripts/mv-app-node.mjs) : la lecture des lignes, la règle
//  « rien ne s'efface », l'écriture dans les deux maisons (opération du Chai, relevé et liste de la
//  cuve), les lecteurs historiques (malo, sucres, repère sec), la purge des PDF et les écrans passent
//  par leur vrai chemin.
//
//    node scripts/mv-harnais-labo.mjs            → les assertions (L1…L32)
//    node scripts/mv-harnais-labo.mjs --contre   → chaque défaut réinjecté dans une COPIE doit rougir,
//                                                   par SA règle (la base doit d'abord être verte)
//  Jamais déployé (scripts/) → aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const vert = s => '\x1b[32m' + s + '\x1b[0m', rouge = s => '\x1b[31m' + s + '\x1b[0m';

if (process.argv.includes('--contre')) contre();
else await essais();

async function essais() {
  const { chargerApp } = await import('./mv-app-node.mjs');
  const remplace = process.env.MV_LABO_REMPLACE ? JSON.parse(process.env.MV_LABO_REMPLACE) : {};
  const A = await chargerApp({ remplace });
  const { G, poser, sale, JOURNAL_ERR, els } = A;
  A.setAuj([2026, 9, 12]);                       // lundi 12 octobre 2026

  let ok = 0; const ko = [];
  const T = (id, nom, c, d) => { if (c) ok++; else { ko.push(id); console.log('   ROUGE  [' + id + '] ' + nom + (d ? '  → ' + String(d).slice(0, 240) : '')); } };
  const essai = (id, nom, f) => { let r; try { r = f(); } catch (e) { r = 'plantage : ' + e.message; } T(id, nom, r === true, r === true ? '' : r); };
  const J = o => JSON.stringify(o);

  // ── Le décor ─────────────────────────────────────────────────────────────────
  const cuvee = (id, nom, mil) => ({ id, nom, millesime: mil, statut: 'elevage', tonneaux: [{ annee: 2025, nb: 6 }], last_ouillage: '2026-10-05' });
  const base = () => ({ membres: [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }], parcelles: [], config: {},
    saisons: [{ nom: 'Vendanges 2026', active: true, debut: '2026-08-15', fin: '2026-10-31' }],
    cave_elevage: { cuvees: [cuvee('b25', 'Bourgogne rouge', 2025), cuvee('n25', 'Côte de Nuits-Villages', 2025), cuvee('x25', '<b>Sale</b>', 2025)],
      operations: [
        { id: 'opA', type: 'analyse', date: '2026-05-20', cuvee_id: 'b25', cuvees_ids: ['b25'], data: { so2_libre: 21, so2_total: 55, av: 0.39, malique: 0.6, fml: 'cours' } },
        { id: 'opM', type: 'analyse', date: '2026-03-12', cuvees_ids: ['b25', 'n25'], data: { so2_libre: 24, so2_total: 58, av: 0.36, malique: 0.9, fml: 'cours' } },
        { id: 'opL', type: 'analyse', date: '2026-10-06', cuvee_id: 'b25', cuvees_ids: ['b25'], labo: 1,
          data: { so2_libre: 18, so2_total: 52, av: 0.42, malique: 0.1, lt: { mal: true }, fml: 'ok', fml_date: '2026-10-06', rapport: '26-1186', ech: '1186', labo_nom: 'Labo X', saisie: '2026-10-07' } }],
      analyses: [], config: { ouillage_alerte_j: 14 } },
    cave_vendange: { cuves_vinif: [
      { id: 'vc3', nom: 'Bourgogne rouge', statut: 'fa', parcelles: [], date_entree: '2026-09-15', operations: [], statut_hist: [{ id: 'h1', statut: 'fa', date: '2026-09-17' }],
        mesures_fa: [{ id: 'm1', date: '2026-09-16', densite: 1094, temp_c: 14 }, { id: 'm2', date: '2026-10-06', densite: 1001, temp_c: 18 }],
        labo: [{ id: 'lab1', date: '2026-09-16', rapport: '26-0988', ech: '988', nom: 'Labo X', vals: { dp: { v: 12.4 }, at: { v: 4.6 } } }] },
      { id: 'vc5', nom: 'Marsannay', statut: 'fa', parcelles: [], date_entree: '2026-09-14', operations: [], statut_hist: [{ id: 'h2', statut: 'fa', date: '2026-09-16' }],
        mesures_fa: [{ id: 'g0', date: '2026-09-15', densite: 1098, temp_c: 13 }, { id: 'g1', date: '2026-10-02', gf: 21 }] }],
      recoltes: [], analyses: [], cuvees: [], clients: [], config: {} }, intrants: {} });
  const reposer = () => poser(base());
  reposer();
  const CE = () => G.CAVE_ELEVAGE, CV = () => G.CAVE_VENDANGE;
  const cuve = id => CV().cuves_vinif.find(c => c.id === id);
  const op = id => CE().operations.find(o => o.id === id);
  const lignes = () => G._laboLignes();
  const L = (lieu, cid, vals, o) => Object.assign({ lieu, cid, rapport: '', ech: '', raw: {}, vals, malo: '', pdf: null, pdfFile: null }, o || {});
  const V = v => ({ v }), LT = v => ({ v, lt: true });
  const plan = (date, lignesF, demande) => G._laboPlan({ date, nom: '', demande: demande || ['tav', 'gf', 'av', 'at', 'ph', 'so2l', 'so2t', 'mal'], lignes: lignesF }, lignes());
  const appliquer = (P, date) => G._laboAppliquer(P, { date, nom: 'Labo X', demande: [], lignes: [] });

  console.log('\n── LABO-1 — les rapports du labo ──\n');

  // ── A. Lire tout ce que la cave sait des analyses ─────────────────────────────
  essai('L1', 'une ancienne analyse à une cuvée devient une ligne du Chai, complétable', () => {
    const x = lignes().find(l => l.id === 'op:opA:b25');
    return (x && x.lieu === 'chai' && !x.lecture && x.vals.so2l.v === 21 && x.vals.mal.v === 0.6 && x.malo === 'cours') || J(x);
  });
  essai('L2', 'une ancienne analyse commune à deux cuvées reste en lecture (ses chiffres sont partagés)', () => {
    const xs = lignes().filter(l => l.ref && l.ref.id === 'opM');
    return (xs.length === 2 && xs.every(l => l.lecture && l.nb === 2)) || J(xs.map(l => [l.cid, l.lecture]));
  });
  essai('L3', 'une ligne de cuve (cuve.labo) se lit avec ses chiffres', () => {
    const x = lignes().find(l => l.id === 'cuve:vc3:lab1');
    return (x && x.lieu === 'cuvier' && x.vals.dp.v === 12.4 && x.vals.at.v === 4.6 && !x.vals.gf) || J(x);
  });
  essai('L4', 'un glucose saisi au Cuvier sans fiche compte comme une ligne', () => {
    const x = lignes().find(l => l.id === 'mes:vc5:g1');
    return (x && x.src === 'mes' && x.vals.gf.v === 21) || J(x);
  });
  essai('L5', 'le « < » du bulletin se relit', () => { const x = lignes().find(l => l.id === 'op:opL:b25'); return (x && x.vals.mal.lt === true && x.vals.mal.v === 0.1) || J(x && x.vals); });

  // ── B. La règle « rien ne s'efface » ────────────────────────────────────────
  essai('L6', 'même n° de rapport à une autre date : la date se choisit, la valeur différente aussi, la case vide est gardée', () => {
    const P = plan('2026-10-08', [L('chai', 'b25', { so2l: V(18), av: V(0.45) }, { rapport: '26-1186' })]);
    const it = P.items[0], ty = it.choix.map(c => c.t + (c.k ? ':' + c.k : ''));
    return (it.m && it.m.id === 'op:opL:b25' && ty.indexOf('date') >= 0 && ty.indexOf('val:av') >= 0 && it.identique.indexOf('so2l') >= 0
      && it.garde.indexOf('so2t') >= 0 && it.garde.indexOf('mal') >= 0) || J({ m: it.m && it.m.id, ty, id: it.identique, g: it.garde });
  });
  essai('L7', 'même date, même cuvée, sans n° : la fiche du jour est reconnue', () => {
    const P = plan('2026-10-06', [L('chai', 'b25', { tav: V(13.1) })]);
    return (P.fiche && P.items[0].m && P.items[0].par === 'cuvee' && P.items[0].ajout.join() === 'tav') || J({ f: P.fiche, it: P.items[0] && [P.items[0].par, P.items[0].ajout] });
  });
  essai('L8', 'une ancienne analyse commune à deux cuvées n’est jamais complétée', () => {
    const P = plan('2026-03-12', [L('chai', 'n25', { tav: V(13.2) })]);
    return (!P.items[0].m && P.items[0].statut === 'nouveau') || J(P.items[0].m && P.items[0].m.id);
  });
  essai('L9', 'le glucose du même jour, saisi au Cuvier, est reconnu et identique', () => {
    const P = plan('2026-10-02', [L('cuvier', 'vc5', { gf: V(21), av: V(0.22) })]);
    const it = P.items[0];
    return (it.m && it.m.src === 'mes' && it.identique.join() === 'gf' && it.ajout.join() === 'av') || J({ m: it.m && it.m.id, i: it.identique, a: it.ajout });
  });
  essai('L10', 'une case laissée vide n’efface rien (SO2 total reste 52)', () => {
    reposer();
    const P = plan('2026-10-06', [L('chai', 'b25', { tav: V(13.1) }, { rapport: '26-1186' })]);
    appliquer(P, '2026-10-06');
    const d = op('opL').data;
    return (d.so2_total === 52 && d.av === 0.42 && d.tav === 13.1 && d.malique === 0.1) || J(d);
  });

  // ── C. Écrire chaque ligne dans sa maison ───────────────────────────────────
  essai('L11', 'une ligne neuve du Chai devient une analyse lisible par les anciens lecteurs', () => {
    reposer();
    const P = plan('2026-10-12', [L('chai', 'n25', { so2l: V(22), so2t: V(64), av: V(0.37), mal: LT(0.1), tav: V(12.95), gf: V(0.8), ph: V(3.55) }, { rapport: '26-1210', ech: '1210', malo: 'ok' })]);
    const r = appliquer(P, '2026-10-12');
    const o = CE().operations.find(x => x.data && x.data.rapport === '26-1210');
    const c = CE().cuvees.find(x => x.id === 'n25');
    return (r.elevage && r.nouv === 1 && o && o.labo === 1 && o.cuvees_ids.join() === 'n25' && o.data.so2_libre === 22 && o.data.so2_total === 64 && o.data.av === 0.37
      && o.data.malique === 0.1 && o.data.lt && o.data.lt.mal === true && o.data.tav === 12.95 && o.data.gf === 0.8 && o.data.ph === 3.55 && o.data.fml === 'ok'
      && o.data.fml_date === '2026-10-12' && c.last_analyse === '2026-10-12') || J({ r, o, la: c.last_analyse });
  });
  essai('L12', 'le glucose d’une cuve va sur le relevé de densité du même jour (pas de second relevé)', () => {
    reposer();
    const P = plan('2026-10-06', [L('cuvier', 'vc3', { gf: V(1.9), tav: V(12.9) }, { rapport: '26-1185' })]);
    appliquer(P, '2026-10-06');
    const c = cuve('vc3'), m2 = c.mesures_fa.find(m => m.id === 'm2'), e = c.labo.find(x => x.rapport === '26-1185');
    return (c.mesures_fa.length === 2 && m2.gf === 1.9 && m2.densite === 1001 && e && e.mes_id === 'm2' && m2.labo_id === e.id && e.vals.tav.v === 12.9 && !e.vals.gf)
      || J({ n: c.mesures_fa.length, m2, e });
  });
  essai('L13', 'sans relevé ce jour-là, un relevé « labo » se crée et la courbe des sucres le lit', () => {
    reposer();
    const P = plan('2026-10-09', [L('cuvier', 'vc3', { gf: LT(0.2) }, { rapport: '26-1220' })]);
    appliquer(P, '2026-10-09');
    const c = cuve('vc3'), m = c.mesures_fa.find(x => x.date === '2026-10-09');
    const g = G._vendMesGF(c);
    return (m && m.labo_cree && m.gf === 0.2 && m.gf_lt === true && g.length === 1 && g[0].val === 0.2) || J({ m, g });
  });
  essai('L14', 'deux valeurs : « Garder » garde l’ancienne, « Prendre » prend la nouvelle', () => {
    reposer();
    let P = plan('2026-10-06', [L('chai', 'b25', { av: V(0.45) }, { rapport: '26-1186' })]);
    P.items[0].choix.forEach(c => { c.rep = 'a'; }); appliquer(P, '2026-10-06');
    const a = op('opL').data.av;
    P = plan('2026-10-06', [L('chai', 'b25', { av: V(0.45) }, { rapport: '26-1186' })]);
    P.items[0].choix.forEach(c => { c.rep = 'b'; }); appliquer(P, '2026-10-06');
    return (a === 0.42 && op('opL').data.av === 0.45) || J({ a, b: op('opL').data.av });
  });
  essai('L15', '« Le passer au 8 oct. » déplace bien le rapport', () => {
    reposer();
    const P = plan('2026-10-08', [L('chai', 'b25', { tav: V(13) }, { rapport: '26-1186' })]);
    P.items[0].choix.forEach(c => { c.rep = 'b'; }); appliquer(P, '2026-10-08');
    return (op('opL').date === '2026-10-08' && op('opL').data.tav === 13 && op('opL').data.so2_total === 52) || J(op('opL'));
  });
  essai('L16', 'le même n° posé sur une autre cuvée : « Mettre sur » déplace le rapport avec ses chiffres', () => {
    reposer();
    const P = plan('2026-10-06', [L('chai', 'n25', { tav: V(13) }, { rapport: '26-1186' })]);
    P.items[0].choix.forEach(c => { c.rep = 'b'; }); appliquer(P, '2026-10-06');
    const o = CE().operations.find(x => x.data && x.data.rapport === '26-1186');
    return (!op('opL') && o && o.cuvees_ids.join() === 'n25' && o.data.so2_total === 52 && o.data.tav === 13) || J(o);
  });
  essai('L17', 'compléter un glucose du Cuvier relie le relevé, sans le doubler', () => {
    reposer();
    const P = plan('2026-10-02', [L('cuvier', 'vc5', { gf: V(21), av: V(0.22) })]);
    appliquer(P, '2026-10-02');
    const c = cuve('vc5'), g1 = c.mesures_fa.find(m => m.id === 'g1'), e = (c.labo || [])[0];
    return (c.mesures_fa.length === 2 && e && e.mes_id === 'g1' && g1.labo_id === e.id && g1.gf === 21 && e.vals.av.v === 0.22) || J({ n: c.mesures_fa.length, e, g1 });
  });
  essai('L18', 'retirer une ligne de cuve : son relevé « labo » part, la densité d’un relevé du matin reste', () => {
    reposer();
    appliquer(plan('2026-10-06', [L('cuvier', 'vc3', { gf: V(1.9) }, { rapport: 'R-A' })]), '2026-10-06');
    appliquer(plan('2026-10-10', [L('cuvier', 'vc3', { gf: V(0.6) }, { rapport: 'R-B' })]), '2026-10-10');
    const la = lignes(), a = la.find(l => l.rapport === 'R-A'), b = la.find(l => l.rapport === 'R-B');
    G.openConfirmDel = (t, s, cb) => cb();
    G._laboRetirer(a.id); G._laboRetirer(b.id);
    const c = cuve('vc3'), m2 = c.mesures_fa.find(m => m.id === 'm2');
    return (m2 && m2.densite === 1001 && m2.gf === undefined && !c.mesures_fa.some(m => m.date === '2026-10-10') && !c.labo.some(e => /^R-/.test(e.rapport)))
      || J({ m2, mes: c.mesures_fa.map(m => m.date), labo: c.labo.map(e => e.rapport) });
  });

  // ── D. Les lecteurs historiques lisent les lignes neuves ─────────────────────
  essai('L19', 'la projection de la malo lit le malique d’une ligne neuve', () => {
    reposer();
    appliquer(plan('2026-10-12', [L('chai', 'n25', { mal: V(0.3) }, { rapport: 'M1' })]), '2026-10-12');
    const p = G._mlProjMalo(CE().cuvees.find(x => x.id === 'n25'), '2026-10-12');
    return (p && JSON.stringify(p).indexOf('0.3') >= 0) || J(p);
  });
  essai('L20', 'le degré probable du labo cale le repère « sec » (le plus ancien rapport fait foi)', () => {
    reposer();
    const c = cuve('vc3'), avec = G._vendDSec(c);
    const sans = G._vendDSec(Object.assign({}, c, { labo: [] }));
    const tard = G._vendDSec(Object.assign({}, c, { labo: c.labo.concat([{ id: 'lab9', date: '2026-10-01', vals: { dp: { v: 2.1 } } }]) }));
    return (avec !== sans && tard === avec) || J({ avec, sans, tard });
  });
  essai('L21', 'retirer un rapport de cuve purge son PDF du stockage (PDF-1 voit cuve.labo)', () => {
    reposer();
    cuve('vc3').labo[0].pdf_url = 'u'; cuve('vc3').labo[0].pdf_path = 'tenants/t/analyses/c.pdf';
    const vus = []; G.fbDeleteAnalyse = p => { vus.push(p); return Promise.resolve(); };
    G.openConfirmDel = (t, s, cb) => cb();
    G._laboRetirer('cuve:vc3:lab1');
    return vus.join() === 'tenants/t/analyses/c.pdf' || J(vus);
  });

  // ── E. Les écrans ───────────────────────────────────────────────────────────
  reposer();
  const root = () => (els['lbo-root'] && els['lbo-root'].innerHTML) || '';
  const snaps = {};
  const onglet = () => (els['mvc-body-labo'] && els['mvc-body-labo'].innerHTML) || '';
  G.switchCaveOng('labo'); const liste = onglet(); snaps.liste = liste;
  essai('L22', 'l’onglet « Labo » : une fiche par date, les lignes et leurs chiffres, « Saisir un rapport » en tête', () =>
    (liste.indexOf('id="lbo-saisir"') > -1 && liste.indexOf('Mardi 6\u00a0octobre') > -1 && liste.indexOf('Rapport n\u00b0\u00a026-1186') > -1
      && liste.indexOf('ancienne saisie, commune à 2 cuvées') > -1 && liste.indexOf('Saisir un rapport') > -1) || liste.slice(0, 400));
  G.openLabo({ date: '2026-10-06' }); const fiche0 = root();
  essai('L23', 'la même date rouvre la fiche : bandeau, lignes déjà saisies, analyses demandées', () =>
    (fiche0.indexOf('Compléter la fiche du 6\u00a0octobre') > -1 && fiche0.indexOf('Déjà dans cette fiche') > -1 && fiche0.indexOf('rien de ce qui est déjà saisi ne s’efface') > -1
      && fiche0.indexOf('aria-pressed="true"') > -1) || fiche0.slice(0, 400));
  G._laboAnaBasc('gf');                          // le glucose n'était pas demandé ce jour-là : on coche la puce
  G._laboAjout('chai', 'b25');
  const champ = (i, k, v) => ({ value: v, getAttribute: a => ({ 'data-i': String(i), 'data-k': k })[a], classList: { toggle() {} } });
  G._laboRap(champ(0, '', '26-1186')); G._laboVal(champ(0, 'av', '0,45')); G._laboVal(champ(0, 'so2l', '18'));
  G._laboAjout('cuvier', 'vc3'); G._laboRap(champ(1, '', '26-1230')); G._laboVal(champ(1, 'gf', '< 0,2'));
  const fiche = root(); snaps.fiche = fiche;
  essai('L24', 'la fiche reconnaît le rapport pendant qu’on tape', () => fiche.indexOf('déjà saisi') > -1 && fiche.indexOf('vos chiffres le complètent') > -1 || fiche.slice(0, 300));
  G._laboVerifier(); const verif = root(); snaps.verif = verif;
  essai('L25', '« Avant d’enregistrer » : un choix à faire, la destination de chaque chiffre, Enregistrer bloqué', () =>
    (verif.indexOf('Avant d’enregistrer') > -1 && verif.indexOf('Deux valeurs pour la même analyse') > -1 && verif.indexOf('Courbe des sucres de la cuve, au Cuvier') > -1
      && verif.indexOf('Case laissée vide : la valeur déjà saisie reste') > -1 && /id="lbo-save"[^>]*disabled/.test(verif)) || verif.slice(0, 500));
  G._laboChoix(0, 0, 'b');
  await G._laboEnregistrer();
  const fenetre = root(); G.switchCaveOng('labo'); const apres = onglet();
  essai('L26', 'enregistrer : la volatile prise, le glucose posé ; la fenêtre se vide, l’onglet montre la fiche touchée en surbrillance', () =>
    (op('opL').data.av === 0.45 && op('opL').data.so2_total === 52 && cuve('vc3').mesures_fa.some(m => m.gf === 0.2 && m.gf_lt) && fenetre === '' && apres.indexOf('lbo-fiche flash') > -1)
      || J({ av: op('opL').data.av, fenetre: fenetre.slice(0, 80), flash: apres.indexOf('flash') }));
  essai('L27', 'un nom de cuvée est échappé, et aucun <div> dans un <button>', () => {
    G.openLabo({ nouveau: true }); const h = root();
    return (h.indexOf('&lt;b&gt;Sale&lt;/b&gt;') > -1 && h.indexOf('<b>Sale</b>') < 0 && !/<button[^>]*>(?:(?!<\/button>)[\s\S])*<div/.test(h)) || 'nom brut ou <div> dans un bouton';
  });
  reposer();
  essai('L28', 'la fiche cuvée porte « Au labo » ; la fiche cuve aussi, sans le glucose (il a son bloc)', () => {
    if (els['cuvd-body']) els['cuvd-body'].innerHTML = '';
    G.openCuveeDetail('b25');
    const fc = (els['cuvd-body'] && els['cuvd-body'].innerHTML) || '', fv = G._laboCuveHtml(cuve('vc3'));
    return (fc.indexOf('Au labo') > -1 && fc.indexOf('Acide malique') > -1 && fv.indexOf('Degré probable') > -1 && fv.indexOf('Glucose') < 0) || J({ fc: fc.indexOf('Au labo'), fv: fv.slice(0, 200) });
  });
  essai('L29', 'une analyse née d’une fiche se rouvre dans sa fiche, pas dans l’ancien formulaire', () => {
    els['lbo-root'] && (els['lbo-root'].innerHTML = '');
    G.openOvCaveOp('opL');
    return root().indexOf('Compléter la fiche du 6\u00a0octobre') > -1 || root().slice(0, 200);
  });
  essai('L31', 'index.html : l’onglet « Labo » avant le Journal, sa vue, et plus de zone dans le Journal', () => {
    const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8'), cave = fs.readFileSync(path.join(RACINE, 'src', 'cave.js'), 'utf8');
    const iL = html.indexOf('id="mvc-tbtn-labo" onclick="switchCaveOng(\'labo\')"'), iJ = html.indexOf('id="mvc-tbtn-journal"');
    return (iL > -1 && iL < iJ && html.indexOf('id="mvc-body-labo"') > -1 && html.indexOf('mvc-journal-upload') < 0 && /var ONGLETS = \[[^\]]*'labo'/.test(cave)) || ('labo ' + iL + ' journal ' + iJ);
  });
  essai('L32', 'le filtre millésime du Chai s’applique à l’onglet (et dit ce qu’il écarte)', () => {
    if (typeof G._caveSetMill !== 'function') return '_caveSetMill introuvable';
    G._caveSetMill('2026'); G.switchCaveOng('labo'); const h = onglet(); G._caveSetMill('tous');
    return (h.indexOf('Millésime 2026 seul') > -1 && h.indexOf('26-0988') > -1 && h.indexOf('26-1186') < 0 && /\d rapports? d’un autre millésime/.test(h)) || h.slice(0, 300);
  });
  essai('L30', 'propreté : ni « undefined » ni « NaN », rien d’avalé en silence', () => {
    const s = [].concat(sale(liste), sale(fiche0), sale(fiche), sale(verif), sale(apres));
    return (!s.length && !JOURNAL_ERR.length) || (s.slice(0, 2).join(' | ') + ' ' + JOURNAL_ERR.slice(0, 2).map(o => o.msg || o.cat).join(' | '));
  });

  console.log('\n  ' + (ko.length ? rouge(ok + ' vertes, ' + ko.length + ' rouges') : vert(ok + ' vertes, 0 rouge')) + '\n');
  process.exit(ko.length ? 1 : 0);
}

function contre() {
  // [id, ce qui casse, fichier, texte exact du code sain, texte abîmé, règle qui doit rougir]
  const DEFAUTS = [
    ['C1', 'compléter repart de zéro : une case vide efface', 'cave.js', '    var vals={}; Object.keys(m.vals).forEach(function(k){ vals[k]=m.vals[k]; });', '    var vals={};', 'L10'],
    ['C2', 'le n° de rapport n’est plus reconnu d’une date à l’autre', 'cave.js', "  if(r){ for(i=0;i<lignes.length;i++){ x=lignes[i]; if(!x.lecture&&!pris[x.id]&&_laboNorm(x.rapport)===r) return {m:x, par:'rapport'}; } }\n", '', 'L6'],
    ['C3', 'une ancienne analyse commune à deux cuvées devient complétable', 'cave.js', 'lecture:ids.length>1', 'lecture:false', 'L8'],
    ['C4', 'le glucose ouvre un second relevé le jour de la densité', 'cave.js', '  if(!m) for(i=0;i<mes.length;i++){ if(mes[i]&&mes[i].date===date&&_laboNum(mes[i].gf)==null&&!mes[i].labo_id){ m=mes[i]; break; } }\n', '', 'L12'],
    ['C5', 'le degré probable du labo ne cale plus le repère sec', 'cuvier.js', '  var base=_vendDpLabo(c), d0=(base==null)?_vendD0(c):null;', '  var base=null, d0=_vendD0(c);', 'L20'],
    ['C6', 'la purge des PDF ignore les rapports des cuves', 'cave.js', '    (c&&Array.isArray(c.labo)?c.labo:[]).forEach(function(e){ if(e&&e.pdf_path) S[e.pdf_path]=1; });\n', '', 'L21'],
    ['C7', 'l’ancien formulaire rouvre une analyse née d’une fiche (et l’écraserait)', 'cave.js', "    if(_lop&&_lop.type==='analyse'&&_lop.labo&&typeof window.openLabo==='function'){ window.openLabo({date:_lop.date}); return; } }", '    }', 'L29'],
    ['C8', 'deux valeurs différentes : la nouvelle écrase sans demander', 'cave.js', "else it.choix.push({t:'val', k:a.k, a:o, b:n}); }", 'else it.ajout.push(a.k); }', 'L6'],
    ['C9', '« Le passer au 8 oct. » ne déplace rien', 'cave.js', "    var date=(rep.date==='b')?F.date:m.date;", '    var date=m.date;', 'L15'],
    ['C11', 'l’onglet « Labo » n’est plus dans la liste des onglets du Chai', 'cave.js', "  var ONGLETS = ['cuv','journal','bouteille','labo'];", "  var ONGLETS = ['cuv','journal','bouteille'];", 'L22'],
    ['C12', 'après l’enregistrement, la fiche touchée n’est plus mise en surbrillance', 'cave.js', '_LBO.P=null; _LBO.flash=ds.length?ds[ds.length-1]:null;\n', '_LBO.P=null;\n', 'L26'],
    ['C10', 'le « < » du bulletin se perd à l’écriture', 'cave.js', '  LABO_ANA.forEach(function(a){ var o=vals[a.k]; if(o){ d[a.op]=o.v; if(o.lt) lt[a.k]=true; } });', '  LABO_ANA.forEach(function(a){ var o=vals[a.k]; if(o){ d[a.op]=o.v; } });', 'L11'],
  ];
  const run = env => spawnSync(process.execPath, [path.join(ICI, 'mv-harnais-labo.mjs')],
    { cwd: RACINE, env: Object.assign({}, process.env, env), encoding: 'utf8', timeout: 180000 });
  console.log('\n── LABO-1 — contre-épreuves : chaque défaut réinjecté doit mordre, par sa règle ──\n');
  const b = run({ MV_LABO_REMPLACE: '' });
  if (b.status !== 0) { console.log(rouge('  ✗ la base n’est pas verte — contre-épreuve sans valeur')); console.log(String(b.stdout).slice(-800)); process.exit(1); }
  let vus = 0;
  for (const [id, nom, fic, sain, abime, attendu] of DEFAUTS) {
    const src = fs.readFileSync(path.join(RACINE, 'src', fic), 'utf8');
    const n = src.split(sain).length - 1;
    if (n !== 1) { console.log('  ' + rouge('!! ') + id + ' ' + nom + ' — injection morte (' + n + ' occurrence(s) du code sain)'); continue; }
    const tmp = path.join(os.tmpdir(), 'mv-labo-' + id + '-' + fic);
    fs.writeFileSync(tmp, src.replace(sain, abime));
    const r = run({ MV_LABO_REMPLACE: JSON.stringify({ [fic]: tmp }) });
    fs.rmSync(tmp, { force: true });                // la référence n'est jamais touchée : on abîme une COPIE
    const out = String(r.stdout || '');
    const mord = r.status !== 0 && out.indexOf('[' + attendu + ']') > -1;
    if (mord) vus++;
    console.log('  ' + (mord ? vert('✓') : rouge('✗')) + ' ' + id + ' ' + nom
      + (mord ? '' : '  → ' + (r.status === 0 ? 'passé inaperçu' : 'rouge, mais pas par ' + attendu + ' : ' + ((out.match(/\[L\d+\]/g) || []).join(' ') || out.slice(-200)))));
  }
  const tot = DEFAUTS.length;
  console.log('\n  ' + (vus === tot ? vert(vus + '/' + tot + ' défauts attrapés, chacun par sa règle') : rouge((tot - vus) + ' défaut(s) passent inaperçus')) + '\n');
  process.exit(vus === tot ? 0 : 1);
}
