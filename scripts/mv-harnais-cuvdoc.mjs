#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : les deux documents du Cuvier (APP 6.08 / SW 6.58)
// ═══════════════════════════════════════════════════════════════════════════
//  Charge le module REEL src/cave.js dans Node derriere un DOM minimal, y
//  injecte un domaine de test exactement comme le fait `applyFbData`
//  (Object.assign sur window.CAVE_VENDANGE — la meme reference que la var du
//  module), puis intercepte window._mvDocOpen pour lire le document produit.
//  Aucun moteur n'est reimplemente : le harnais interroge le code livre.
//
//  Usage :
//    node scripts/mv-harnais-cuvdoc.mjs            # les tests
//    node scripts/mv-harnais-cuvdoc.mjs --contre   # + les contre-epreuves
//    node scripts/mv-harnais-cuvdoc.mjs <cave.js>  # sur une copie donnee
//
//  ⚠ Un harnais qui ne sait pas rougir ne prouve rien : `--contre` reinjecte
//    dix defauts un par un dans une COPIE du module et exige que chacun fasse
//    echouer les tests. Un CRASH compte comme rouge.
//  ⚠ Le calendrier du test est RELATIF a la date du jour : aucune date en dur,
//    le harnais reste rejouable dans un an.
//
//  Exit 0 si tout passe, 1 sinon.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const args   = process.argv.slice(2);
const CONTRE = args.includes('--contre');
const CIBLE  = args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'cave.js');

// ── DOM minimal : on ne remplace que le navigateur, jamais le code teste ────
function El() {
  return { id:'', innerHTML:'', textContent:'', value:'', style:{}, dataset:{}, children:[],
    parentNode:null, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    appendChild(c){ this.children.push(c); return c; },
    insertBefore(c){ this.children.push(c); return c; },
    removeChild(){}, addEventListener(){}, removeEventListener(){}, remove(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    getBoundingClientRect(){ return { width:700, height:300, top:0, left:0 }; },
    focus(){}, click(){}, closest(){ return null; } };
}
const doc = { body:El(), head:El(), documentElement:El(),
  getElementById(){ return null; }, querySelector(){ return null; }, querySelectorAll(){ return []; },
  createElement(){ return El(); }, createTextNode(){ return El(); },
  addEventListener(){}, removeEventListener(){}, cookie:'' };
const mem = {};
const win = { document:doc,
  location:{ hostname:'test', href:'https://test/', search:'', pathname:'/' },
  localStorage:{ getItem:k => (k in mem ? mem[k] : null), setItem:(k,v) => { mem[k] = String(v); },
    removeItem:k => { delete mem[k]; }, clear(){}, key(){ return null; }, length:0 },
  navigator:{ userAgent:'node', onLine:true, language:'fr-FR' },
  addEventListener(){}, removeEventListener(){},
  matchMedia(){ return { matches:false, addEventListener(){}, addListener(){} }; },
  requestAnimationFrame(f){ return setTimeout(f, 0); },
  getComputedStyle(){ return { getPropertyValue(){ return ''; } }; },
  innerWidth:900, innerHeight:800, devicePixelRatio:1,
  open(){ return null; }, print(){}, alert(){}, confirm(){ return true; },
  URL:{ createObjectURL(){ return 'blob:x'; }, revokeObjectURL(){} },
  Blob:function(p){ this.parts = p; } };
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.getComputedStyle = win.getComputedStyle;
globalThis.matchMedia = win.matchMedia; globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value:win.navigator, configurable:true }); }
catch { /* Node expose deja un navigator en lecture seule */ }

// ── Les tests ───────────────────────────────────────────────────────────────
let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rouge = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (nom, cond, det) => {
  if (cond) { ok++; console.log('   ' + vert('vert ') + ' ' + nom); }
  else { ko++; console.log('   ' + rouge('ROUGE') + ' ' + nom + (det ? '  → ' + det : '')); }
};

const TODAY = new Date().toISOString().slice(0, 10);
const Y0 = +TODAY.slice(0, 4), Y1 = Y0 - 1, Y2 = Y0 - 2;
const d = (y, md) => y + '-' + md;
const A = (p, dt, val, mode) => ({ id:'a_' + p + dt, parcelle:p, date:dt, val, mode:mode || 'sucre', spd:16.83 });

await import(CIBLE.startsWith('/') ? CIBLE : path.resolve(CIBLE));

window.PARCELLES = [
  { nom:'Ergot',         surface:0.37, statut:'Active',   cepages:['Pinot noir'] },
  { nom:'Jouise',        surface:0.52, statut:'Active',   cepages:['Pinot noir'] },
  { nom:'Bollery Blanc', surface:0.23, statut:'Active',   cepages:['Chardonnay'] },
  { nom:'Crais',         surface:0.55, statut:'Active' },              // aucun cepage → non classee
  { nom:'Comble',        surface:0.30, statut:'Active',   cepages:['Pinot noir'] },
  { nom:'Charreux',      surface:0.11, statut:'Active',   cepages:['Pinot noir'] },
  { nom:'Chaziere',      surface:0.09, statut:'Arrachee', cepages:['Pinot noir'] }
];
Object.assign(window.CAVE_VENDANGE, {
  config:{ poids_caisse_kg:25, ratio_min:130, ratio_max:140, sucre_par_degre:16.83 },
  analyses:[
    A('Ergot', d(Y1,'08-25'), 170), A('Ergot', d(Y1,'09-01'), 185),
    A('Ergot', d(Y1,'09-08'), 200), A('Ergot', d(Y1,'09-15'), 215),
    A('Jouise', d(Y1,'08-25'), 160), A('Jouise', d(Y1,'09-01'), 175),
    A('Jouise', d(Y1,'09-08'), 190), A('Jouise', d(Y1,'09-15'), 205),
    A('Bollery Blanc', d(Y1,'09-08'), 180), A('Bollery Blanc', d(Y1,'09-15'), 195),
    A('Crais', d(Y1,'09-15'), 150),
    A('Charreux', d(Y1,'09-08'), 210),
    A('Ergot', TODAY, 250),            // vendange SUIVANTE — ne doit pas polluer Y1
    A('Ergot', d(Y2,'09-10'), 190)     // vendange d'avant
  ],
  recoltes:[
    { id:'r1', parcelle:'Charreux', date:d(Y1,'09-10'), nb_caisses:40, cuvee:'Charreux' },
    { id:'r2', parcelle:'Jouise',   date:TODAY,          nb_caisses:60, cuvee:'Jouise' }
  ],
  cuves_vinif:[
    { id:'c1', nom:'Cuve 3', volume_hl:24, statut:'termine', parcelles:['Ergot','Jouise'],
      date_entree:d(Y1,'09-16'), erasflage:'total', so2_g_hl:3, levures:'indigenes',
      nb_caisses:120, mpf:{ active:true, temp_c:12, duree_j:4 },
      mesures_fa:[
        { id:'m1', date:d(Y1,'09-17'), densite:1092, temp_c:18,   remontages:2, pigeages:1, note:'départ' },
        { id:'m2', date:d(Y1,'09-20'), densite:1050, temp_c:28,   remontages:2, pigeages:2, note:'' },
        { id:'m3', date:d(Y1,'09-24'), densite:996,  temp_c:null, remontages:1, pigeages:0, note:'sec' }
      ],
      operations:[
        { id:'o1', type:'chaptalisation', date:d(Y1,'09-18'), volume_hl:24, degre:0.5, kg_sucre:20.196, note:'' },
        { id:'o2', type:'so2', date:d(Y1,'09-24'), dose:3, note:'avant entonnage' }
      ],
      decuvage:{ date:d(Y1,'09-26'), cuvee_id:'cu1' } },
    { id:'c2', nom:'Cuve 5', volume_hl:12, statut:'fa', parcelles:['Bollery Blanc'],
      date_entree:d(Y1,'09-18'), erasflage:'entiere', levures:'selectionnees',
      mesures_fa:[], operations:[] },
    { id:'c0', nom:'Cuve 1 (vieille)', volume_hl:30, statut:'termine', parcelles:['Crais'],
      date_entree:d(Y2,'09-15'), erasflage:'total', mesures_fa:[], operations:[] }
  ],
  clients:[], cuvees:[]
});
Object.assign(window.CAVE_ELEVAGE, {
  cuvees:[{ id:'cu1', nom:'Gevrey Villages', millesime:Y1, statut:'elevage', tonneaux:[] }],
  operations:[], analyses:[], config:{ ouillage_alerte_j:14 }
});

const docs = [];
window._mvDocOpen = o => { docs.push(o); return true; };
window.openPrompt = null;   // appels directs : une seule annee par document

console.log('\n1. Inventaire des annees');
const ansM = window._matAnnees(), ansC = window._cuvAnnees();
T('_matAnnees() : 3 annees, la plus recente d\'abord',
  ansM.length === 3 && ansM[0] === String(Y0) && ansM[2] === String(Y2), ansM.join(','));
T('_cuvAnnees() : ' + Y1 + ' puis ' + Y2,
  ansC.length === 2 && ansC[0] === String(Y1) && ansC[1] === String(Y2), ansC.join(','));

console.log('\n2. Controle de maturite ' + Y1 + ' (campagne passee)');
docs.length = 0; window._matDoc(String(Y1));
T('un document est produit', docs.length === 1, 'docs=' + docs.length);
const D = docs[0] || { corps:'', metas:[] }, c = D.corps || '';
T('titre et orientation', D.titre === 'Contrôle de maturité ' + Y1 && D.orient === 'paysage',
  D.titre + ' / ' + D.orient);
const ths = (c.match(/<th class="n">(\d{2}\/\d{2})<\/th>/g) || []).map(s => s.replace(/<[^>]+>/g, ''));
T('4 colonnes de jours de releve', ths.length === 4, ths.join(' '));
T('colonnes 25/08 01/09 08/09 15/09', ths.join(' ') === '25/08 01/09 08/09 15/09', ths.join(' '));
T('la mesure du ' + TODAY + ' (vendange suivante) est exclue', c.indexOf('>250<') === -1);
const noms = (c.match(/<tr><td>([^<]+)<\/td>/g) || []).map(s => s.replace(/<[^>]+>/g, ''));
T('ordre de maturite : la plus avancee en tete',
  noms[0] === 'Ergot' && noms.indexOf('Jouise') > noms.indexOf('Charreux'), noms.join(' > '));
const moyDom = Math.round((215*0.37 + 205*0.52 + 195*0.23 + 150*0.55) / (0.37+0.52+0.23+0.55));
const moyRge = Math.round((215*0.37 + 205*0.52) / (0.37+0.52));
T('moyenne domaine ponderee = ' + moyDom + ' g/L', c.indexOf('>' + moyDom + ' <small>g/L</small>') !== -1);
T('moyenne rouges ponderee = ' + moyRge + ' g/L', c.indexOf('>' + moyRge + ' <small>g/L</small>') !== -1);
T('moyenne blancs = 195 g/L', c.indexOf('>195 <small>g/L</small>') !== -1);
T('couverture : 4 parcelles sur 5', c.indexOf('4 parcelles sur 5') !== -1);
T('Charreux porte « Rentrée le 10/09 »', c.indexOf('Rentrée le 10/09') !== -1);
T('Jouise n\'est PAS rentree (sa recolte est de la vendange suivante)',
  (c.match(/Rentrée le/g) || []).length === 1);
T('Comble figure dans « Sans aucun relevé »',
  /Sans aucun relev[^<]*<\/h2>\s*<div class="cd-vide">[^<]*Comble/.test(c));
T('Crais est signalee comme non classee en couleur', c.indexOf('n’est pas classée') !== -1);
T('l\'encadre de limite est present', c.indexOf('mvdoc-lim') !== -1);
T('la fenetre et la date de reference sont ecrites', c.indexOf('7 derniers jours au 15/09') !== -1);

console.log('\n3. Controle de maturite ' + Y0 + ' (campagne en cours)');
docs.length = 0; window._matDoc(String(Y0));
const c0 = (docs[0] || { corps:'' }).corps || '';
T('un document est produit', docs.length === 1);
T('la mesure du jour (250) y est, elle', c0.indexOf('>250<') !== -1);
T('une seule colonne de date', (c0.match(/<th class="n">\d{2}\/\d{2}<\/th>/g) || []).length === 1);

console.log('\n4. Plus de huit jours de releve');
const sauve = window.CAVE_VENDANGE.analyses.slice();
window.CAVE_VENDANGE.analyses = [];
for (let i = 1; i <= 10; i++)
  window.CAVE_VENDANGE.analyses.push(A('Ergot', d(Y1, '09-' + String(i).padStart(2, '0')), 150 + i * 5));
docs.length = 0; window._matDoc(String(Y1));
const c4 = (docs[0] || { corps:'' }).corps || '';
T('8 colonnes affichees sur 10 jours',
  (c4.match(/<th class="n">\d{2}\/\d{2}<\/th>/g) || []).length === 8);
T('le document DIT combien de jours ne tiennent pas', c4.indexOf('Les 2 premiers jours') !== -1);
window.CAVE_VENDANGE.analyses = sauve;

console.log('\n5. Unite : le document suit ce que le domaine a mesure');
const sauve2 = window.CAVE_VENDANGE.analyses.slice();
window.CAVE_VENDANGE.analyses = [
  A('Ergot', d(Y1,'09-08'), 11.5, 'alc'), A('Ergot', d(Y1,'09-15'), 12.8, 'alc'),
  A('Jouise', d(Y1,'09-15'), 12.1, 'alc'), A('Crais', d(Y1,'09-15'), 200, 'sucre')
];
docs.length = 0; window._matDoc(String(Y1));
const c5 = (docs[0] || { corps:'' }).corps || '';
T('trois saisies en degre sur quatre → affichage en %vol', c5.indexOf('Valeurs en %vol') !== -1);
T('la valeur saisie en sucre est signalee comme convertie',
  c5.indexOf('cd-conv') !== -1 && c5.indexOf('en italique') !== -1);
T('12,8 %vol affiche pour Ergot', c5.indexOf('>12,8</td>') !== -1);
window.CAVE_VENDANGE.analyses = sauve2;

console.log('\n6. Cahier de cuverie ' + Y1);
docs.length = 0; window._cuvDoc(String(Y1));
T('un document est produit', docs.length === 1);
const K = docs[0] || { corps:'', metas:[] }, k = K.corps || '';
T('titre et orientation', K.titre === 'Cahier de cuverie ' + Y1 && K.orient === 'portrait');
T('deux cuves, la vieille de ' + Y2 + ' est ecartee',
  (k.match(/class="cd-cuve/g) || []).length === 2 && k.indexOf('Cuve 1 (vieille)') === -1);
T('la densite a 20 °C corrige la mesure a 28 °C',
  /<td class="n">1050<\/td><td class="n">(\d+)<\/td>/.test(k) && RegExp.$1 !== '1050', RegExp.$1);
T('sans temperature, la densite brute est reprise telle quelle',
  k.indexOf('<td class="n">996</td><td class="n">996</td>') !== -1);
T('le sucre restant est estime (1092 → ~218 g/L)',
  /<td class="n">1092<\/td><td class="n">\d+<\/td><td class="n">[\d,]+<\/td><td class="n">(\d+)<\/td>/.test(k)
  && +RegExp.$1 > 190 && +RegExp.$1 < 240, RegExp.$1);
T('totaux : 5 remontages, 3 pigeages',
  /<tr class="tot">.*?<td class="n">5<\/td><td class="n">3<\/td>/s.test(k));
T('la chaptalisation est detaillee par _rmDetail',
  k.indexOf('24 hL traités') !== -1 && k.indexOf('kg de sucre') !== -1);
T('le SO₂ porte sa dose', k.indexOf('3 g/hL') !== -1);
T('le decuvage nomme la cuvee partie au Chai',
  k.indexOf('Décuvée le 26/09') !== -1 && k.indexOf('Gevrey Villages') !== -1);
T('la cuve sans releve le dit au lieu d\'un tableau vide',
  k.indexOf('Aucun relevé de fermentation') !== -1);
T('l\'identite de la cuve est complete',
  k.indexOf('24 hL') !== -1 && k.indexOf('Éraflage total') !== -1 && k.indexOf('indigènes') !== -1
  && k.indexOf('Macération préfermentaire') !== -1 && k.indexOf('Cuvaison') !== -1);
T('les 3 releves sont comptes dans les metas', (K.metas || []).join(' ').indexOf('3 relevés') !== -1);

console.log('\n7. Structure HTML des deux documents');
for (const X of [D, K]) {
  const h = X.corps;
  const o = t => (h.match(new RegExp('<' + t + '(?=[ >])', 'g')) || []).length;
  const f = t => (h.match(new RegExp('</' + t + '>', 'g')) || []).length;
  const dese = ['div','table','thead','tbody','tr','td','th','h2','h3','span','em','b']
    .filter(t => o(t) !== f(t));
  T(X.titre + ' : balises equilibrees', dese.length === 0, dese.join(','));
  (h.match(/<table>[\s\S]*?<\/table>/g) || []).forEach((tb, i) => {
    const larg = (tb.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []).map(r =>
      (r.match(/<t[dh][^>]*>/g) || []).reduce((s, cc) => {
        const m = cc.match(/colspan="?(\d+)/); return s + (m ? +m[1] : 1); }, 0));
    T(X.titre + ' : tableau ' + (i + 1) + ' rectangulaire',
      new Set(larg).size === 1, 'largeurs ' + [...new Set(larg)].join('/'));
  });
}

console.log('\n8. Rien a imprimer');
const anaS = window.CAVE_VENDANGE.analyses.slice(), cuvS = window.CAVE_VENDANGE.cuves_vinif.slice();
window.CAVE_VENDANGE.analyses = []; window.CAVE_VENDANGE.cuves_vinif = [];
docs.length = 0; window._matExportChoix(); window._cuvExportChoix();
T('aucun document sans donnee', docs.length === 0, docs.length + ' documents');
window.CAVE_VENDANGE.analyses = anaS; window.CAVE_VENDANGE.cuves_vinif = cuvS;
docs.length = 0; window._matDoc('1998'); window._cuvDoc('1998');
T('une annee sans mesure ne produit pas de document', docs.length === 0);

console.log('\n──────────────────────────────');
console.log('  ' + ok + ' vert · ' + ko + ' ' + (ko ? rouge('ROUGE') : 'rouge'));

// ── Contre-epreuves ────────────────────────────────────────────────────────
if (CONTRE && !ko) {
  const base = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['borne haute des analyses retiree',
      '    if(refIso && a.date > ref) return;                // vendange suivante\n', ''],
    ['borne haute des recoltes retiree',
      '    if(refIso && r.date > ref) return;\n', ''],
    ['date de reference non transmise a _matSynth',
      'try{ S = _matSynth(_matFen, ref); }', 'try{ S = _matSynth(_matFen); }'],
    ['troncature a huit colonnes desactivee',
      '  var cols   = toutes.length > 8 ? toutes.slice(-8) : toutes;', '  var cols   = toutes;'],
    ['ordre de maturite inverse',
      '  var rangs  = _matClasse(byP, spd);', '  var rangs  = _matClasse(byP, spd).slice().reverse();'],
    ['densite brute au lieu de la corrigee a 20 °C',
      '(d20 != null ? Math.round(d20) : \'—\')', '(m.densite != null ? Math.round(m.densite) : \'—\')'],
    ['detail d\'operation perdu (_rmDetail court-circuite)',
      '_escHtml(_rmDetail(o) || \'—\')', '_escHtml(\'—\')'],
    ['unite figee en g/L', '  var un    = (nAlc > nTot / 2) ? \'a\' : \'s\';', '  var un    = \'s\';'],
    ['parcelles jamais mesurees oubliees',
      '  if(S.jamais && S.jamais.length){', '  if(false && S.jamais && S.jamais.length){'],
    ['moyenne simple au lieu de ponderee',
      '_matDocVal(b.pond, spd, un)', '_matDocVal(b.simple, spd, un)']
  ];
  console.log('\n  CONTRE-EPREUVES — ' + DEFAUTS.length + ' defauts reinjectes un par un\n');
  let sansEffet = 0;
  DEFAUTS.forEach(([nom, vieux, neuf], i) => {
    const n = base.split(vieux).length - 1;
    if (n !== 1) { console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(46) + ' '
      + rouge('MOTIF INTROUVABLE (' + n + ')')); sansEffet++; return; }
    const tmp = path.join(RACINE, '.mv-ko-' + (i + 1) + '.js');
    fs.writeFileSync(tmp, base.replace(vieux, neuf));
    let rouge2 = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url), tmp],
      { stdio:'pipe', env:{ ...process.env, NO_COLOR:'1' } }); }
    catch { rouge2 = true; }
    fs.unlinkSync(tmp);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(46) + ' '
      + (rouge2 ? vert('rouge') : rouge('LE HARNAIS RESTE VERT')));
    if (!rouge2) sansEffet++;
  });
  console.log();
  if (sansEffet) { console.log('  ' + rouge(sansEffet + ' contre-epreuve(s) sans effet.')); process.exit(1); }
  console.log('  ' + vert('Les ' + DEFAUTS.length + ' defauts font tous rougir le harnais.'));
}
process.exit(ko ? 1 : 0);
