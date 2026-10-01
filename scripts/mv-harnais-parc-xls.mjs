#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais PARC-XLS : le fichier Excel des parcelles
// ═══════════════════════════════════════════════════════════════════════════
//  Demande de Nico (30/09) : trier le fichier des parcelles par nom, et par
//  rendement en hL/ha, du plus fort au plus faible et l'inverse.
//  Ce qu'on éprouve :
//    · la feuille de tri s'ouvre, propose le millésime, et rappelle le fichier
//    · nom A → Z et Z → A
//    · rendement fort → faible et faible → fort, l'ABSENCE toujours en fin
//    · le hL/ha est celui de `_mlRendements` (aucun calcul refait ici)
//    · un chiffre estimé le DIT, avec sa fourchette
//    · sans feuille (utils.js en retard) : A → Z, millésime le plus récent
//    · sans aucune récolte : pas de colonne rendement, pas de clé rendement
//  La fonction est EXTRAITE de reglages.js, jamais réécrite ici.
//
//  Usage : node scripts/mv-harnais-parc-xls.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { poseDates } from './mv-dates-reelles.mjs';
import { lireCave } from './mv-cave-src.mjs';   // \u2605 PARC-XLS-2 : la roue de la Cave
poseDates(globalThis);

const ICI = path.dirname(fileURLToPath(import.meta.url));
const R   = path.join(ICI, '..');
let vert = 0, rouge = 0;
const t = (nom, ok) => { if (ok) { vert++; console.log('  \u2713 ' + nom); }
                         else { rouge++; console.log('  \u2717 ' + nom); } };
function bloc(src, entete) {
  const i = src.indexOf(entete);
  if (i < 0) throw new Error('introuvable : ' + entete);
  let k = src.indexOf('{', i), d = 0;
  for (;; k++) { const c = src[k];
    if (c === undefined) throw new Error('accolades desequilibrees : ' + entete);
    if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return src.slice(i, k + 1);
}
const REGL = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');
const SRC  = bloc(REGL, 'function exportCSVParcelles(');
const CAVE_SRC = bloc(lireCave(R), 'function _caveRegDocs(');

function lancer(ctx, choix, src) {
  const r = { opts:null, nom:null, entete:null, lignes:null };
  const win = Object.assign({ JOURNAL: [], PARCELLES: [], getTachesSaison: () => [],
                              getPCls: () => ({ pct: 50 }) }, ctx);
  if (ctx && ctx.feuille) win._mvTriOuvrir = (o) => { r.opts = o; return true; };
  const fn = new Function('window', 'isAdmin', 'dlFile', 'showExportFeedback',
    (src || SRC) + '\nreturn exportCSVParcelles;')
    (win, () => true, (txt, n) => {
      const L = String(txt).replace(/^\uFEFF/, '').split('\r\n');
      r.nom = n; r.entete = L[0].split(';'); r.lignes = L.slice(1);
    }, () => {});
  fn(choix);
  return r;
}
const col = (r, i) => r.lignes.map(l => l.split(';')[i].replace(/"/g, ''));

const PARCS = [
  { nom:'La Justice',    surface:2.05, statut:'Active',   taches:{} },
  { nom:'Aux Combottes', surface:0.58, statut:'Active',   taches:{} },
  { nom:'\u00c9vocelles', surface:0.86, statut:'Active',  taches:{} },
  { nom:'Craipillot',    surface:0.31, statut:'Active',   taches:{} },
  { nom:'Les Corv\u00e9es', surface:0.40, statut:'Active', taches:{} }   // aucune récolte
];
const RDT = {
  '2026': [
    { parcelle:{ nom:'La Justice' },    kg:4840, hlHa:17.5, statut:'mesure',  pctOk:100, hlMin:17.5, hlMax:17.5 },
    { parcelle:{ nom:'Aux Combottes' }, kg:2210, hlHa:28.2, statut:'partiel', pctOk:77,  hlMin:27.9, hlMax:28.6 },
    { parcelle:{ nom:'\u00c9vocelles' }, kg:3100, hlHa:26.7, statut:'estime', pctOk:0,   hlMin:25.8, hlMax:27.6 },
    { parcelle:{ nom:'Craipillot' },    kg:1250, hlHa:29.7, statut:'mesure',  pctOk:100, hlMin:29.7, hlMax:29.7 }
  ],
  '2025': [
    { parcelle:{ nom:'La Justice' },    kg:6000, hlHa:21.7, statut:'mesure',  pctOk:100, hlMin:21.7, hlMax:21.7 }
  ]
};
const vues = [];
const CTX = { PARCELLES: PARCS, feuille: true,
  _vendRecAnnees: () => ['2026', '2025'],
  _mlRendements:  (m) => { vues.push(String(m)); return RDT[String(m)] || []; } };

console.log('\n  La feuille de tri\n');
const f = lancer(CTX);
t('sans choix, la feuille s\u2019ouvre et aucun fichier ne part', f.opts && f.lignes === null);
t('elle propose les deux mill\u00e9simes, le plus r\u00e9cent par d\u00e9faut',
  JSON.stringify(f.opts.annees) === '["2026","2025"]' && f.opts.defaut.an === '2026');
t('deux cl\u00e9s : parcelle et rendement', f.opts.cles.map(k => k.v).join('|') === 'nom|rendement');
t('le rendement dit ses deux sens en mots',
  /fort/.test(f.opts.cles[1].z) && /faible/.test(f.opts.cles[1].a));
t('le choix est retenu (m\u00e9mo)', f.opts.memo === 'csvParcelles');
t('la note du rendement dit que l\u2019absence part en fin',
  /fin de liste/.test(f.opts.note({ an:'2026', cle:'rendement', sens:'desc' })));
t('valider la feuille t\u00e9l\u00e9charge le fichier dans l\u2019ordre choisi', (() => {
  f.opts.cb({ an:'2026', cle:'rendement', sens:'desc' });
  return f.lignes && col(f, 0)[0] === 'Craipillot';
})());

console.log('\n  Par nom\n');
const az = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'nom', sens:'asc' });
t('A \u2192 Z, accents rang\u00e9s comme en fran\u00e7ais',
  col(az, 0).join('|') === 'Aux Combottes|Craipillot|\u00c9vocelles|La Justice|Les Corv\u00e9es');
const za = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'nom', sens:'desc' });
t('Z \u2192 A', col(za, 0).join('|') === 'Les Corv\u00e9es|La Justice|\u00c9vocelles|Craipillot|Aux Combottes');

console.log('\n  Par rendement\n');
const fort = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'rendement', sens:'desc' });
t('le plus fort d\u2019abord',
  col(fort, 0).join('|') === 'Craipillot|Aux Combottes|\u00c9vocelles|La Justice|Les Corv\u00e9es');
const faible = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'rendement', sens:'asc' });
t('le plus faible d\u2019abord',
  col(faible, 0).join('|') === 'La Justice|\u00c9vocelles|Aux Combottes|Craipillot|Les Corv\u00e9es');
t('la parcelle sans r\u00e9colte reste EN FIN dans les deux sens',
  col(fort, 0)[4] === 'Les Corv\u00e9es' && col(faible, 0)[4] === 'Les Corv\u00e9es');

console.log('\n  Les colonnes\n');
t('l\u2019en-t\u00eate nomme le mill\u00e9sime et l\u2019unit\u00e9',
  fort.entete.map(s => s.replace(/"/g, '')).slice(4, 8).join('|')
   === 'Kilos 2026|Rendement 2026 (hL/ha)|Rendement 2026 : mesur\u00e9 ou estim\u00e9|Fourchette 2026 (hL/ha)');
const ligne = (r, nom) => r.lignes.map(l => l.split(';').map(s => s.replace(/"/g, ''))).find(c => c[0] === nom);
t('hL/ha \u00e0 virgule, repris tel quel de _mlRendements', ligne(fort, 'Craipillot')[5] === '29,7');
t('un chiffre mesur\u00e9 le dit, sans fourchette',
  ligne(fort, 'La Justice')[6] === 'mesur\u00e9' && ligne(fort, 'La Justice')[7] === '');
t('un chiffre partiel dit sa part mesur\u00e9e et donne sa fourchette',
  /estim\u00e9/.test(ligne(fort, 'Aux Combottes')[6]) && /77/.test(ligne(fort, 'Aux Combottes')[6])
  && ligne(fort, 'Aux Combottes')[7] === '27,9 \u2013 28,6');
t('une parcelle sans r\u00e9colte a des cases VIDES, pas des z\u00e9ros',
  ligne(fort, 'Les Corv\u00e9es').slice(4, 8).join('') === '');
t('le nom du fichier porte le mill\u00e9sime', /^mavigne_parcelles_2026_/.test(fort.nom));
const an25 = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2025', cle:'rendement', sens:'desc' });
t('changer de mill\u00e9sime change les chiffres (2025)',
  col(an25, 0)[0] === 'La Justice' && ligne(an25, 'La Justice')[5] === '21,7' && vues.indexOf('2025') !== -1);

console.log('\n  Les replis\n');
const sansFeuille = lancer(Object.assign({}, CTX, { feuille:false }));
t('sans feuille de tri : le fichier sort quand m\u00eame, A \u2192 Z, sur le mill\u00e9sime le plus r\u00e9cent',
  sansFeuille.lignes && col(sansFeuille, 0)[0] === 'Aux Combottes' && /2026/.test(sansFeuille.entete[5]));
const vide = lancer({ PARCELLES: PARCS, feuille: true });
t('sans aucune r\u00e9colte : la feuille ne propose que le nom',
  vide.opts.cles.map(k => k.v).join('|') === 'nom');
const videF = lancer({ PARCELLES: PARCS }, { an:'', cle:'rendement', sens:'desc' });
/* Le sens est GARD\u00c9 : c'est ce que la feuille affiche aussi quand elle retombe sur
   la premi\u00e8re cl\u00e9 valable (_mvTriOuvrir garde le sens retenu). */
t('sans aucune r\u00e9colte : pas de colonne rendement, et un choix rendement retombe sur le nom (sens gard\u00e9)',
  videF.entete.length === 4 && col(videF, 0)[0] === 'Les Corv\u00e9es');
t('la collection source garde son ordre', PARCS[0].nom === 'La Justice');

console.log('\n  \u2605 PARC-XLS-2 \u2014 la Cave le propose \u00e0 c\u00f4t\u00e9 des r\u00e9coltes\n');
const CAT = [
  { act:'phytoPdf', mod:'phyto' }, { act:'bilan', mod:'pilotage' }, { act:'manip', mod:'cave' },
  { act:'futs', mod:'reserve' }, { act:'matur', mod:'cave' }, { act:'recoltes', mod:'cave' },
  { act:'cuverie', mod:'cave' }, null, { act:'csvJournal', mod:'vigne' }, { act:'csvParcelles', mod:'vigne' }
];
const cave = (cat, src) => new Function('window', (src || CAVE_SRC) + '\nreturn _caveRegDocs();')({ MV_DOCS: cat });
const rc = cave(CAT);
t('le fichier des parcelles est dans la roue de la Cave, JUSTE APR\u00c8S les r\u00e9coltes',
  rc.map(x => x.d.act).join(',') === 'bilan,manip,futs,matur,recoltes,csvParcelles,cuverie');
t('c\u2019est la m\u00eame entr\u00e9e du catalogue (m\u00eame index, m\u00eame docsGo)',
  rc.find(x => x.d.act === 'csvParcelles').i === 9 && rc.every(x => CAT[x.i] === x.d));
t('le journal des travaux, lui, reste dans la Vigne', !rc.some(x => x.d.act === 'csvJournal'));
const sansRec = cave(CAT.filter(d => !d || d.act !== 'recoltes'));
t('sans ligne \u00ab r\u00e9coltes \u00bb : le fichier passe en fin de liste, il ne dispara\u00eet pas',
  sansRec[sansRec.length - 1].d.act === 'csvParcelles');
t('un catalogue sans fichier des parcelles donne la liste d\u2019avant ce lot',
  cave(CAT.slice(0, 9)).map(x => x.d.act).join(',') === 'bilan,manip,futs,matur,recoltes,cuverie');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Contre-\u00e9preuves \u2014 chaque d\u00e9faut remis doit faire rougir\n');
const ce = (nom, fn) => {
  let mordu = false;
  try { mordu = !fn(); } catch (e) { mordu = true; }
  if (mordu) { vert++; console.log('  \u2713 ' + nom); }
  else { rouge++; console.log('  \u2717 ' + nom + '  \u2014 LE HARNAIS N\u2019A PAS MORDU'); }
};
const muter = (avant, apres) => {
  if (SRC.indexOf(avant) < 0) throw new Error('mutation introuvable : ' + avant);
  return SRC.replace(avant, apres);
};
ce('absence compt\u00e9e z\u00e9ro \u2192 la parcelle sans r\u00e9colte remonte en t\u00eate du tri croissant', () => {
  const s = muter("return x==null ? 1 : -1;", "return (x||0)-(y||0);");
  const r = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'rendement', sens:'asc' }, s);
  return col(r, 0)[4] === 'Les Corv\u00e9es';
});
ce('sens ignor\u00e9 sur le rendement \u2192 \u00ab le plus fort d\u2019abord \u00bb sort le plus faible', () => {
  const s = muter("(x-y) ? sg*(x-y)", "(x-y) ? (x-y)");
  const r = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'rendement', sens:'desc' }, s);
  return col(r, 0)[0] === 'Craipillot';
});
ce('estimation pr\u00e9sent\u00e9e comme mesure \u2192 la colonne ne dit plus \u00ab estim\u00e9 \u00bb', () => {
  const s = muter("('estim\\u00e9 \\u2014 '", "('mesur\\u00e9 \\u2014 '");
  const r = lancer(Object.assign({}, CTX, { feuille:false }), { an:'2026', cle:'rendement', sens:'desc' }, s);
  return /estim/.test(ligne(r, 'Aux Combottes')[6]);
});
ce('feuille ignor\u00e9e \u2192 le fichier part sans laisser choisir', () => {
  const s = muter("if(typeof window._mvTriOuvrir==='function' && window._mvTriOuvrir(opts)) return;", "");
  const r = lancer(CTX, undefined, s);
  return r.lignes === null;
});

ce('fichier rang\u00e9 en fin de liste \u2192 il n\u2019est plus \u00e0 c\u00f4t\u00e9 des r\u00e9coltes', () => {
  const a = "if(k<0) out.push(xls); else out.splice(k+1, 0, xls);";
  if (CAVE_SRC.indexOf(a) < 0) throw new Error('mutation introuvable');
  const r = cave(CAT, CAVE_SRC.replace(a, 'out.push(xls);'));
  return r.map(x => x.d.act).join(',') === 'bilan,manip,futs,matur,recoltes,csvParcelles,cuverie';
});
ce('filtre de la Cave inchang\u00e9 \u2192 le fichier n\u2019appara\u00eet pas dans la Cave', () => {
  const a = "if(d.act==='csvParcelles'){ xls={i:i, d:d}; return; }";
  if (CAVE_SRC.indexOf(a) < 0) throw new Error('mutation introuvable');
  const r = cave(CAT, CAVE_SRC.replace(a, ''));
  return r.some(x => x.d.act === 'csvParcelles');
});

console.log('\n  ' + vert + ' vert' + (vert > 1 ? 's' : '') + ' \u00b7 ' + rouge
  + ' rouge' + (rouge > 1 ? 's' : '') + '\n');
process.exit(rouge ? 1 : 0);
