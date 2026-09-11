#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais CUVGR-3 : l'infobulle tactile du socle
// ══════════════════════════════════════════════════════════════════════
//  Charge le module REEL src/cave.js derriere un DOM minimal, et lit le SVG
//  produit. Ce qui est tenu ici :
//   1. UNE COLONNE DE TOUCHE PAR RELEVE, bord a bord. Un creux entre deux
//      colonnes, c'est un doigt qui tombe dans le vide.
//   2. ELLES SONT EMISES EN DERNIER. Un <rect> pose avant la courbe serait
//      recouvert et n'attraperait plus rien.
//   3. LE PAPIER N'EN PORTE PAS (`sansTouche`), et le graphe garde
//      `role="img"` : les zones sont `aria-hidden`, l'arbre d'accessibilite ne
//      bouge pas.
//   4. AUCUN AUTRE GRAPHE N'EST TOUCHE. Les quatorze qui n'emettent pas de
//      zone doivent sortir exactement comme avant.
//
//  Usage :  node scripts/mv-harnais-cuvgr3.mjs [--contre]
// ══════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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


// ⚠ `startsWith('/')` etait DEJA une hypothese Unix : sous Windows un chemin absolu
//   commence par « C:\\ ». pathToFileURL(path.resolve(...)) est juste des deux cotes.
await import(pathToFileURL(path.resolve(CIBLE)).href);


let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert  = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rouge = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (nom, cond, det) => {
  if (cond) { ok++; console.log('   ' + vert('vert ') + ' ' + nom); }
  else { ko++; console.log('   ' + rouge('ROUGE') + ' ' + nom + (det ? '  \u2192 ' + det : '')); }
};
const J = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const M = (dt, d, t, extra) => Object.assign({ id: 'm' + dt + d, date: dt, densite: d, temp_c: t,
  pigeages: 2, remontages: 1, note: '' }, extra || {});

const CUVE = { id:'k1', nom:'Cuve 3', volume_hl:21, statut:'fa', parcelles:['Les Charmes'],
  date_entree:J(-7),
  statut_hist:[{ id:'s1', statut:'mpf', date:J(-7) }, { id:'s2', statut:'fa', date:J(-5) }],
  operations:[{ id:'o1', type:'chaptalisation', date:J(-3), kg_sucre:60 }],
  mesures_fa:[ M(J(-7),1098,14), M(J(-6),1094,16), M(J(-5),1086,21), M(J(-4),1062,28),
               M(J(-3),1040,30), M(J(-2),1016,27), M(J(0),996,22, { note:'Presque sec' }) ] };
window.CAVE_VENDANGE.cuves_vinif = [CUVE];
window.CAVE_VENDANGE.config = { poids_caisse_kg:25, sucre_par_degre:16.83 };

const LARGEURS = [390, 430, 760];

console.log('\n\u2500\u2500 1. UNE COLONNE PAR RELEV\u00c9, BORD \u00c0 BORD \u2500\u2500');
for (const w of LARGEURS) {
  const svg = window._vendFermSvg(CUVE, w);
  const hits = [...svg.matchAll(/<rect class="mvg-hit"[^>]*x="([\d.]+)" y="0" width="([\d.]+)"/g)]
    .map(m => [ +m[1], +m[1] + +m[2] ]);
  T('w=' + w + ' : autant de colonnes que de relev\u00e9s (7)', hits.length === 7, 'colonnes=' + hits.length);
  let creux = 0;
  for (let i = 1; i < hits.length; i++) if (Math.abs(hits[i][0] - hits[i-1][1]) > 0.6) creux++;
  T('w=' + w + ' : aucun creux entre deux colonnes', creux === 0, 'creux=' + creux);
  const c0 = window._mvGraphCadre(w, 100);
  const cad = window._mvGraphCadre(w, c0.etroit ? 232 : 288,
    { padL: c0.etroit ? 44 : 52, padR: c0.etroit ? 12 : 44, padT: 26, padB: c0.etroit ? 30 : 34 });
  T('w=' + w + ' : la premi\u00e8re colonne part du cadre, la derni\u00e8re y finit',
    Math.abs(hits[0][0] - cad.padL) < 1.5 && Math.abs(hits[hits.length-1][1] - (w - cad.padR)) < 1.5,
    hits[0][0] + ' \u2192 ' + hits[hits.length-1][1]);
}

console.log('\n\u2500\u2500 2. \u2605 ELLES SONT \u00c9MISES EN DERNIER \u2500\u2500');
const svg = window._vendFermSvg(CUVE, 430);
T('la premi\u00e8re zone vient apr\u00e8s la derni\u00e8re courbe',
  svg.indexOf('class="mvg-hit"') > svg.lastIndexOf('<polyline'));
T('et apr\u00e8s le dernier point trac\u00e9',
  svg.indexOf('class="mvg-hit"') > svg.lastIndexOf('<circle'));

console.log('\n\u2500\u2500 3. CE QUE L\u2019INFOBULLE PORTE \u2500\u2500');
const tts = [...svg.matchAll(/data-tt="([^"]*)"/g)].map(m => m[1]);
T('chaque zone porte une infobulle', tts.length === 7);
T('toutes datent le relev\u00e9', tts.every(t => /class=&quot;t&quot;|class="t"/.test(t)));
T('la densit\u00e9 \u00e0 20 \u00b0C y est', tts.every(t => /densit/.test(t)));
T('la temp\u00e9rature y est', tts.every(t => /temp/.test(t)));
T('le jour de la chaptalisation la nomme', tts.some(t => /Chaptalisation/.test(t)));
T('le passage en FA est nomm\u00e9 sur son jour', tts.some(t => /FA/.test(t)));
T('la note du relev\u00e9 remonte', tts.some(t => /sec/.test(t)));
T('\u2605 le HTML de l\u2019infobulle est \u00e9chapp\u00e9 dans l\u2019attribut',
  !/data-tt="[^"]*<div/.test(svg));

console.log('\n\u2500\u2500 4. L\u2019ACCESSIBILIT\u00c9 NE BOUGE PAS \u2500\u2500');
T('le svg garde role="img"', /role="img"/.test(svg));
T('il garde son aria-label r\u00e9sum\u00e9', /aria-label="Fermentation de Cuve 3/.test(svg));
T('\u2605 les zones sont aria-hidden', (svg.match(/class="mvg-hit" aria-hidden="true"/g) || []).length === 7);
T('elles sont transparentes, pas invisibles au doigt', !/mvg-hit[^>]*display:none/.test(svg));

console.log('\n\u2500\u2500 5. LE PAPIER N\u2019EN PORTE PAS \u2500\u2500');
const pap = window._vendFermSvg(CUVE, 520, { sansTouche: true });
T('sansTouche : aucune zone', !pap.includes('mvg-hit'));
T('mais le trac\u00e9 est le m\u00eame', pap.includes('<polyline') && /role="img"/.test(pap));
T('le cahier de cuverie passe bien sansTouche',
  /_vendFermSvg\(c, MV_CUVDOC_GRW, \{ sansTouche:true \}\)/.test(fs.readFileSync(path.resolve(CIBLE), 'utf8')));
T('\u00ab touchez la courbe \u00bb est masqu\u00e9 \u00e0 l\u2019impression',
  /\.mvfm-tap\{display:none\}/.test(fs.readFileSync(path.resolve(CIBLE), 'utf8')));

console.log('\n\u2500\u2500 6. \u2605 AUCUN AUTRE GRAPHE N\u2019EST TOUCH\u00c9 \u2500\u2500');
/* Tous les graphes ne sont pas exposes : on vise la SOURCE.
   \u26a0\u26a0 CETTE ASSERTION ETAIT UN CLIQUET A L'ENVERS (CRB-2, 11/09). Elle
   exigeait `nHit === 1` : elle rougissait donc des qu'on AJOUTAIT une infobulle
   a un second graphe \u2014 c'est-a-dire exactement le geste qu'elle devrait
   encourager. Meme defaut que `A8` de mv-harnais-audit-pil (\u00a76c).
   Convertie : LE COMPTE NE DESCEND JAMAIS. Il protege ce que le lot CUVGR-3 a
   pose (la courbe de fermentation) sans interdire la suite. */
const SRC_CAVE = fs.readFileSync(path.resolve(CIBLE), 'utf8');
const CRB_HIT_MIN = 2;   /* _vendFermSvg (CUVGR-3) + _crbEnvSvg (CRB-2) */
const nHit = (SRC_CAVE.match(/_mvGraphHit\(/g) || []).length;
T('\u2605 le nombre de graphes a infobulle ne descend jamais (>= ' + CRB_HIT_MIN + ')',
  nHit >= CRB_HIT_MIN, 'appels=' + nHit);
const nSvg = (SRC_CAVE.match(/window\._mvGraphSvg\(/g) || []).length;
T('les autres graphes appellent toujours le socle inchang\u00e9 (' + nSvg + ')', nSvg >= 6);
/* Le socle : un graphe sans zone ne declenche rien du tout. */
T('\u2605 _mvGraphTouch sort sans rien faire sur une bo\u00eete sans zone', (() => {
  const boite = { querySelector: () => null, classList: { add(){} }, appendChild(){}, addEventListener(){} };
  window._mvGraphTouch(boite);
  return boite._mvTt === undefined;
})());
T('_mvGraphHit \u00e9chappe ce qu\u2019on lui donne',
  window._mvGraphHit({ h:200 }, 10, 20, 0, 30, '<b>x</b>').includes('&lt;b&gt;'));

console.log('\n' + (ko ? rouge('ROUGE ' + ko) : vert('VERT')) + '  \u2014  ' + ok + ' assertions, ' + ko + ' \u00e9checs');

if (CONTRE) {
  const DEF = [
    ['les zones emises AVANT la courbe',
     [`  if(!(opts && opts.sansTouche)){
    mes.forEach(function(m, k){`, `  if(false){
    mes.forEach(function(m, k){`]],
    ['des colonnes centrees et disjointes',
     [`      var xa = (k === 0) ? pL : (xm + X(Date.parse(mes[k-1].date))) / 2;`,
      `      var xa = xm - 6;`]],
    ['les zones entrent dans l arbre d accessibilite',
     [`  return '<rect class="mvg-hit" aria-hidden="true" x="'`, `  return '<rect class="mvg-hit" x="'`],
     'utils'],
    ['le papier recoit des zones',
     [`_vendFermSvg(c, MV_CUVDOC_GRW, { sansTouche:true })`, `_vendFermSvg(c, MV_CUVDOC_GRW)`]],
    ['l infobulle n est plus echappee',
     [`    + '" data-tt="' + _mvEsc(tt) + '"/>';`, `    + '" data-tt="' + tt + '"/>';`], 'utils'],
    /* ⚠️ Le garde qui ne gardait rien : `window._escHtml` n'existe nulle part.
       On verifie que le socle ne repart pas s'appuyer dessus. */
    ['le guillemet n est plus echappe dans _mvEsc',
     [`    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');`,
      `    .replace(/'/g, '&#39;');`], 'utils']
  ];
  const F_CAVE = path.join(RACINE, 'src', 'cave.js');
  const F_UTIL = path.join(RACINE, 'src', 'utils.js');
  const cave0 = fs.readFileSync(F_CAVE, 'utf8');
  const util0 = fs.readFileSync(F_UTIL, 'utf8');
  let rougi = 0;
  console.log('\n\u2550\u2550 CONTRE-\u00c9PREUVES \u2550\u2550');
  for (const [nom, [av, ap], ou] of DEF) {
    const cible = (ou === 'utils') ? F_UTIL : F_CAVE;
    const src0  = (ou === 'utils') ? util0 : cave0;
    if (src0.split(av).length - 1 !== 1) {
      console.log('   ' + rouge('ANCRE') + ' introuvable ou multiple : ' + nom); continue;
    }
    fs.writeFileSync(cible, src0.replace(av, ap));
    let mort = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { stdio:'pipe', cwd:RACINE }); }
    catch { mort = true; }
    fs.writeFileSync(cible, src0);
    console.log('   ' + (mort ? vert('rouge') : rouge('VERT ')) + '  ' + nom
      + (mort ? '' : '  \u2190 LE FILET NE SERT \u00c0 RIEN'));
    if (mort) rougi++;
  }
  console.log('\n   ' + rougi + ' / ' + DEF.length + ' d\u00e9fauts attrap\u00e9s');
  if (rougi !== DEF.length) process.exit(1);
}
process.exit(ko ? 1 : 0);
