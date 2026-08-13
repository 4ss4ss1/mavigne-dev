#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : le carnet d'entretien à la charte (APP 6.11 / SW 6.61)
// ═══════════════════════════════════════════════════════════════════════════
//  app.js ne se charge pas dans Node (il importe le SDK Firebase et
//  styles.css). La fonction testee est donc EXTRAITE DU SOURCE REEL
//  (methode C20) avec les quelques globals qu'elle lit, puis executee.
//
//  Ce qu'il prouve :
//    · le document passe bien par window._mvDocOpen ;
//    · il porte le nom du DOMAINE, plus jamais « GUERETTECH » ni « Ma Vigne » ;
//    · le CSS propre au carnet est intact (les 39 regles conservees) ;
//    · le CSS que la charte fournit deja n'est plus duplique (@page, body, …) ;
//    · le corps — fiches, anomalies, reparations, sauts de page — est complet ;
//    · l'overlay se referme, et rien ne sort si aucune machine n'est cochee.
//
//  Usage :
//    node scripts/mv-harnais-entretien.mjs            # les tests
//    node scripts/mv-harnais-entretien.mjs --contre   # + les contre-epreuves
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
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'app.js'));

const APP = fs.readFileSync(CIBLE, 'utf8');
function extraire(nom){
  const m = APP.match(new RegExp('\\nfunction ' + nom + '\\s*\\('));
  if (!m) throw new Error('fonction introuvable dans app.js : ' + nom);
  let i = m.index + 1, k = APP.indexOf('{', i), d = 0;
  for (;; k++) { const c = APP[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return APP.slice(i, k + 1);
}

// ── Les cases cochees et l'annee : le carnet les lit dans le DOM. ───────────
let COCHEES = ['t1', 't2'];
const doc = {
  getElementById(id){
    if (id === 'exp-ent-annee') return { value: '2026' };
    if (id === 'ovExportEntretien') return ovFake;
    return null;
  },
  querySelectorAll(sel){
    if (sel === '.exp-ent-trac-cb:checked') return COCHEES.map(v => ({ value: v }));
    return [];
  },
  createElement(){ return { style:{}, classList:{ add(){}, remove(){} } }; }
};
let ovFerme = false;
const ovFake = { classList:{ remove(c){ if (c === 'open') ovFerme = true; }, add(){} } };
const toasts = [];
globalThis.document = doc;
globalThis.window = { document: doc };

// ── Le domaine de test ──────────────────────────────────────────────────────
const CTX = {
  TRACTEURS_LIST: [
    { id:'t1', nom:'Fendt 209', modele:'209 F Vario', annee:2019 },
    { id:'t2', nom:'Kubota',    modele:'M5091N',      annee:2021 },
    { id:'t3', nom:'Vieux New Holland', modele:'TN75', annee:2004 }
  ],
  ENTRETIENS: [
    { id:'e1', tracteurId:'t1', date:'2026-03-12', plein:true, huile:true, filtre_air:true,
      radiateur:true, pression_pneu:true, lavage:false, activite:'Griffage', conducteur:'Victor' },
    { id:'e2', tracteurId:'t1', date:'2026-05-04', plein:true, huile:false, filtre_air:false,
      radiateur:false, pression_pneu:true, lavage:true, activite:'Rognage', conducteur:'Nico',
      anomalie:'Fuite hydraulique c\u00f4t\u00e9 droit' },
    { id:'e3', tracteurId:'t2', date:'2026-04-18', plein:true, huile:true, filtre_air:true,
      radiateur:true, pression_pneu:true, lavage:true, activite:'Intercep', conducteur:'Victor' },
    { id:'e4', tracteurId:'t3', date:'2026-02-02', plein:true, huile:true, activite:'Buttage' }
  ],
  REPARATEUR: { t1:{ depuis:'2026-05-05', motif:'Fuite hydraulique', prevu_retour:'2026-05-20',
                     retour_reel:'2026-05-18', reparateur:'Garage Dupont' } },
  REPARATEUR_HIST: {},
  ACTIVITES: [ { nom:'Griffage', emoji:'\u{1F69C}', tracteurDefautId:'t1' },
               { nom:'Rognage',  emoji:'\u2702\ufe0f', tracteurDefautId:'t2' },
               { nom:'Intercep', emoji:'\u2702\ufe0f', tracteurDefautId:'t2' },
               { nom:'Buttage',  emoji:'\u{1F331}', tracteurDefautId:'t1' } ],
  SESSIONS: [],
  DOMAINE_NOM: 'Domaine Marchand-Grillot'
};

const globs = Object.keys(CTX).map(k => 'var ' + k + ' = CTX.' + k + ';').join('\n');
const src = 'export function build(CTX, showToast, win){\n'
  + globs + '\n'
  + 'var window = win, document = win.document;\n'
  + 'function _escHtml(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }\n'
  + 'function _escAttr(s){ return _escHtml(s); }\n'
  + extraire('lancerExportEntretienPDF') + '\n'
  + 'return lancerExportEntretienPDF;\n}\n';
const { build } = await import('data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64'));

const docs = [];
const win = { document: doc, DOMAINE_NOM: CTX.DOMAINE_NOM, APP_VERSION: '6.11',
  _mvDocOpen(o){ docs.push(o); return true; },
  _escHtml(s){ return String(s == null ? '' : s); } };
const fn = build(CTX, (m, c) => toasts.push(m), win);

let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rge  = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (n, c, d) => { if (c) { ok++; console.log('   ' + vert('vert ') + ' ' + n); }
  else { ko++; console.log('   ' + rge('ROUGE') + ' ' + n + (d ? '  → ' + d : '')); } };

console.log('\n1. Le document passe par la charte');
fn();
T('un document est produit', docs.length === 1, 'docs=' + docs.length);
const D = docs[0] || { css:'', corps:'', metas:[] };
T('titre : « Carnet d’entretien 2026 »', D.titre === 'Carnet d\u2019entretien 2026', D.titre);
T('orientation portrait et catégorie tracteur', D.orient === 'portrait' && D.cat === 'tracteur');
T('les métas nomment les machines et la date',
  (D.metas || []).join(' | ').indexOf('Fendt 209, Kubota') !== -1
  && (D.metas || []).join(' ').indexOf('2 machines') !== -1, (D.metas || []).join(' | '));
T('l’overlay de choix se referme', ovFerme === true);

console.log('\n2. Ce que l’ancien en-tête disait, et ne dit plus');
const tout = (D.css || '') + (D.corps || '') + (D.metas || []).join(' ') + (D.titre || '');
T('⚠️ plus aucune mention de GUERETTECH', tout.indexOf('GUERETTECH') === -1);
T('⚠️ le document ne s’intitule plus « Ma Vigne »', (D.titre || '').indexOf('Ma Vigne') === -1);
T('plus de « Document confidentiel · Usage interne »', tout.indexOf('confidentiel') === -1);
T('l’ancien en-tête a disparu du corps',
  tout.indexOf('doc-header') === -1 && tout.indexOf('doc-footer') === -1 && tout.indexOf('doc-meta') === -1);

console.log('\n3. Le CSS : la charte fournit, le document ne duplique plus');
T('plus de @page dans le CSS du document', (D.css || '').indexOf('@page') === -1);
T('plus de font-family de base (body)', /body\s*\{[^}]*font-family/.test(D.css || '') === false);
T('plus de reset * {}', /(^|\})\s*\*\s*\{/.test(D.css || '') === false);
for (const cl of ['.tracteur-section', '.tracteur-title', '.resume-bar', '.fiche-bloc',
                  '.check-item', '.anomalie', '.rep-bloc', '.page-break'])
  T('le CSS propre au carnet est conservé : ' + cl, (D.css || '').indexOf(cl) !== -1);
T('le CSS ne contient aucune accolade orpheline',
  ((D.css || '').match(/\{/g) || []).length === ((D.css || '').match(/\}/g) || []).length,
  ((D.css || '').match(/\{/g) || []).length + ' / ' + ((D.css || '').match(/\}/g) || []).length);

console.log('\n4. Le corps est complet');
const c = D.corps || '';
T('les deux machines cochées y sont, la troisième non',
  c.indexOf('Fendt 209') !== -1 && c.indexOf('Kubota') !== -1 && c.indexOf('New Holland') === -1);
T('un saut de page sépare les machines', c.indexOf('page-break') !== -1);
T('les fiches d’entretien sont là', (c.match(/fiche-bloc/g) || []).length >= 3);
T('l’anomalie est reportée', c.indexOf('Fuite hydraulique c\u00f4t\u00e9 droit') !== -1);
T('la réparation figure au carnet', c.indexOf('Garage Dupont') !== -1 || c.indexOf('rep-bloc') !== -1);
T('les compteurs de résumé sont calculés', c.indexOf('resume-val') !== -1);
T('balises équilibrées',
  ['div','section','span'].every(t =>
    (c.match(new RegExp('<' + t + '(?=[ >])', 'g')) || []).length
    === (c.match(new RegExp('</' + t + '>', 'g')) || []).length));

console.log('\n5. Rien à imprimer');
COCHEES = [];
docs.length = 0;
fn();
T('aucune machine cochée → aucun document', docs.length === 0);
T('et l’utilisateur est prévenu', toasts.some(t => /S\u00e9lectionnez/.test(t)));
COCHEES = ['t1', 't2'];

console.log('\n──────────────────────────────');
console.log('  ' + ok + ' vert · ' + ko + ' ' + (ko ? rge('ROUGE') : 'rouge'));

if (CONTRE && !ko) {
  const base = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['le document ne passe plus par la charte',
      "  var _entOk = window._mvDocOpen({", "  var _entOk = false && window._mvDocOpen({"],
    ['le titre reprend le nom de l’éditeur',
      "    titre:'Carnet d\\u2019entretien '+annee,", "    titre:'Ma Vigne \\u2014 Entretien '+annee,"],
    ['les machines disparaissent des métas',
      "           tracteursSelectionnes.map(function(t){return t.nom;}).join(', '),", "           '',"],
    ['le CSS propre au carnet est perdu',
      "orient:'portrait', cat:'tracteur', css:_entCss, corps:sectionsHTML,",
      "orient:'portrait', cat:'tracteur', css:'', corps:sectionsHTML,"],
    ['le corps est vide',
      "orient:'portrait', cat:'tracteur', css:_entCss, corps:sectionsHTML,",
      "orient:'portrait', cat:'tracteur', css:_entCss, corps:'',"],
    ['l’overlay reste ouvert',
      "  var _entOv=document.getElementById('ovExportEntretien'); if(_entOv) _entOv.classList.remove('open');", "  "],
    ['une @page revient dans le CSS du document',
      "  var _entCss = ''\n", "  var _entCss = '@page{size:A4;margin:0}'\n"]
  ];
  console.log('\n  CONTRE-EPREUVES — ' + DEFAUTS.length + ' defauts reinjectes un par un\n');
  let sansEffet = 0;
  DEFAUTS.forEach(([nom, vieux, neuf], i) => {
    const n = base.split(vieux).length - 1;
    if (n !== 1) { console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(46) + ' '
      + rge('MOTIF INTROUVABLE (' + n + ')')); sansEffet++; return; }
    const tmp = path.join(RACINE, 'src', '.mv-ko-ent-' + (i + 1) + '.js');
    fs.writeFileSync(tmp, base.replace(vieux, neuf));
    let rouge = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url), tmp],
      { stdio:'pipe', env:{ ...process.env, NO_COLOR:'1' } }); } catch { rouge = true; }
    fs.unlinkSync(tmp);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(46) + ' '
      + (rouge ? vert('rouge') : rge('LE HARNAIS RESTE VERT')));
    if (!rouge) sansEffet++;
  });
  console.log();
  if (sansEffet) { console.log('  ' + rge(sansEffet + ' contre-epreuve(s) sans effet.')); process.exit(1); }
  console.log('  ' + vert('Les ' + DEFAUTS.length + ' defauts font tous rougir le harnais.'));
}
process.exit(ko ? 1 : 0);
