#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais ANNEE-1 (§234) : Pilotage › L'année, un cadre à la fois
// ═══════════════════════════════════════════════════════════════════════════
//  POURQUOI IL EXISTE. Nico (04/10) : l'onglet ne montrait que le pic des
//  vendanges, cinq chiffres pour un même exercice, et un exercice en euros
//  posé face à une année vigne en heures de barème. Ce harnais garde ce qui a
//  été tranché :
//   ① les fenêtres de manque (_pilAnFenetres) — fonction PURE, jouée sur des
//      semaines tirées de la capture du 04/10 : passé ignoré, seuil d'une
//      demi-personne, une semaine sous le seuil coupe la fenêtre ;
//   ② les mois du budget (_pilAnBudgetMois) — fonction PURE : tout ce que le
//      moteur engage (salaires, GNR, achats, réparations, fûts, prestations) et
//      le prévu (salaires de la grille + amendements chiffrés) ;
//   ③ le câblage : un seul cadre (_PIL_SCOPE.cadre / recul), recul NON mémorisé,
//      l'année vigne = _mvCampagneBornes (celle des Archives), le budget =
//      _pexData aux dates du cadre, plus de « Deux façons de compter » ni de
//      frise du pic, les photos et le fil d'Ariane lisent le cadre, la carte du
//      renfort mène à Décider par un BOUTON ;
//   ④ les fiches : chaque pastille a sa fiche, chaque fiche sa pastille.
//  §34g : on lit le CODE, jamais les commentaires.
//  Usage : node scripts/mv-harnais-annee.mjs [--contre]
//  Jamais déployé (scripts/) → aucun bump.   ⚠️ CHEMINS : fileURLToPath (§53).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const PIL0 = fs.readFileSync(path.join(RACINE, 'src', 'pilotage.js'), 'utf8');
const UTI0 = fs.readFileSync(path.join(RACINE, 'src', 'utils.js'), 'utf8');

const sansCom = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
// Le corps d'une fonction de premier niveau : de sa déclaration à la suivante.
function corps(src, nom) {
  const i = src.indexOf('\nfunction ' + nom + '(');
  if (i < 0) return '';
  const fin = src.slice(i + 1).search(/\n(function |var |window\.)/);
  return fin < 0 ? src.slice(i + 1) : src.slice(i + 1, i + 1 + fin);
}
function charger(src, nom) {
  try { return new Function(corps(src, nom) + '\nreturn ' + nom + ';')(); } catch (e) { return null; }
}

function verifier(PIL, UTI) {
  const R = [], t = (nom, ok) => R.push([nom, !!ok]);
  const NC = sansCom(PIL);
  // ① les fenêtres de manque — ordinals : 0 = 1er janvier 2026, 276 = 4 octobre 2026
  const F = charger(PIL, '_pilAnFenetres');
  t('① _pilAnFenetres se charge', typeof F === 'function');
  if (typeof F === 'function') {
    const W = (o0, need, dispo, per) => ({ o0, o1: o0 + 6, need, dispo, manque: Math.max(0, need - dispo), per });
    const sem = [W(234, 25.3, 22, 0), W(276, 2.8, 4.4, 1)]
      .concat(Array.from({ length: 10 }, (_, i) => W(347 + 7 * i, 4.8, 3.6, 1)))
      .concat([W(417, 3.8, 2.8, 1), W(424, 2.8, 2.8, 1), W(459, 7.4, 2.8, 2), W(466, 7.4, 2.8, 2), W(473, 7.4, 2.8, 2),
               W(480, 3.1, 2.8, 2), W(487, 6.2, 2.8, 2)]);
    const r = F(sem, 276);
    t('① la vendange passée ne fait aucune fenêtre', r.every(x => x.o0 >= 276));
    t('① trois fenêtres : l\'hiver, avril, mai', r.length === 3);
    t('① l\'hiver va du 14 décembre (347) au 27 février (423)', !!r[0] && r[0].o0 === 347 && r[0].o1 === 423);
    t('① le manque d\'hiver : 1,2 au plus, 1,0 au moins', !!r[0] && Math.abs(r[0].max - 1.2) < 1e-9 && Math.abs(r[0].min - 1.0) < 1e-9);
    t('① une semaine à 0,3 coupe la fenêtre d\'avril', !!r[1] && r[1].o1 === 479 && !!r[2] && r[2].o0 === 487);
    t('① le pic d\'avril vaut 4,6, porté par sa campagne', !!r[1] && Math.abs(r[1].max - 4.6) < 1e-9 && r[1].per[2] === 1);
    const r2 = F([W(273, 6, 2, 1)], 276);
    t('① la semaine en cours compte, à partir d\'aujourd\'hui', r2.length === 1 && r2[0].o0 === 276);
    t('① sans semaine, aucune fenêtre', F([], 276).length === 0);
  }
  // ② les mois du budget
  const M = charger(PIL, '_pilAnBudgetMois');
  t('② _pilAnBudgetMois se charge', typeof M === 'function');
  if (typeof M === 'function') {
    const X = { mois: [{ k: '2026-7', lbl: 'août', d0: '2026-08-01', d1: '2026-08-31' },
                       { k: '2026-9', lbl: 'oct.', d0: '2026-10-01', d1: '2026-10-31' },
                       { k: '2026-10', lbl: 'nov.', d0: '2026-11-01', d1: '2026-11-30' }],
      byM: { '2026-7': { sal: 20000, gnr: 1000, ach: 2000, dep: 500, fut: 3000, pre: 500 },
             '2026-9': { sal: 3000, salP: 10000 }, '2026-10': { salP: 12000, achP: 6000 } } };
    const m = M(X, '2026-10-04');
    t('② le dépensé additionne les SIX postes du moteur (fûts et prestations compris)', m[0].dep === 27000);
    t('② le prévu additionne la grille et les amendements chiffrés', m[2].prev === 18000 && m[1].prev === 10000);
    t('② l\'état du mois : passé / en cours / à venir', m[0].etat === 'p' && m[1].etat === 'c' && m[2].etat === 'f');
    const v = M({ mois: [{ k: 'x', lbl: 'x', d0: '2027-01-01', d1: '2027-01-31' }], byM: {} }, '2026-10-04');
    t('② un mois sans poste vaut zéro, jamais NaN', v[0].dep === 0 && v[0].prev === 0);
  }
  // ③ le câblage
  t('③ la portée porte le cadre et le recul', /var _PIL_SCOPE = \{ camp:null, cadre:'exo', recul:0 \};/.test(NC));
  t('③ le cadre est mémorisé, le recul ne l\'est pas', /localStorage\.setItem\(_pilCadreKey\(\)/.test(corps(NC, '_pilCadreSet')) && !/localStorage/.test(corps(NC, '_pilReculSet')));
  t('③ l\'année vigne est celle des Archives (_mvCampagneBornes)', /_mvCampagneBornes/.test(corps(NC, '_pilAnCadre')) && /_mvExerciceAn/.test(corps(NC, '_pilAnCadre')));
  t('③ le budget est le moteur de l\'Exercice, aux dates du cadre', /_pexData\(C\.F,true\)/.test(corps(NC, '_pilAnBudgetData')));
  t('③ les amendements prévus trouvent leur mois (byM.achP)', /byM\[_kp\]\.achP\+=/.test(corps(NC, '_pexData')));
  const tab = corps(NC, '_pilTabAn');
  t('③ l\'onglet s\'ouvre sur le cadre, puis le budget et le renfort', /_pilAnCadreHtml\(\)/.test(tab) && /_pilPanelAnBudget\(\)/.test(tab) && /_pilPanelAnRenfort\(\)/.test(tab));
  t('③ « Deux façons de compter » et la frise du pic ont quitté le module', !/function _pilDeuxCadresHtml\(/.test(NC) && !/function _pilPanelEtp\(/.test(NC) && !/function _pilFriseAnneeSvg\(/.test(NC));
  t('③ les photos lisent le budget et le renfort du cadre', /_pilAnBudgetData\(\)/.test(corps(NC, '_pilPhotosData')) && /_pilAnRenfortData\(\)/.test(corps(NC, '_pilPhotosData')));
  t('③ la photo Effectif de l\'année lit les fenêtres de manque, pas le pic', /_pilPhotoEffAn\(D, drap\('effectif'\)\)/.test(corps(NC, '_pilPhotosHtml')) && /R\.fen/.test(corps(NC, '_pilPhotoEffAn')));
  t('③ le fil d\'Ariane nomme le cadre (plus X.debut, qui n\'existe pas)', /_pilAnCadre\(\)/.test(corps(NC, '_pilCrumbHtml')) && !/X\.debut/.test(corps(NC, '_pilCrumbHtml')));
  t('③ la carte du renfort mène à Décider par un BOUTON', /<button type="button" class="pil-diag-go" data-diag="renfort">/.test(corps(NC, '_pilPanelAnRenfort')));
  t('③ les deux sélecteurs passent par la portée', /\[data-ancadre\]/.test(NC) && /\[data-anrecul\]/.test(NC) && /_pilCadreSet\(_ac/.test(NC) && /_pilReculSet\(/.test(NC));
  t('③ « an_cadres » n\'est plus un indicateur, « an_frise » porte le renfort', !/\['an_cadres',/.test(NC) && /\['an_frise','Le renfort/.test(NC));
  t('③ l\'ancre du constat « vendange à cheval » existe toujours', /id="pil-an-cadres"/.test(NC) && /cible:'an_cadres'/.test(NC));
  // ④ les fiches
  const cles = ['pil.cadres', 'pil.an.budget', 'pil.an.renfort'];
  t('④ les trois fiches existent', cles.every(c => UTI.includes("'" + c + "': { t:")));
  t('④ chaque fiche a sa pastille', /_mvInfoBtn\('pil\.cadres'\)/.test(NC) && /'pil\.an\.budget'\);/.test(NC) && /'pil\.an\.renfort'\);/.test(NC));
  t('④ la fiche du budget ne parle plus de deux périmètres', !UTI.includes('Deux périmètres, et c'));
  return R;
}

if (CONTRE) {
  const MUT = [
    ['le seuil d\'une demi-personne abaissé', 'P', 'q && q.m>=0.5', 'q && q.m>=0.25'],
    ['les jours d\'avant aujourd\'hui comptés', 'P', 'for(var o=Math.max(w.o0,oAuj); o<=w.o1; o++){', 'for(var o=w.o0; o<=w.o1; o++){'],
    ['les fûts oubliés dans les mois', 'P', '+(b.fut||0)', ''],
    ['le recul mémorisé', 'P', '_PIL_SCOPE.recul=(isNaN(r)||r>0)?0:r; }', "_PIL_SCOPE.recul=(isNaN(r)||r>0)?0:r; try{ localStorage.setItem('x',String(r)); }catch(e){ r=0; } }"],
    ['« Deux façons de compter » revient', 'P', 'function _pilTabAn(d){', "function _pilDeuxCadresHtml(ann){ return ''; }\nfunction _pilTabAn(d){"],
    ['le fil d\'Ariane relit X.debut', 'P', 'CA=_pilAnCadre();', 'CA=null; var X={}; X.debut;'],
    ['les amendements prévus sans mois', 'P', 'byM[_kp].achP+=', 'byM[_kp].achX+='],
    ['le bouton vers Décider retiré', 'P', '<button type="button" class="pil-diag-go" data-diag="renfort">', '<button type="button" class="pil-diag-go" data-diag="rien">'],
    ['la photo Effectif revient au pic', 'P', "if(!camp && D.cad){ pEff=_pilPhotoEffAn(D, drap('effectif')); }", ''],
    ['la fiche du renfort disparue', 'U', "'pil.an.renfort': { t:", "'pil.an.renfortX': { t:"],
  ];
  let ok = 0;
  for (const [nom, cible, a, b] of MUT) {
    const src = cible === 'P' ? PIL0 : UTI0;
    if (!src.includes(a)) { console.log('  \x1b[31m✗\x1b[0m contre-épreuve sans ancre : ' + nom); process.exit(1); }
    const mut = src.replace(a, b);
    const R = cible === 'P' ? verifier(mut, UTI0) : verifier(PIL0, mut);
    const rouges = R.filter(x => !x[1]);
    if (rouges.length) { ok++; console.log('  \x1b[32m✓\x1b[0m « ' + nom + ' » rougit : ' + rouges[0][0]); }
    else console.log('  \x1b[31m✗\x1b[0m « ' + nom + ' » passe inaperçu');
  }
  console.log('\n  contre-épreuve : ' + ok + '/' + MUT.length);
  process.exit(ok === MUT.length ? 0 : 1);
}

console.log('\n── ANNEE-1 — L\'année, un cadre à la fois\n');
const R = verifier(PIL0, UTI0);
R.forEach(([nom, ok]) => console.log((ok ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + nom));
const ko = R.filter(x => !x[1]).length;
console.log('\n  ' + (R.length - ko) + ' vertes, ' + ko + ' rouges');
process.exit(ko ? 1 : 0);
