#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : l'état du vignoble (APP 6.09 / SW 6.59)
// ═══════════════════════════════════════════════════════════════════════════
//  reglages.js se charge tel quel dans Node ; app.js non (il importe le SDK
//  Firebase et styles.css). Les moteurs dont le document depend sont donc
//  EXTRAITS DU SOURCE REEL d'app.js par decoupe de texte (methode C20), jamais
//  reecrits : getPCls, getTacheStatut, _tachesFor, getTachesSaison,
//  _tachesSaisonLegacy, getSaisonActive, _visuSaison, pctColor,
//  _dpRendHistRows. Si l'un d'eux change dans app.js, le harnais teste la
//  nouvelle version — c'est tout l'interet de l'extraction sur le fichier.
//
//  Usage :
//    node scripts/mv-harnais-vignoble.mjs            # les tests
//    node scripts/mv-harnais-vignoble.mjs --contre   # + les contre-epreuves
//    node scripts/mv-harnais-vignoble.mjs <reglages.js>
//
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const args   = process.argv.slice(2);
const CONTRE = args.includes('--contre');
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'reglages.js'));

// ── DOM minimal ─────────────────────────────────────────────────────────────
function El(){ return { id:'', innerHTML:'', textContent:'', value:'', style:{}, dataset:{}, children:[],
  classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  setAttribute(){}, getAttribute(){ return null; }, appendChild(c){ return c; },
  insertBefore(c){ return c; }, removeChild(){}, addEventListener(){}, remove(){},
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  getBoundingClientRect(){ return { width:700, height:300, top:0, left:0 }; },
  focus(){}, click(){}, closest(){ return null; } }; }
const doc = { body:El(), head:El(), documentElement:El(), getElementById(){ return null; },
  querySelector(){ return null; }, querySelectorAll(){ return []; }, createElement(){ return El(); },
  addEventListener(){}, cookie:'' };
const mem = {};
const win = { document:doc, location:{ hostname:'test', href:'https://test/', search:'', pathname:'/' },
  localStorage:{ getItem:k => (k in mem ? mem[k] : null), setItem:(k,v)=>{ mem[k]=String(v); },
    removeItem:k => { delete mem[k]; }, clear(){}, key(){ return null; }, length:0 },
  navigator:{ userAgent:'node', onLine:true, language:'fr-FR' },
  addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){}, addListener(){} }; },
  requestAnimationFrame(f){ return setTimeout(f, 0); },
  getComputedStyle(){ return { getPropertyValue(){ return ''; } }; },
  innerWidth:900, innerHeight:800, open(){ return null; }, print(){}, alert(){}, confirm(){ return true; },
  URL:{ createObjectURL(){ return 'blob:x'; }, revokeObjectURL(){} }, Blob:function(p){ this.parts = p; } };
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.getComputedStyle = win.getComputedStyle; globalThis.matchMedia = win.matchMedia;
globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value:win.navigator, configurable:true }); } catch { /* deja en lecture seule */ }

// ── Extraction des moteurs REELS d'app.js ───────────────────────────────────
const APP = fs.readFileSync(path.join(RACINE, 'src', 'app.js'), 'utf8');
function extraire(nom){
  const m = APP.match(new RegExp('\\nfunction ' + nom + '\\s*\\('));
  if (!m) throw new Error('moteur introuvable dans app.js : ' + nom);
  let i = m.index + 1, k = APP.indexOf('{', i), d = 0;
  for (;; k++) { const c = APP[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return APP.slice(i, k + 1);
}
const MOTEURS = ['getSaisonActive','_visuSaison','_tachesFor','getTacheStatut','_tachesSaisonLegacy',
                 'getTachesSaison','pctColor','getPCls','_dpRendHistRows'];
const PCT_STOPS = APP.match(/(?:var|const|let) _PCT_STOPS\s*=\s*\[[\s\S]*?\];/)[0].replace(/^const|^let/, 'var');
const LERP      = extraire('_lerp');
const src = 'var SAISONS=[{nom:"Campagne 2026",active:true}];\n'
  + 'var _VISU_SAISON="";\n'
  + 'var SAISON_PASSAGES={Ebourgeonnage:2,Pioche:2,Relevage:3};\n'
  + 'var TACHES=window.TACHES;\n'
  + PCT_STOPS + '\n' + LERP + '\n'
  + MOTEURS.map(extraire).join('\n') + '\n'
  + 'export const M={' + MOTEURS.join(',') + '};\n';

// ── Le domaine de test ──────────────────────────────────────────────────────
window.TACHES = [
  { nom:'Taille',        hha:35, saisons:['Campagne'] },
  { nom:'Pliage',        hha:12, saisons:['Campagne'] },
  { nom:'Ebourgeonnage', hha:20, saisons:['Campagne'] },
  { nom:'Relevage',      hha:18, saisons:['Campagne'] }
];
const V = { taches:{ Taille:'Validé', Pliage:'Validé', Ebourgeonnage:'Validé', Relevage:'Validé' } };
window.PARCELLES = [
  // 4 taches, tout valide → 100 %
  { nom:'Ergot', surface:0.37, statut:'Active', cepages:['Pinot Noir'], commune:{ nom:'Gevrey', lat:47.22, lng:4.96 },
    lat:'47.22', lng:'4.96', taches:V.taches, rendement_hist:[
      { millesime:2025, kg:1800, caisses:72 }, { millesime:2025, kg:200, caisses:8 },
      { millesime:2024, kg:1500, caisses:60 }] },
  // 2/4 → 50 %
  { nom:'Jouise', surface:0.52, statut:'Active', cepages:['Pinot Noir','Chardonnay'], entreplantation:true,
    commune:'Gevrey', lat:'47.23', lng:'4.97', taches:{ Taille:'Validé', Pliage:'Validé' } },
  // 1 tache hors sujet → 3 concernees, 3 faites → 100 %
  { nom:'Bollery Blanc', surface:0.23, statut:'Active', cepages:['Chardonnay'], commune:'Vosne',
    lat:'47.24', lng:'4.98', taches:V.taches, tachesExclues:['Relevage'] },
  // ni cepage, ni position, ni contour
  { nom:'Crais', surface:0.55, statut:'Active', commune:'', taches:{ Taille:'Validé' } },
  // arrachee
  { nom:'Chaziere', surface:0.09, statut:'Arrachee', cepages:['Pinot Noir'], commune:'Gevrey',
    lat:'47.25', lng:'4.99', taches:{}, rendement_hist:[{ millesime:2023, kg:400 }] }
];
window.SURF_TOTALE = 0.37 + 0.52 + 0.23 + 0.55;
window.KML_POLYGONS_DYNAMIC = [{ name:'Ergot', pts:[[47.22,4.96],[47.221,4.961],[47.222,4.962]] }];
window.KML_DATA = [];
window.JOURNAL = [
  { date:'2026-03-12', parcelle:'Ergot',  tache:'Taille', ouvrier:'Victor' },
  { date:'2026-04-02', parcelle:'Ergot',  tache:'Pliage', ouvrier:'Nico' },
  { date:'2026-05-20', parcelle:'Ergot',  meteo:true, tache:'Pluie 12 mm' },   // piege
  { date:'2026-03-30', parcelle:'Jouise', tache:'Taille', ouvrier:'Nico' }
];

const A = await import('data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64'));
Object.keys(A.M).forEach(k => { window[k] = A.M[k]; });

let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rge  = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (n, c, d) => { if (c) { ok++; console.log('   ' + vert('vert ') + ' ' + n); }
  else { ko++; console.log('   ' + rge('ROUGE') + ' ' + n + (d ? '  → ' + d : '')); } };

console.log('\n0. Les moteurs extraits d\'app.js repondent');
T('getTachesSaison() rend les 4 taches', window.getTachesSaison().length === 4);
T('getPCls(Ergot) = 100 % (4/4)', window.getPCls(window.PARCELLES[0]).pct === 100);
T('getPCls(Jouise) = 50 % (2/4)', window.getPCls(window.PARCELLES[1]).pct === 50);
T('getPCls(Bollery) = 100 % (3/3, Relevage hors sujet)',
  window.getPCls(window.PARCELLES[2]).pct === 100 && window.getPCls(window.PARCELLES[2]).nbTotal === 3);
T('_dpRendHistRows agrege 2025 : 2000 kg / 0,37 ha',
  window._dpRendHistRows(window.PARCELLES[0])[0].kg_ha === Math.round(2000 / 0.37));

await import(CIBLE);
const docs = [];
window._mvDocOpen = o => { docs.push(o); return true; };

console.log('\n1. Lecture du domaine');
const L = window._vgnLignes();
T('5 parcelles lues', L.length === 5, L.length);
T('tri par commune puis nom',
  L.map(l => l.nom).join(',') === 'Chaziere,Ergot,Jouise,Bollery Blanc,Crais', L.map(l => l.nom).join(','));
const byN = Object.fromEntries(L.map(l => [l.nom, l]));
T('le dernier travail d\'Ergot est le Pliage du 02/04, pas le relevé météo du 20/05',
  byN['Ergot'].dernier.tache === 'Pliage' && byN['Ergot'].dernier.date === '2026-04-02',
  JSON.stringify(byN['Ergot'].dernier));
T('Ergot est localisee et contouree', byN['Ergot'].geo === true && byN['Ergot'].contour === true);
T('Jouise est localisee mais sans contour', byN['Jouise'].geo === true && byN['Jouise'].contour === false);
T('Crais n\'a ni cepage, ni position, ni contour',
  !byN['Crais'].cepages.length && byN['Crais'].geo === false && byN['Crais'].contour === false);
T('Bollery : 1 tache hors sujet comptee', byN['Bollery Blanc'].exclues.length === 1);
T('Chaziere est marquee arrachee', byN['Chaziere'].arrachee === true);

console.log('\n2. Repartition par cepage');
const C = window._vgnParCepage(L);
const cep = Object.fromEntries(C.map(c => [c.cepage, c]));
T('Pinot Noir : 2 parcelles, 0,89 ha (Chaziere arrachee exclue)',
  cep['Pinot Noir'] && cep['Pinot Noir'].n === 2 && Math.abs(cep['Pinot Noir'].ha - 0.89) < 1e-9,
  cep['Pinot Noir'] && cep['Pinot Noir'].n + ' / ' + cep['Pinot Noir'].ha);
T('Chardonnay : 2 parcelles (Jouise complantee comptee), 0,75 ha',
  cep['Chardonnay'] && cep['Chardonnay'].n === 2 && Math.abs(cep['Chardonnay'].ha - 0.75) < 1e-9);
T('les parcelles sans cepage ont leur propre ligne',
  C.some(c => c.cepage.indexOf('non renseign') !== -1));

console.log('\n3. Le document');
docs.length = 0;
window._vgnExportVignoble();
T('un document est produit', docs.length === 1, docs.length);
const D = docs[0] || { corps:'', metas:[] }, h = D.corps || '';
T('titre et orientation', D.titre === 'État du vignoble' && D.orient === 'paysage', D.titre + '/' + D.orient);
T('4 parcelles actives annoncees', h.indexOf('Les parcelles en production — 4 sur 1,67 ha') !== -1);
// avancement pondere par la surface : (100*.37 + 50*.52 + 100*.23 + 25*.55) / 1.67
const att = Math.round((100*0.37 + 50*0.52 + 100*0.23 + 25*0.55) / 1.67);
T('avancement pondere par la surface = ' + att + ' %',
  h.indexOf('<span>' + att + ' <small>%</small></span>') !== -1 && h.indexOf('>' + att + ' %</td>') !== -1);
T('la surface totale du tableau = 1,67 ha', h.indexOf('<td class="n">1,67</td>') !== -1);
T('Jouise est signalee complantee', /Jouise[\s\S]{0,400}complantée/.test(h));
T('le rendement 2025 d\'Ergot est ramene a l\'hectare',
  h.indexOf('2025 · ' + Math.round(2000 / 0.37).toLocaleString('fr-FR') + ' kg/ha') !== -1);
T('les reperes manquants de Crais sont marques',
  /Crais[\s\S]{0,900}vg-m">cépage[\s\S]{0,200}vg-m">GPS[\s\S]{0,200}vg-m">contour/.test(h));
T('Ergot ne porte aucun repere manquant', /Ergot[\s\S]{0,700}vg-ok/.test(h));
T('la section « Ce qu\'il reste à renseigner » nomme les parcelles',
  h.indexOf('Cépage absent') !== -1 && h.indexOf('Aucune position') !== -1
  && h.indexOf('Aucun contour') !== -1);
T('les arrachees ont leur propre tableau', h.indexOf('Parcelles arrachées — 1') !== -1);
T('Chaziere n\'est pas dans le tableau des actives',
  (h.match(/Chaziere/g) || []).length === 1);
T('le double compte des complantees est annonce', h.indexOf('peut donc dépasser la surface') !== -1);
T('l\'absence d\'heures est annoncee', h.indexOf('Aucune heure ne figure ici') !== -1);
T('la periode consultee est nommee', h.indexOf('Campagne 2026') !== -1);
T('l\'encadre de limite est present', h.indexOf('mvdoc-lim') !== -1);

console.log('\n4. Structure HTML');
{
  const o = t => (h.match(new RegExp('<' + t + '(?=[ >])', 'g')) || []).length;
  const f = t => (h.match(new RegExp('</' + t + '>', 'g')) || []).length;
  const dese = ['div','table','thead','tbody','tr','td','th','h2','span','i','b'].filter(t => o(t) !== f(t));
  T('balises equilibrees', dese.length === 0, dese.join(','));
  (h.match(/<table>[\s\S]*?<\/table>/g) || []).forEach((tb, i) => {
    const larg = (tb.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []).map(r =>
      (r.match(/<t[dh][^>]*>/g) || []).reduce((s, cc) => {
        const m = cc.match(/colspan="?(\d+)/); return s + (m ? +m[1] : 1); }, 0));
    T('tableau ' + (i + 1) + ' rectangulaire', new Set(larg).size === 1, [...new Set(larg)].join('/'));
  });
}

console.log('\n5. Cas limites');
const sauve = window.PARCELLES;
window.PARCELLES = [];
docs.length = 0; window._vgnExportVignoble();
T('aucune parcelle → aucun document', docs.length === 0);
window.PARCELLES = [{ nom:'Vieille', surface:0.2, statut:'Arrachee', taches:{} }];
docs.length = 0; window._vgnExportVignoble();
T('que des arrachees → aucun document', docs.length === 0);
window.PARCELLES = sauve;
window.SURF_TOTALE = 0;   // valeur absente : on retombe sur la somme du tableau
docs.length = 0; window._vgnExportVignoble();
T('sans SURF_TOTALE, la surface affichee reste 1,67 ha',
  (docs[0] || { corps:'' }).corps.indexOf('4 sur 1,67 ha') !== -1);
window.SURF_TOTALE = 1.67;

console.log('\n──────────────────────────────');
console.log('  ' + ok + ' vert · ' + ko + ' ' + (ko ? rge('ROUGE') : 'rouge'));

if (CONTRE && !ko) {
  const base = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['releves meteo comptes comme travaux', "if(!j || j.meteo || !j.parcelle || !j.date) return;",
      "if(!j || !j.parcelle || !j.date) return;"],
    ['avancement en moyenne simple au lieu de pondere',
      "    ? Math.round(act.reduce(function(s, l){ return s + l.pct * l.ha; }, 0) / haAct)",
      "    ? Math.round(act.reduce(function(s, l){ return s + l.pct; }, 0) / act.length)"],
    ['arrachees comptees dans les cepages', "    if(l.arrachee) return;\n    var cs =", "    var cs ="],
    ['tri par commune abandonne', "    if(ca !== cb) return ca < cb ? -1 : 1;", ""],
    ['reperes manquants muets', "    if(!l.cepages.length) m += '<span class=\"vg-m\">c\\u00e9page</span>';", "    "],
    ['taches hors sujet non filtrees sur la saison',
      "      exclues: (p.tachesExclues || []).filter(function(t){\n        return taches.some(function(x){ return x.nom === t; });\n      }),",
      "      exclues: [],"],
    ['rendement non ramene a l\'hectare',
      "    if(l.rend.kg_ha != null) return l.rend.millesime + ' \\u00b7 ' + l.rend.kg_ha.toLocaleString('fr-FR') + ' kg/ha';",
      "    if(l.rend.kg_ha != null) return l.rend.millesime + ' \\u00b7 ' + Math.round(l.rend.kg).toLocaleString('fr-FR') + ' kg/ha';"],
    ['arrachees melangees aux actives',
      "  var act = lignes.filter(function(l){ return !l.arrachee; });", "  var act = lignes;"],
    ['double compte des complantees passe sous silence',
      "    + 'ses c\\u00e9pages : la somme de cette colonne peut donc d\\u00e9passer la surface du domaine. Rien ne '",
      "    + 'ses c\\u00e9pages. Rien ne '"],
    ['contour ignore (tout le monde est cartographie)',
      "      contour: !!ctrs[String(p.nom).toLowerCase()]", "      contour: true"]
  ];
  console.log('\n  CONTRE-EPREUVES — ' + DEFAUTS.length + ' defauts reinjectes un par un\n');
  let sansEffet = 0;
  DEFAUTS.forEach(([nom, vieux, neuf], i) => {
    const n = base.split(vieux).length - 1;
    if (n !== 1) { console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(48) + ' '
      + rge('MOTIF INTROUVABLE (' + n + ')')); sansEffet++; return; }
    const tmp = path.join(RACINE, 'src', '.mv-ko-vgn-' + (i + 1) + '.js');
    fs.writeFileSync(tmp, base.replace(vieux, neuf));
    let rouge = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url), tmp],
      { stdio:'pipe', env:{ ...process.env, NO_COLOR:'1' } }); } catch { rouge = true; }
    fs.unlinkSync(tmp);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(48) + ' '
      + (rouge ? vert('rouge') : rge('LE HARNAIS RESTE VERT')));
    if (!rouge) sansEffet++;
  });
  console.log();
  if (sansEffet) { console.log('  ' + rge(sansEffet + ' contre-epreuve(s) sans effet.')); process.exit(1); }
  console.log('  ' + vert('Les ' + DEFAUTS.length + ' defauts font tous rougir le harnais.'));
}
process.exit(ko ? 1 : 0);
