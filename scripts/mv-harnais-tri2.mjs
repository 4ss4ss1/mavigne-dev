#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais TRI-2 : l'état du vignoble, le bilan matière, les CSV
// ═══════════════════════════════════════════════════════════════════════════
//  Trois choses à éprouver, et une quatrième qui compte plus que les autres :
//    · le tri du vignoble, dont le DÉFAUT doit rendre le document d'avant
//    · le tri du bilan matière, où « à activer » n'est pas un stock de zéro
//    · l'ordre stable des deux CSV, sans question posée
//    · ★ LA RÉCONCILIATION DES DEUX RENDEMENTS : `_dpRendHistRows` (app.js,
//      via `rendement_hist`) et `_vendRecRdt` (cave.js, via les récoltes)
//      doivent rendre le MÊME kg/ha. §119 laissait la question ouverte.
//
//  Les fonctions sont EXTRAITES des sources, jamais réécrites ici.
//
//  Usage : node scripts/mv-harnais-tri2.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceDates, poseDates } from './mv-dates-reelles.mjs';
poseDates(globalThis);   // _mvISO/_mvToday extraits du vrai utils.js (FUS-2)

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
function jusqua(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable : ' + debut);
  const k = src.indexOf(fin, i);
  return src.slice(i, k + fin.length);
}
const REGL  = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');
const RSV_TXT = fs.readFileSync(path.join(R, 'src/reserve.js'), 'utf8');
const CAVE  = fs.readFileSync(path.join(R, 'src/cave.js'),     'utf8');
const APP   = fs.readFileSync(path.join(R, 'src/app.js'),      'utf8');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  L\u2019\u00e9tat du vignoble \u2014 l\u2019ordre des parcelles\n');
const VGN = new Function('window', `
  ${jusqua(REGL, 'var _VGN_TRI_VAL = {', '};')}
  ${jusqua(REGL, 'var MV_TRI_VIGNOBLE = [', '];')}
  ${bloc(REGL, 'function _vgnTrier(')}
  return { _vgnTrier, MV_TRI_VIGNOBLE, _VGN_TRI_VAL };
`)({});
// La tournee telle que `_vgnLignes` la rend : commune puis nom, sans commune en fin.
const L = (nom, commune, ha, pct, kgha, mil, d) => ({
  nom, commune, ha, pct,
  rend: kgha == null ? null : { millesime: mil, kg_ha: kgha },
  dernier: d ? { date: d, tache: 'Taille' } : null });
const TOURNEE = [
  L('Craipillot',   'Gevrey',  0.31, 100, 2081, 2026, '2026-07-02'),
  L('La Justice',   'Gevrey',  2.05,  40, 2361, 2026, '2026-06-11'),
  L('Les Corv\u00e9es', 'Morey',   0.94,  75, null, null, '2026-05-20'),
  L('Aux Combottes','Morey',   0.58,  90, 1810, 2024, null),
  L('Sans commune', '',        0,     10, 2103, 2025, '2026-08-01')
];
const ns = l => l.map(x => x.nom);
const c = (cle, sens) => ({ cle, sens: sens || 'asc' });

t('le d\u00e9faut ne retrie RIEN \u2014 c\u2019est le document d\u2019avant le lot, au m\u00eame objet',
  VGN._vgnTrier(TOURNEE, c('tournee')) === TOURNEE);
t('la tourn\u00e9e invers\u00e9e est la tourn\u00e9e \u00e0 l\u2019envers, pas un autre tri',
  JSON.stringify(ns(VGN._vgnTrier(TOURNEE, c('tournee','desc'))))
   === JSON.stringify(ns(TOURNEE).slice().reverse()));
t('parcelle A \u2192 Z',
  JSON.stringify(ns(VGN._vgnTrier(TOURNEE, c('nom'))))
   === JSON.stringify(['Aux Combottes','Craipillot','La Justice','Les Corv\u00e9es','Sans commune']));
t('surface croissante : la parcelle sans surface part en FIN, pas en t\u00eate',
  ns(VGN._vgnTrier(TOURNEE, c('surface')))[4] === 'Sans commune');
t('surface d\u00e9croissante : elle reste en fin \u2014 une absence ne se retourne pas',
  ns(VGN._vgnTrier(TOURNEE, c('surface','desc')))[4] === 'Sans commune');
t('rendement d\u00e9croissant : le plus fort en t\u00eate, l\u2019inconnu en fin',
  (() => { const l = ns(VGN._vgnTrier(TOURNEE, c('rendement','desc')));
           return l[0] === 'La Justice' && l[4] === 'Les Corv\u00e9es'; })());
t('rendement croissant : l\u2019inconnu reste en fin, il ne devient pas z\u00e9ro',
  ns(VGN._vgnTrier(TOURNEE, c('rendement')))[4] === 'Les Corv\u00e9es');
t('avancement croissant',
  (() => { const l = VGN._vgnTrier(TOURNEE, c('avancement'));
           return l.every((x, i) => i === 0 || l[i-1].pct <= x.pct); })());
t('dernier travail : la parcelle sans travail part en fin',
  ns(VGN._vgnTrier(TOURNEE, c('dernier')))[4] === 'Aux Combottes');
t('deux valeurs \u00e9gales se d\u00e9partagent par le nom, jamais au hasard',
  (() => { const eg = [L('Zoe','G',1,50,100,2026,'2026-01-01'),
                       L('Abel','G',1,50,100,2026,'2026-01-01')];
           return ns(VGN._vgnTrier(eg, c('surface')))[0] === 'Abel'
               && ns(VGN._vgnTrier(eg, c('surface','desc')))[0] === 'Abel'; })());
t('aucune parcelle perdue, quelle que soit la cl\u00e9',
  VGN.MV_TRI_VIGNOBLE.every(k =>
    ['asc','desc'].every(s => VGN._vgnTrier(TOURNEE, c(k.v, s)).length === TOURNEE.length)));
t('la liste source n\u2019est jamais modifi\u00e9e en place',
  (() => { const avant = ns(TOURNEE).join('|');
           VGN.MV_TRI_VIGNOBLE.forEach(k => VGN._vgnTrier(TOURNEE, c(k.v,'desc')));
           return ns(TOURNEE).join('|') === avant; })());
t('chaque cl\u00e9 d\u00e9clar\u00e9e sait calculer sa valeur (sauf la tourn\u00e9e)',
  VGN.MV_TRI_VIGNOBLE.every(k => k.v === 'tournee' || typeof VGN._VGN_TRI_VAL[k.v] === 'function'));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Le bilan mati\u00e8re \u2014 intrants et f\u00fbts\n');
const STOCKS = {
  'Soufre mouillable': { ouv:40,  achats:60, conso:70, q:30,  known:true  },
  'Bouillie bordelaise':{ouv:10,  achats:20, conso:35, q:-5,  known:true  },
  'Bentonite':         { ouv:5,   achats:0,  conso:0,  q:5,   known:true  },
  'Levures s\u00e8ches':   { ouv:2,   achats:8,  conso:0,  q:0,   known:false }
};
const RSV = new Function('_stock', '_CATLBL', `
  ${jusqua(RSV_TXT, 'var MV_TRI_INTRANTS = [', '];')}
  ${bloc(RSV_TXT, 'function _rsvTriProduits(')}
  ${bloc(RSV_TXT, 'function _rsvTriFuts(')}
  return { _rsvTriProduits, _rsvTriFuts, MV_TRI_INTRANTS };
`)(p => STOCKS[p.nom], { phyto:'Phyto', oeno:'\u0152nologie', divers:'Divers' });
const PROD = [
  { nom:'Soufre mouillable',  cat:'phyto',  unite:'kg' },
  { nom:'Bouillie bordelaise',cat:'phyto',  unite:'kg' },
  { nom:'Bentonite',          cat:'oeno',   unite:'kg' },
  { nom:'Levures s\u00e8ches',    cat:'oeno',   unite:'g', conso_src:'registre' }
];
const pn = l => l.map(x => x.nom);
t('intrants A \u2192 Z',
  JSON.stringify(pn(RSV._rsvTriProduits(PROD, c('nom'))))
   === JSON.stringify(['Bentonite','Bouillie bordelaise','Levures s\u00e8ches','Soufre mouillable']));
t('par cat\u00e9gorie, puis par nom \u00e0 l\u2019int\u00e9rieur',
  (() => { const l = pn(RSV._rsvTriProduits(PROD, c('categorie')));
           return l[0] === 'Bentonite' && l[1] === 'Levures s\u00e8ches'
               && l[2] === 'Bouillie bordelaise' && l[3] === 'Soufre mouillable'; })());
t('un stock \u00ab \u00e0 activer \u00bb part en fin \u2014 inconnu n\u2019est pas z\u00e9ro',
  pn(RSV._rsvTriProduits(PROD, c('stock')))[3] === 'Levures s\u00e8ches' &&
  pn(RSV._rsvTriProduits(PROD, c('stock','desc')))[3] === 'Levures s\u00e8ches');
t('stock croissant : le n\u00e9gatif avant le nul, le nul avant le plein',
  (() => { const l = pn(RSV._rsvTriProduits(PROD, c('stock')));
           return l[0] === 'Bouillie bordelaise' && l[1] === 'Bentonite'; })());
t('coh\u00e9rence d\u00e9croissante : l\u2019\u00e9cart en t\u00eate, c\u2019est la lecture de contr\u00f4le',
  pn(RSV._rsvTriProduits(PROD, c('coherence','desc')))[0] === 'Bouillie bordelaise');
t('la liste des intrants n\u2019est pas modifi\u00e9e en place',
  (() => { const avant = pn(PROD).join('|');
           RSV.MV_TRI_INTRANTS.forEach(k => RSV._rsvTriProduits(PROD, c(k.v,'desc')));
           return pn(PROD).join('|') === avant; })());
const FUTS = [
  { ref:'F-12', four:'Rousseau', annee:'2023', qte:4 },
  { ref:'F-03', four:'Damy',     annee:'2025', qte:2 },
  { ref:'F-09', four:'Rousseau', annee:'2025', qte:6 },
  { ref:'F-01', four:'',         annee:'2024', qte:1 }
];
t('f\u00fbts : fournisseur, puis mill\u00e9sime r\u00e9cent en t\u00eate, puis r\u00e9f\u00e9rence',
  JSON.stringify(RSV._rsvTriFuts(FUTS).map(f => f.ref))
   === JSON.stringify(['F-03','F-09','F-12','F-01']));
t('un f\u00fbt sans fournisseur part en fin, pas en t\u00eate',
  RSV._rsvTriFuts(FUTS)[3].ref === 'F-01');
t('les f\u00fbts ne posent aucune question : une seule fonction, sans param\u00e8tre de tri',
  RSV._rsvTriFuts.length === 1);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Les deux CSV \u2014 un ordre stable, sans question\n');
function csv(fn, ctx) {
  let sortie = null;
  const win = Object.assign({ JOURNAL: [], PARCELLES: [] }, ctx);
  const code = `
    ${bloc(REGL, 'function ' + fn + '(')}
    return ${fn};`;
  new Function('window', 'isAdmin', 'dlFile', 'showExportFeedback', code)
    (win, () => true, (txt) => { sortie = txt; }, () => {})();
  return String(sortie || '').replace(/^\uFEFF/, '').split('\r\n').slice(1);
}
const JOURNAL = [
  { date:'2026-06-11', parcelle:'La Justice', tache:'Taille',   qui:'A', statut:'fait' },
  { date:'2026-05-02', parcelle:'Craipillot', tache:'Ebourgeonnage', qui:'B', statut:'fait' },
  { date:'2026-06-11', parcelle:'Craipillot', tache:'Palissage', qui:'C', statut:'fait' },
  { date:'2026-05-02', parcelle:'Craipillot', tache:'Attachage', qui:'D', statut:'fait' },
  { date:'2026-07-20', parcelle:'Aux Combottes', tache:'Rognage', qui:'E', statut:'fait', meteo:false },
  { date:'2026-07-21', parcelle:'La Justice', tache:'Pluie', meteo:true }
];
const lignesJ = csv('exportCSVJournal', { JOURNAL });
t('journal : par date, puis par parcelle, puis par t\u00e2che',
  JSON.stringify(lignesJ.map(l => l.split(';').slice(0,3).join(' ')))
   === JSON.stringify([
     '"2026-05-02" "Craipillot" "Attachage"',
     '"2026-05-02" "Craipillot" "Ebourgeonnage"',
     '"2026-06-11" "Craipillot" "Palissage"',
     '"2026-06-11" "La Justice" "Taille"',
     '"2026-07-20" "Aux Combottes" "Rognage"']));
t('journal : les rel\u00e9v\u00e9s m\u00e9t\u00e9o restent exclus', lignesJ.length === 5);
t('journal : deux exports de suite donnent le M\u00caME fichier',
  csv('exportCSVJournal', { JOURNAL }).join('|') === lignesJ.join('|'));
t('journal : l\u2019ordre de saisie n\u2019influe plus sur le fichier',
  csv('exportCSVJournal', { JOURNAL: JOURNAL.slice().reverse() }).join('|') === lignesJ.join('|'));
const PARCS = [
  { nom:'La Justice', surface:2.05, statut:'Active', taches:{} },
  { nom:'Aux Combottes', surface:0.58, statut:'Active', taches:{} },
  { nom:'\u00c9vocelles', surface:0.86, statut:'Active', taches:{} },
  { nom:'Craipillot', surface:0.31, statut:'Active', taches:{} }
];
const ctxP = { PARCELLES: PARCS, getTachesSaison: () => [], getPCls: () => ({ pct: 50 }) };
const lignesP = csv('exportCSVParcelles', ctxP);
t('parcelles : A \u2192 Z, accents rang\u00e9s comme en fran\u00e7ais',
  JSON.stringify(lignesP.map(l => l.split(';')[0]))
   === JSON.stringify(['"Aux Combottes"','"Craipillot"','"\u00c9vocelles"','"La Justice"']));
t('parcelles : l\u2019ordre de la collection n\u2019influe plus sur le fichier',
  csv('exportCSVParcelles', Object.assign({}, ctxP, { PARCELLES: PARCS.slice().reverse() }))
    .join('|') === lignesP.join('|'));
t('parcelles : la collection source reste dans son ordre',
  PARCS[0].nom === 'La Justice');

// ═══════════════════════════════════════════════════════════════════════════
//  ★ LA QUESTION LAISS\u00c9E OUVERTE PAR §119
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  \u2605 Les deux chemins vers le rendement donnent-ils le m\u00eame chiffre\u2009?\n');
const RDT = new Function('ETAT', 'PARC', `
  var CAVE_VENDANGE = ETAT.CAVE_VENDANGE;
  function _vendMillOfDate(d){ var y=parseInt(String(d||'').slice(0,4),10); return y>1900?y:2026; }
  function _vendParcSurf(n){ return PARC[n]||0; }
  function _recKg(r){ return r.kg||0; }
  ${bloc(CAVE, 'function _vendRecMil(')}
  ${bloc(CAVE, 'function _vendRecRdt(')}
  ${bloc(APP,  'function _dpRendHistRows(')}
  return { _vendRecRdt, _dpRendHistRows };
`);
const SURF = { 'La Justice': 2.05, 'Champerrier': 0.67 };
const RECOLTES = [
  { id:'a', parcelle:'La Justice',  date:'2026-09-12', kg:1680 },
  { id:'b', parcelle:'La Justice',  date:'2026-09-13', kg:1920 },
  { id:'c', parcelle:'La Justice',  date:'2026-09-14', kg:1240 },
  { id:'d', parcelle:'Champerrier', date:'2026-09-17', kg:1420 },
  { id:'e', parcelle:'Champerrier', date:'2026-09-18', kg:680  },
  { id:'f', parcelle:'La Justice',  date:'2025-09-11', kg:1560 }
];
/* La denormalisation, ecrite comme `_vendRecordRendement` l'ecrit :
   kg = _recKg(rec), kg_ha = round(kg / surface ENTIERE), base 'parcelle_entiere'. */
function parcelleAvecHist(nom) {
  const surf = SURF[nom];
  return { nom, surface: surf, rendement_hist: RECOLTES
    .filter(r => r.parcelle === nom)
    .map(r => ({ recolte_id:r.id, millesime:parseInt(r.date.slice(0,4),10), kg:r.kg,
                 caisses:0, kg_ha: surf>0 ? Math.round(r.kg/surf) : null,
                 kg_ha_base:'parcelle_entiere', date:r.date })) };
}
const M2 = RDT({ CAVE_VENDANGE: { recoltes: RECOLTES } }, SURF);
function deuxChemins(nom, mil) {
  const parRecoltes = Math.round(M2._vendRecRdt(nom, mil));
  const rows = M2._dpRendHistRows(parcelleAvecHist(nom));
  const r = rows.find(x => x.millesime === mil);
  return { parRecoltes, parHist: r ? r.kg_ha : null };
}
const dj26 = deuxChemins('La Justice', 2026);
t('La Justice 2026 : m\u00eame kg/ha par les r\u00e9coltes et par rendement_hist ('
  + dj26.parRecoltes + ')', dj26.parRecoltes === dj26.parHist);
const dj25 = deuxChemins('La Justice', 2025);
t('La Justice 2025 : les deux chemins isolent le m\u00eame mill\u00e9sime ('
  + dj25.parRecoltes + ')', dj25.parRecoltes === dj25.parHist);
const ch26 = deuxChemins('Champerrier', 2026);
t('Champerrier : les deux chemins additionnent cuvier et vrac ('
  + ch26.parRecoltes + ')', ch26.parRecoltes === ch26.parHist);
t('m\u00eame d\u00e9nominateur : la surface ENTI\u00c8RE de la parcelle, des deux c\u00f4t\u00e9s',
  dj26.parHist === Math.round((1680 + 1920 + 1240) / 2.05));
t('rendement_hist rend les mill\u00e9simes du plus r\u00e9cent au plus ancien',
  JSON.stringify(M2._dpRendHistRows(parcelleAvecHist('La Justice')).map(r => r.millesime))
   === JSON.stringify([2026, 2025]));

// ═══════════════════════════════════════════════════════════════════════════
//  LES CONTRE-EPREUVES — on remet chaque défaut et on exige le rouge
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Contre-\u00e9preuves \u2014 chaque d\u00e9faut remis doit faire rougir\n');
const ce = (nom, fn) => {
  let mordu = false;
  try { mordu = !fn(); } catch (e) { mordu = true; }
  if (mordu) { vert++; console.log('  \u2713 ' + nom); }
  else { rouge++; console.log('  \u2717 ' + nom + '  \u2014 LE HARNAIS N\u2019A PAS MORDU'); }
};
ce('absence trait\u00e9e comme z\u00e9ro \u2192 la parcelle sans rendement remonte en t\u00eate', () => {
  const naif = TOURNEE.slice().sort((a, b) =>
    ((a.rend && a.rend.kg_ha) || 0) - ((b.rend && b.rend.kg_ha) || 0));
  return naif[naif.length - 1].nom === 'Les Corv\u00e9es';   // exige l'inconnu EN FIN
});
ce('d\u00e9faut recalcul\u00e9 \u2192 le document par d\u00e9faut n\u2019est plus celui d\u2019avant', () => {
  const recalc = TOURNEE.slice().sort((a, b) =>
    String(a.commune).localeCompare(String(b.commune), 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  return ns(recalc).join('|') === ns(TOURNEE).join('|');  // « Sans commune » remonterait
});
ce('d\u00e9nominateur = surface attribu\u00e9e \u2192 les deux chemins divergent', () => {
  const attribuee = 1.20;                                  // au lieu de 2,05
  return Math.round((1680 + 1920 + 1240) / attribuee) === dj26.parHist;
});
ce('CSV sans tri \u2192 l\u2019ordre de saisie ressort', () => {
  const brut = JOURNAL.filter(j => !j.meteo).map(j => j.date + ' ' + j.parcelle);
  const trie = lignesJ.map(l => l.split(';').slice(0,2).join(' ').replace(/"/g, ''));
  return brut.join('|') === trie.join('|');
});
ce('f\u00fbts tri\u00e9s par r\u00e9f\u00e9rence seule \u2192 l\u2019ordre quitte celui de l\u2019inventaire', () => {
  const parRef = FUTS.slice().sort((a, b) => String(a.ref).localeCompare(String(b.ref), 'fr'));
  return parRef.map(f => f.ref).join('|')
      === RSV._rsvTriFuts(FUTS).map(f => f.ref).join('|');
});
ce('stock \u00ab \u00e0 activer \u00bb compt\u00e9 z\u00e9ro \u2192 il se glisse au milieu du classement', () => {
  const naif = PROD.slice().sort((a, b) => ((STOCKS[a.nom].q) || 0) - ((STOCKS[b.nom].q) || 0));
  return pn(naif)[3] === 'Levures s\u00e8ches';                 // exige l'inconnu EN FIN
});

console.log('\n  ' + vert + ' vert' + (vert > 1 ? 's' : '') + ' \u00b7 ' + rouge
  + ' rouge' + (rouge > 1 ? 's' : '') + '\n');
process.exit(rouge ? 1 : 0);
