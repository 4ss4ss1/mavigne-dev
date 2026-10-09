#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais GF-1 (§302) : LES SUCRES AU LABO PRENNENT LE RELAIS DE LA DENSITÉ
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 09/10 : en fin de FA la densité ne dit plus rien ; c'est l'analyse labo glucose + fructose
//  (g/L) qui dit si la cuve est sèche, au seuil des labos de 0,2 g/L.
//
//  L'APPLICATION ENTIÈRE dans Node (scripts/mv-app-node.mjs) : aucune fonction recopiée, aucun moteur
//  bouchonné — le verdict, la liste, la fiche, la feuille de relevé, la déclaration de fin, l'agenda,
//  la ligne du Chai et le cahier de cuverie passent par leur vrai chemin.
//
//    node scripts/mv-harnais-gf.mjs            → les assertions (G1…G41)
//    node scripts/mv-harnais-gf.mjs --contre   → chaque défaut réinjecté dans une COPIE doit rougir,
//                                                 par SA règle (la base doit d'abord être verte)
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
  const remplace = process.env.MV_GF_REMPLACE ? JSON.parse(process.env.MV_GF_REMPLACE) : {};
  const A = await chargerApp({ remplace });
  const { G, poser, sale, JOURNAL_ERR, els, ecran, viderEcran } = A;
  A.setAuj([2026, 9, 9]);                       // vendredi 9 octobre 2026

  let ok = 0; const ko = [];
  const T = (id, nom, c, d) => { if (c) ok++; else { ko.push(id); console.log('   ROUGE  [' + id + '] ' + nom + (d ? '  → ' + String(d).slice(0, 220) : '')); } };
  // Un plantage est un rouge (§6b) : jamais un silence.
  const essai = (id, nom, f) => { let r; try { r = f(); } catch (e) { r = 'plantage : ' + e.message; } T(id, nom, r === true, r === true ? '' : r); };

  // ── Le décor : cinq cuves, chacune pour une raison ───────────────────────────
  const M = (id, date, o) => Object.assign({ id, date, remontages: 0, pigeages: 0, note: '' }, o);
  const cuves = () => [
    // vk7 : décuvée, finit au chai, 3,6 → 1,7 → 0,8 : en route vers le sec (13/10, demi-vie 3 j, ± 2 j)
    { id: 'vk7', nom: 'Cuve 7', statut: 'termine', parcelles: [], date_entree: '2026-09-15', operations: [],
      statut_hist: [{ id: 'h1', statut: 'fa', date: '2026-09-17' }, { id: 'h2', statut: 'termine', date: '2026-09-26' }],
      mesures_fa: [M('a1', '2026-09-16', { densite: 1094, temp_c: 12 }), M('a2', '2026-09-22', { densite: 1031, temp_c: 28 }),
        M('a3', '2026-09-26', { densite: 1004, temp_c: 22 }), M('a4', '2026-10-01', { densite: 998, temp_c: 18, gf: 3.6 }),
        M('a5', '2026-10-04', { densite: 997, temp_c: 17, gf: 1.7 }), M('a6', '2026-10-07', { temp_c: 17, gf: 0.8 })],
      decuvage: { date: '2026-09-26', cuvee_id: 'cuv7', fa_finie: false } },
    // vk3 : pressurée, 1,3 → 1,25 → 1,2, dernière analyse il y a 5 jours : ça stagne, et elle est à mesurer
    { id: 'vk3', nom: 'Cuve 3', statut: 'decuvage', parcelles: [], date_entree: '2026-09-14', operations: [],
      statut_hist: [{ id: 'h3', statut: 'fa', date: '2026-09-17' }, { id: 'h4', statut: 'decuvage', date: '2026-09-27' }],
      mesures_fa: [M('b1', '2026-09-15', { densite: 1096, temp_c: 13 }), M('b2', '2026-09-27', { densite: 1003, temp_c: 22 }),
        M('b3', '2026-09-28', { densite: 999, temp_c: 20, gf: 1.3 }), M('b4', '2026-10-01', { temp_c: 19, gf: 1.25 }),
        M('b5', '2026-10-04', { temp_c: 18, gf: 1.2, qui: ['Léa'], tour: true })],
      decuvage: null },
    // vk5 : décuvée, finit au chai, … → 0,18 : sèche au labo
    { id: 'vk5', nom: 'Cuve 5', statut: 'termine', parcelles: [], date_entree: '2026-09-13', operations: [],
      statut_hist: [{ id: 'h5', statut: 'fa', date: '2026-09-16' }, { id: 'h6', statut: 'termine', date: '2026-09-24' }],
      mesures_fa: [M('c1', '2026-09-14', { densite: 1097, temp_c: 12 }), M('c2', '2026-09-24', { densite: 1005, temp_c: 23 }),
        M('c3', '2026-09-30', { densite: 997, gf: 0.9 }), M('c4', '2026-10-03', { gf: 0.45 }), M('c5', '2026-10-06', { gf: 0.3 }),
        M('c6', '2026-10-08', { gf: 0.18 })],
      decuvage: { date: '2026-09-24', cuvee_id: 'cuv5', fa_finie: false } },
    // vk9 : EN fermentation, deux analyses : la densité (qui projetterait une fin) doit se taire
    { id: 'vk9', nom: 'Cuve 9', statut: 'fa', parcelles: [], date_entree: '2026-09-25', operations: [],
      statut_hist: [{ id: 'h7', statut: 'fa', date: '2026-09-26' }],
      mesures_fa: [M('d1', '2026-10-02', { densite: 1060, temp_c: 26 }), M('d2', '2026-10-04', { densite: 1040, temp_c: 26 }),
        M('d3', '2026-10-06', { densite: 1020, temp_c: 25, gf: 2.1 }), M('d4', '2026-10-08', { densite: 1008, temp_c: 24, gf: 1.1 })],
      decuvage: null },
    // vk1 : décuvée, finit au chai, AUCUNE analyse : le bouton vit dans la rangée des gestes
    { id: 'vk1', nom: 'Cuve 1', statut: 'termine', parcelles: [], date_entree: '2026-09-12', operations: [],
      statut_hist: [{ id: 'h8', statut: 'fa', date: '2026-09-14' }, { id: 'h9', statut: 'termine', date: '2026-09-25' }],
      mesures_fa: [M('e1', '2026-09-13', { densite: 1092, temp_c: 20 }), M('e2', '2026-09-25', { densite: 1002, temp_c: 21 }),
        M('e3', '2026-10-09', { densite: 998, temp_c: 18 })],
      decuvage: { date: '2026-09-25', cuvee_id: 'cuv1', fa_finie: false } },
  ];
  const cuvee = (id, nom) => ({ id, nom, millesime: 2026, statut: 'elevage', tonneaux: [{ annee: 2026, nb: 6 }], last_ouillage: '2026-10-05' });
  const base = () => ({ membres: [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }], parcelles: [], config: {},
    saisons: [{ nom: 'Vendanges 2026', active: true, debut: '2026-08-15', fin: '2026-10-31' }],
    cave_elevage: { cuvees: [cuvee('cuv7', 'Vieilles Vignes 2026'), cuvee('cuv5', 'Perrières 2026'), cuvee('cuv1', 'Village 2026')],
      operations: [], analyses: [], config: { ouillage_alerte_j: 14 } },
    cave_vendange: { cuves_vinif: cuves(), recoltes: [], analyses: [], cuvees: [], clients: [], config: {} }, intrants: {} });
  poser(base());
  const cu = id => G.CAVE_VENDANGE.cuves_vinif.find(c => c.id === id);
  const P = l => G._vendProjGF({ id: 'x', mesures_fa: l.map(([d, v], i) => ({ id: 'q' + i, date: d, gf: v })) });
  const J = o => JSON.stringify(o, (k, v) => (k === 'mesures' ? undefined : v));

  console.log('\n── GF-1 — les sucres au labo prennent le relais de la densité ──\n');

  // ── A. Le verdict ─────────────────────────────────────────────────────────────
  essai('G1', 'aucune analyse : en attente', () => P([]).etat === 'attente' || J(P([])));
  essai('G2', '0,2 pile est sec : le seuil est inclus', () => P([['2026-10-01', 0.9], ['2026-10-05', 0.2]]).etat === 'seche' || J(P([['2026-10-01', 0.9], ['2026-10-05', 0.2]])));
  essai('G3', 'une seule analyse à 0,6 : pas sèche, la deuxième dira la tendance', () => P([['2026-10-05', 0.6]]).etat === 'une' || J(P([['2026-10-05', 0.6]])));
  essai('G4', 'deux analyses : la tendance, jamais une date', () => { const p = P([['2026-10-05', 2.1], ['2026-10-08', 1.1]]); return (p.etat === 'descend' && !p.date) || J(p); });
  essai('G5', 'trois analyses : la date au seuil, la demi-vie et la marge', () => { const p = G._vendProjGF(cu('vk7')); return (p.etat === 'projete' && p.date === '2026-10-13' && p.demi === 3 && p.marge === 2) || J(p); });
  essai('G6', 'moins de 5 % de baisse par jour : ça stagne', () => G._vendProjGF(cu('vk3')).etat === 'stagne' || J(G._vendProjGF(cu('vk3'))));
  essai('G7', 'une hausse de plus de 0,1 g/L : ça remonte (pas « bloquée »)', () => P([['2026-10-04', 0.8], ['2026-10-07', 1.3]]).etat === 'remonte' || J(P([['2026-10-04', 0.8], ['2026-10-07', 1.3]])));
  essai('G8', 'une hausse sous 0,1 g/L est du bruit d’analyse : ça stagne', () => P([['2026-10-04', 0.8], ['2026-10-07', 0.85]]).etat === 'stagne' || J(P([['2026-10-04', 0.8], ['2026-10-07', 0.85]])));
  essai('G9', 'même jour réanalysé : la dernière saisie compte', () => { const p = P([['2026-10-04', 0.9], ['2026-10-04', 0.3]]); return (p.n === 1 && p.gf === 0.3) || J(p); });
  essai('G10', 'des dates dans le désordre se rangent', () => { const p = P([['2026-10-07', 0.8], ['2026-10-01', 3.6], ['2026-10-04', 1.7]]); return (p.etat === 'projete' && p.date === '2026-10-13') || J(p); });
  essai('G11', '« 0,8 » écrit en texte se lit 0,8, pas 0 (la cuve n’est pas sèche)', () => { const p = P([['2026-10-07', '0,8']]); return (p.etat === 'une' && p.gf === 0.8) || J(p); });
  essai('G12', 'un champ vide, nul ou illisible n’est pas une analyse', () => P([['2026-10-07', ''], ['2026-10-08', null], ['2026-10-09', 'abc']]).etat === 'attente' || 'lu comme une analyse');

  // ── B. Le repère de densité, au seuil des labos ─────────────────────────────
  essai('G13', 'seuil 0,2 g/L : un moût à 13° est sec vers 993,0 (993,8 sur l’ancien seuil de 2 g/L)', () => {
    const d = G._vendDSec({ id: 's', statut: 'fa', operations: [], mesures_fa: [{ id: 's1', date: '2026-09-20', densite: 1092, temp_c: 20 }] });
    return Math.abs(d - 993.0) < 0.06 || ('repère ' + d);
  });

  // ── C. La liste et la fiche ─────────────────────────────────────────────────
  viderEcran(); G.selectCaveSection('vendange'); G.switchVendOng('cuves');
  const liste = els['mvv-body'] ? els['mvv-body'].innerHTML : '';
  essai('G14', 'la ligne de la cuve porte le chiffre labo EN TÊTE (la sous-ligne se coupe par la fin)', () => liste.indexOf('<span class="mvv-sub"><b class="mvv-gf-sub">0,8\u00a0g/L</b>') > -1 || 'absent, ou pas en tête');
  essai('G15', 'l’état dit la tendance : « Labo · baisse », « Labo · stagne », « Sèche au labo »', () => (liste.indexOf('Labo \u00b7 baisse') > -1 && liste.indexOf('Labo \u00b7 stagne') > -1 && liste.indexOf('S\u00e8che au labo') > -1) || 'un état manque');
  essai('G16', 'à mesurer : la cuve analysée il y a 5 jours l’est, celles d’avant-hier et sèche ne le sont pas', () => {
    const i = liste.indexOf('mvv-alert'), al = i > -1 ? liste.slice(i, liste.indexOf('</div></div>', i) + 12) : '';
    return (al.indexOf('Cuve 3') > -1 && al.indexOf('Cuve 7') === -1 && al.indexOf('Cuve 5') === -1) || ('bandeau : ' + al.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
  });
  G._vendBascOuv('vk7'); const fiche7 = els['mvv-body'].innerHTML;
  essai('G17', 'la fiche porte le bloc du labo et le conteneur de sa courbe', () => (fiche7.indexOf('class="mvv-gf"') > -1 && /id="mvg-gf-[^"]+"/.test(fiche7)) || 'bloc absent');
  essai('G18', 'la phrase : en route vers le sec, la date et la marge', () => fiche7.indexOf('vers le <b>13/10</b>, \u00e0 2\u00a0jours pr\u00e8s') > -1 || 'phrase absente');
  essai('G19', 'une cuve qui finit au chai porte « Déclarer la FA finie » dans le bloc du labo', () => fiche7.indexOf("openVendFaFin('vk7')") > -1 || 'bouton absent');
  essai('G20', 'la courbe des sucres se dessine, seuil compris, sans valeur sale', () => { const s = G._vendGfSvg(cu('vk7'), 340); return (s.indexOf('<svg') === 0 && !sale(s).length && s.indexOf('sec au labo') > -1) || ('svg : ' + sale(s).join(' ; ').slice(0, 120) + s.slice(0, 40)); });
  G._vendBascOuv('vk1'); const fiche1 = els['mvv-body'].innerHTML;
  essai('G21', 'sans analyse, « Déclarer la FA finie » vit dans la rangée des gestes', () => (fiche1.indexOf("openVendFaFin('vk1')") > -1 && fiche1.indexOf('class="mvv-gf"') === -1) || 'bouton absent, ou bloc labo sans analyse');

  // ── D. La feuille de relevé ─────────────────────────────────────────────────
  G.openOvVendMesure('vk3');
  essai('G22', 'après le pressurage : le chapeau est masqué, aucun remontage ni pigeage inventé', () => (els['vm-chap'].style.display === 'none' && String(els['vm-rem-val'].textContent) === '0' && String(els['vm-pig-val'].textContent) === '0') || ('chapeau « ' + els['vm-chap'].style.display + ' », remontages ' + els['vm-rem-val'].textContent));
  G.openOvVendMesure('vk9');
  essai('G23', 'en fermentation : le chapeau reste, 2 remontages et 1 pigeage proposés', () => (els['vm-chap'].style.display === '' && String(els['vm-rem-val'].textContent) === '2' && String(els['vm-pig-val'].textContent) === '1') || ('chapeau « ' + els['vm-chap'].style.display + ' », remontages ' + els['vm-rem-val'].textContent));
  G.openOvVendMesure('vk3');
  els['vm-date'].value = '2026-10-09'; els['vm-densite'].value = ''; els['vm-temp'].value = ''; els['vm-gf'].value = '1,15'; els['vm-note'].value = '';
  const n0 = cu('vk3').mesures_fa.length;
  let errSave = null; try { G.saveVendMesure(); } catch (e) { errSave = e.message; }
  const der = cu('vk3').mesures_fa.find(m => m.date === '2026-10-09');
  essai('G24', 'un bulletin du labo seul s’enregistre : la densité est facultative', () => (!errSave && cu('vk3').mesures_fa.length === n0 + 1 && der && der.densite == null) || (errSave || ('relevés ' + n0 + ' → ' + cu('vk3').mesures_fa.length)));
  essai('G25', 'la virgule française est lue : « 1,15 » s’écrit 1,15 g/L', () => (der && der.gf === 1.15) || ('gf = ' + (der && der.gf)));
  G.openOvVendMesure('vk3'); els['vm-densite'].value = ''; els['vm-gf'].value = '';
  const n1 = cu('vk3').mesures_fa.length; G.saveVendMesure();
  essai('G26', 'ni densité ni labo : rien ne s’enregistre', () => cu('vk3').mesures_fa.length === n1 || 'un relevé vide a été écrit');
  G.openOvVendMesure('vk3', 'b5'); els['vm-temp'].value = '17'; G.saveVendMesure();
  const b5 = cu('vk3').mesures_fa.find(m => m.id === 'b5');
  essai('G27', 'corriger un relevé de la tournée garde qui l’a pris (§24 n°12)', () => (b5 && Array.isArray(b5.qui) && b5.qui[0] === 'Léa' && b5.tour === true && b5.temp_c === 17 && b5.gf === 1.2) || J(b5));

  // ── E. Déclarer la fin de fermentation ──────────────────────────────────────
  G.openVendFaFin('vk5');
  essai('G28', 'la feuille propose la date de l’analyse qui dit sec', () => (els['vff-date'] && els['vff-date'].value === '2026-10-08') || ('date « ' + (els['vff-date'] && els['vff-date'].value) + ' »'));
  G.saveVendFaFin();
  const k5 = cu('vk5');
  essai('G29', 'déclarée finie : la date et le chiffre restent écrits, la cuve sort de la tournée', () => (k5.decuvage.fa_finie === true && k5.decuvage.fa_fin_date === '2026-10-08' && k5.decuvage.fa_fin_gf === 0.18 && !G._vendFaEnCours(k5)) || J(k5.decuvage));
  G.openVendFaFin('vk1'); els['vff-date'].value = '2026-09-01'; G.saveVendFaFin();
  essai('G30', 'une fin datée avant le décuvage est refusée', () => cu('vk1').decuvage.fa_finie === false || 'enregistrée');

  // ── F. « Ce qui vient » ──────────────────────────────────────────────────────
  poser(base());                                   // une base neuve : vk5 n'est plus déclarée
  const sem = G._mlAgenda('2026-10-09', 2);
  const items = [].concat(...sem.map(s => s.items));
  const de = (ref, kind) => items.filter(it => it.ref === ref && (!kind || it.kind === kind));
  essai('G31', '« Ce qui vient » : sèche au labo, à déclarer', () => de('vk5', 'labo').length === 1 || J(de('vk5')));
  essai('G32', '« Ce qui vient » : ça stagne, à contrôler', () => de('vk3', 'alerte').length === 1 || J(de('vk3')));
  essai('G33', '« Ce qui vient » : la fin estimée, à sa date', () => { const f = de('vk7', 'fa'); return (f.length === 1 && f[0].date === '2026-10-13') || J(f); });
  essai('G34', 'une cuve suivie au labo n’a plus d’entrée de densité', () => de('vk9', 'fa').length === 0 || 'la densité projette encore');
  essai('G35', 'à mesurer : la cuve analysée il y a 5 jours, pas celle d’avant-hier', () => (de('vk3', 'mesure').length === 1 && de('vk7', 'mesure').length === 0) || J(items.filter(i => i.kind === 'mesure').map(i => i.ref)));

  // ── G. La ligne de la cuvée au Chai ─────────────────────────────────────────
  viderEcran(); G.selectCaveSection('elevage'); G.switchCaveOng('cuv');
  const chai = ecran();
  essai('G36', 'au Chai, la ligne « Fermentation à finir » est d’un seul tenant (§24, display:flex)', () => {
    const m = chai.match(/<div class="mvc-fa-line">[\s\S]*?<\/div>/g) || [];
    return (m.length >= 2 && m.every(l => /^<div class="mvc-fa-line"><svg[\s\S]*?<\/svg><span class="mvc-fl-t">[\s\S]*<\/span><\/div>$/.test(l))) || ('lignes : ' + m.length + ' · ' + (m[0] || '').slice(0, 140));
  });
  essai('G37', 'la cuvée lit le chiffre du labo de sa cuve', () => (chai.indexOf('labo <b>0,8\u00a0g/L</b> le 07/10, sec vers le 13/10') > -1 && chai.indexOf('<b>s\u00e8che au labo</b> (0,18\u00a0g/L le 08/10)') > -1) || 'chiffre absent');

  // ── H. Le cahier de cuverie ─────────────────────────────────────────────────
  let doc = null; const docAvant = G._mvDocOpen;
  G._mvDocOpen = o => { doc = o; return true; };
  try { G._cuvDoc('2026', 'encuvage'); } catch (e) { doc = { corps: 'plantage : ' + e.message }; }
  G._mvDocOpen = docAvant;
  const corps = doc ? String(doc.corps || '') : '';
  essai('G38', 'le cahier de cuverie a une colonne « Labo g/L » et les chiffres du labo', () => (corps.indexOf('<th class="n">Labo g/L</th>') > -1 && corps.indexOf('>0,18<') > -1) || ('corps : ' + corps.slice(0, 140)));
  essai('G39', 'le cahier trace la courbe des sucres sous celle de la densité', () => corps.indexOf('Sucres au labo de Cuve 7') > -1 || 'courbe absente');

  // ── I. Propreté ─────────────────────────────────────────────────────────────
  essai('G40', 'aucun « undefined » ni « NaN » dans les écrans touchés', () => { const s = [].concat(sale(liste), sale(fiche7), sale(fiche1), sale(chai), sale(corps)); return !s.length || s.slice(0, 3).join(' | '); });
  essai('G41', 'rien n’a été avalé en silence', () => !JOURNAL_ERR.length || JOURNAL_ERR.slice(0, 3).map(o => o.msg || o.cat).join(' | '));

  console.log('\n  ' + (ko.length ? rouge(ok + ' vertes, ' + ko.length + ' rouges') : vert(ok + ' vertes, 0 rouge')) + '\n');
  process.exit(ko.length ? 1 : 0);
}

function contre() {
  // [id, ce qui casse, fichier, texte exact du code sain, texte abîmé, règle qui doit rougir]
  const DEFAUTS = [
    ['C1', 'le seuil n’est plus inclus (0,2 pile ne serait pas sec)', 'cuvier.js', "if(v<=_VEND_GF_SEC){ r.etat='seche'; return r; }", "if(v<_VEND_GF_SEC){ r.etat='seche'; return r; }", 'G2'],
    ['C2', 'le repère de densité retombe sur l’ancien seuil de 2 g/L', 'cuvier.js', 'var _VEND_SEC_G   = 0.2;', 'var _VEND_SEC_G   = 2;', 'G13'],
    ['C3', 'le chiffre labo repasse en fin de ligne (coupé au téléphone)', 'cuvier.js', "if(_gp.etat!=='attente') bits.unshift(", "if(_gp.etat!=='attente') bits.push(", 'G14'],
    ['C4', 'la liste réclame de nouveau une densité par jour', 'cuvier.js', '  var g=_vendGfAMesurer(c);\n  return g===null ? _vendStale(c)>=1 : g;', '  return _vendStale(c)>=1;', 'G16'],
    ['C5', 'la virgule française n’est plus lue à l’enregistrement', 'cuvier.js', "value||'').replace(',','.'));", "value||''));", 'G25'],
    ['C6', 'le chiffre labo n’est plus écrit sur le relevé', 'cuvier.js', '  if(gf!=null) mesure.gf=gf; else delete mesure.gf;', '', 'G25'],
    ['C7', 'le relevé corrigé est reconstruit de zéro (la tournée s’efface)', 'cuvier.js', 'Object.assign({}, pos!==-1?cu.mesures_fa[pos]:{},', 'Object.assign({}, {},', 'G27'],
    ['C8', 'la déclaration n’écrit plus la fin', 'cuvier.js', '  c.decuvage.fa_finie=true;\n', '', 'G29'],
    ['C9', 'la densité projette encore une cuve suivie au labo', 'cave.js', "var p=_vendMesGF(c).length?{etat:'labo'}:_mlProjFA(c,from);", 'var p=_mlProjFA(c,from);', 'G34'],
    ['C10', 'la ligne du Chai perd son span : chaque <b> refait sa colonne', 'cave.js', '\'<span class="mvc-fl-t"><b>Fermentation', "'<b>Fermentation", 'G36'],
    ['C11', 'après le pressurage, 2 remontages reviennent par défaut', 'cuvier.js', '_vmRem=m?(m.remontages||0):(_chap?2:0);', '_vmRem=m?(m.remontages||0):2;', 'G22'],
    ['C12', 'le cahier perd sa colonne labo', 'cave.js', '<th class="n">Labo g/L</th>', '', 'G38'],
    ['C13', 'l’agenda réclame de nouveau une densité par jour', 'cave.js', '    var g=_vendGfAMesurer(c,from); if(g!==null) return g;', '', 'G35'],
    ['C14', '« 0,8 » écrit en texte se relit 0', 'cuvier.js', "var n=parseFloat(String(v==null?'':v).replace(',','.'));", "var n=parseFloat(String(v==null?'':v));", 'G11'],
  ];
  const run = env => spawnSync(process.execPath, [path.join(ICI, 'mv-harnais-gf.mjs')],
    { cwd: RACINE, env: Object.assign({}, process.env, env), encoding: 'utf8', timeout: 180000 });
  console.log('\n── GF-1 — contre-épreuves : chaque défaut réinjecté doit mordre, par sa règle ──\n');
  const b = run({ MV_GF_REMPLACE: '' });
  if (b.status !== 0) { console.log(rouge('  ✗ la base n’est pas verte — contre-épreuve sans valeur')); console.log(String(b.stdout).slice(-800)); process.exit(1); }
  let vus = 0;
  for (const [id, nom, fic, sain, abime, attendu] of DEFAUTS) {
    const src = fs.readFileSync(path.join(RACINE, 'src', fic), 'utf8');
    const n = src.split(sain).length - 1;
    if (n !== 1) { console.log('  ' + rouge('!! ') + id + ' ' + nom + ' — injection morte (' + n + ' occurrence(s) du code sain)'); continue; }
    const tmp = path.join(os.tmpdir(), 'mv-gf-' + id + '-' + fic);
    fs.writeFileSync(tmp, src.replace(sain, abime));
    const r = run({ MV_GF_REMPLACE: JSON.stringify({ [fic]: tmp }) });
    fs.rmSync(tmp, { force: true });                // la référence n'est jamais touchée : on abîme une COPIE
    const out = String(r.stdout || '');
    const mord = r.status !== 0 && out.indexOf('[' + attendu + ']') > -1;
    if (mord) vus++;
    console.log('  ' + (mord ? vert('✓') : rouge('✗')) + ' ' + id + ' ' + nom
      + (mord ? '' : '  → ' + (r.status === 0 ? 'passé inaperçu' : 'rouge, mais pas par ' + attendu + ' : ' + ((out.match(/\[G\d+\]/g) || []).join(' ') || out.slice(-200)))));
  }
  const tot = DEFAUTS.length;
  console.log('\n  ' + (vus === tot ? vert(vus + '/' + tot + ' défauts attrapés, chacun par sa règle') : rouge((tot - vus) + ' défaut(s) passent inaperçus')) + '\n');
  process.exit(vus === tot ? 0 : 1);
}
