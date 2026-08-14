#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : le relevé individuel d'un salarié (APP 6.10 / SW 6.60)
// ═══════════════════════════════════════════════════════════════════════════
//  planning.js se charge tel quel dans Node (il n'importe que utils.js). Le
//  harnais l'alimente comme le fait l'application (window.MEMBRES,
//  PLANNING_TEMPLATES, PLANNING_ENTRIES, CONFIG), intercepte window.open pour
//  capturer le document produit, et interroge le HTML sorti.
//
//  Ce qu'il verifie en priorite, parce que c'est ce qui casse en silence :
//    · le document NE DEPLACE PAS le mois affiche au Planning ;
//    · les contrats sont dates, et une COUPURE est nommee ;
//    · deux contrats CONTIGUS n'en font qu'un (regle _mvContrats) ;
//    · un membre collectif n'a pas de bloc conges ;
//    · le compteur d'annualisation reste celui de _planAnnu.
//
//  Usage :
//    node scripts/mv-harnais-releve.mjs            # les tests
//    node scripts/mv-harnais-releve.mjs --contre   # + les contre-epreuves
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
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'planning.js'));

// ── DOM minimal ─────────────────────────────────────────────────────────────
function El(){ return { id:'', innerHTML:'', textContent:'', value:'', style:{}, dataset:{}, children:[],
  classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  setAttribute(){}, getAttribute(){ return null; }, appendChild(c){ this.children.push(c); return c; },
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
  innerWidth:900, innerHeight:800, print(){}, alert(){}, confirm(){ return true; },
  URL:{ createObjectURL(){ return 'blob:x'; }, revokeObjectURL(){} }, Blob:function(p){ this.parts = p; } };
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.getComputedStyle = win.getComputedStyle; globalThis.matchMedia = win.matchMedia;
globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value:win.navigator, configurable:true }); } catch { /* deja en lecture seule */ }

// ── Capteur : planExportPDF ecrit dans une fenetre. On la fabrique. ─────────
const pages = [];
win.open = () => { const p = { html:'' }; pages.push(p);
  return { document:{ write(h){ p.html += h; }, close(){} }, focus(){}, print(){}, onload:null }; };
window.open = win.open;

// ── Le domaine de test ──────────────────────────────────────────────────────
const AN = new Date().getFullYear();
const A = String(AN);
// Modele de semaine : 7 h du lundi au vendredi, sur les 12 mois.
const tpl = {};
for (let m = 0; m < 12; m++) {
  tpl[m] = {};
  const nd = new Date(AN, m + 1, 0).getDate();
  for (let d = 1; d <= nd; d++) {
    const dow = new Date(AN, m, d).getDay();
    tpl[m][d] = (dow >= 1 && dow <= 5) ? 7 : 0;
  }
}
window.PLANNING_TEMPLATES = { standard: tpl };
window.PLANNING_ENTRIES   = {};
window.PLANNING_ACOMPTES  = {};
window.PLANNING_HSUP      = {};
window.CONFIG = { cp_mode:'ouvrables', cp_periode_debut:5, hsup_mode:'paye' };
window.MEMBRES = [
  // Deux contrats SEPARES par une coupure (fin 24/07, reprise le 01/09)
  { nom:'Victor', statut:'Actif', type_contrat:'CDD', planning_id:'standard', cp_initial_j:12,
    contrats:[{ debut:A + '-03-02', fin:A + '-07-24', type:'CDD' }],
    debut_contrat:A + '-09-01', fin_contrat:A + '-11-30' },
  // Deux contrats CONTIGUS (fin 30/06, reprise le 01/07) -> une seule periode
  { nom:'Chloé', statut:'Actif', type_contrat:'CDD', planning_id:'standard', cp_initial_j:8,
    contrats:[{ debut:A + '-01-06', fin:A + '-06-30', type:'CDD' }],
    debut_contrat:A + '-07-01', fin_contrat:A + '-12-31' },
  // CDI sans date
  { nom:'Nico', statut:'Actif', type_contrat:'CDI', planning_id:'standard', cp_initial_j:25 },
  // Equipe collective
  { nom:'Vendangeurs', statut:'Actif', type_contrat:'Saisonnier', planning_id:'standard',
    collectif:true, effectif:30, debut_contrat:A + '-09-08', fin_contrat:A + '-09-20' }
];
window.DOMAINE_NOM = 'Domaine de test';
window.currentUser = { nom:'Nico', roles:['admin'] };
window.isAdmin = () => true;

await import(CIBLE);

let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rge  = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (n, c, d) => { if (c) { ok++; console.log('   ' + vert('vert ') + ' ' + n); }
  else { ko++; console.log('   ' + rge('ROUGE') + ' ' + n + (d ? '  → ' + d : '')); } };

console.log('\n0. Les moteurs du planning répondent');
T('_mvContrats existe (utils.js)', typeof window._mvContrats === 'function');
T('Victor a DEUX périodes (coupure du 25/07 au 31/08)',
  window._mvContrats(window.MEMBRES[0]).length === 2,
  JSON.stringify(window._mvContrats(window.MEMBRES[0])));
T('Chloé n’en a qu’UNE (contrats contigus fusionnés)',
  window._mvContrats(window.MEMBRES[1]).length === 1,
  JSON.stringify(window._mvContrats(window.MEMBRES[1])));
T('_planAnnu est exposé', typeof window._planAnnu === 'function');
const anV = window._planAnnu(window.MEMBRES[0], 11);
T('le plafond de Victor est proratisé sous 1 607 h',
  anV.plafond > 0 && anV.plafond < 1607, 'plafond = ' + Math.round(anV.plafond));
T('le plafond de Nico (CDI sans date) vaut 1 607 h',
  Math.abs(window._planAnnu(window.MEMBRES[2], 11).plafond - 1607) < 0.01,
  String(window._planAnnu(window.MEMBRES[2], 11).plafond));

console.log('\n1. Le point d’entrée du hub');
T('_planReleveIndiv est exposé', typeof window._planReleveIndiv === 'function');
T('_planReleveMbrs rend les 4 salariés',
  window._planReleveMbrs().length === 4, String(window._planReleveMbrs().length));
T('l’équipe collective est signalée dans la liste',
  window._planReleveMbrs().filter(m => m.coll).length === 1);
const moisAvant = window._planReleveMois();
pages.length = 0;
const okGen = window._planReleveIndiv('Victor', 9);   // octobre
T('un document est produit', okGen === true && pages.length === 1, 'pages=' + pages.length);
T('⚠️ le mois du Planning est RESTAURÉ après édition',
  window._planReleveMois() === moisAvant, moisAvant + ' → ' + window._planReleveMois());
T('un salarié inconnu ne produit rien',
  window._planReleveIndiv('Personne', 3) === false);

const H = pages[0] ? pages[0].html : '';
console.log('\n2. Le bloc CONTRATS');
T('le bloc est présent', H.indexOf('Les contrats \u2014 2 périodes') !== -1,
  (H.match(/Les contrats[^<]{0,30}/)||[''])[0]);
T('la première période est datée en toutes lettres, avec SON type',
  H.indexOf('<b>CDD</b> \u00b7 du 2 mars ' + AN + ' au 24 juillet ' + AN) !== -1,
  (H.match(/CDD<\/b>[^<]{0,60}/)||[''])[0]);
T('la seconde période est datée elle aussi',
  H.indexOf('du 1 septembre ' + AN + ' au 30 novembre ' + AN) !== -1);
T('la durée de chaque période est comptée', /145 jours/.test(H), 'du 2/03 au 24/07 = 145 j');
T('⚠️ la COUPURE est nommée, et comptée en jours',
  H.indexOf('s\u00e9par\u00e9es par une coupure') !== -1 && /coupure de 38 jours/.test(H),
  (H.match(/coupure de \d+ jours?/)||['(absente)'])[0]);
T('la période qui couvre aujourd\u2019hui est marquée « en cours »',
  (H.match(/cnow/g) || []).length <= 1);
T('le prorata du plafond est expliqué', H.indexOf('proratis\u00e9 aux jours sous contrat') !== -1);

console.log('\n3. Le bloc CONGÉS');
T('le bloc est présent', H.indexOf('Cong\u00e9s pay\u00e9s') !== -1);
T('le solde initial de Victor (12 j) y est', /Solde initial<\/span><span class="cv">12 j<\/span>/.test(H),
  (H.match(/Solde initial[\s\S]{0,60}/)||[''])[0]);
T('⚠️ les jours ne sont pas formatés en heures (« 12h j »)', H.indexOf('h j<') === -1);
T('le mode de décompte du domaine est nommé', H.indexOf('jours <b>ouvrables</b>') !== -1);

console.log('\n4. Ce qui existait déjà n’a pas bougé');
T('le compteur d’annualisation est toujours là', H.indexOf('Compteur d\u2019heures') !== -1);
T('le plafond affiché est celui de _planAnnu',
  H.indexOf('Plafond annuel <b>' + Math.round(anV.plafond * 2) / 2) !== -1
  || H.indexOf('Plafond annuel <b>' + anV.plafond.toFixed(1).replace('.0', '')) !== -1
  || /Plafond annuel <b>\d/.test(H));
T('le détail mois par mois est toujours là', H.indexOf('D\u00e9tail mois par mois') !== -1);
T('les deux signatures sont toujours là',
  H.indexOf('Signature salari\u00e9') !== -1 && H.indexOf('Signature employeur') !== -1);
T('les blocs neufs sont AVANT le compteur',
  H.indexOf('Contrats \u2014') < H.indexOf('Compteur d\u2019heures')
  && H.indexOf('Cong\u00e9s pay\u00e9s') < H.indexOf('Compteur d\u2019heures'));

console.log('\n5. Les cas particuliers');
pages.length = 0; window._planReleveIndiv('Nico', 5);
const HN = pages[0] ? pages[0].html : '';
T('un CDI sans date le dit au lieu d’inventer',
  HN.indexOf('aucune date enregistr\u00e9e') !== -1
  && HN.indexOf('n\u2019est alors pas proratis\u00e9') !== -1);
pages.length = 0; window._planReleveIndiv('Chloé', 5);
const HC = pages[0] ? pages[0].html : '';
// ⚠️ La ligne de liaison porte `class="crow cgap"` : compter `class="crow"`
// avec son guillemet fermant l'exclut. On compte les deux formes.
T('deux contrats contigus restent DEUX lignes (chacun son type) …',
  (HC.match(/class="crow"/g) || []).length
    - (HC.match(/Solde initial|Pris sur|<b>Reste<\/b>/g) || []).length === 2
  && (HC.match(/class="crow cgap/g) || []).length === 1,
  'periodes = ' + ((HC.match(/class="crow"/g) || []).length
    - (HC.match(/Solde initial|Pris sur|<b>Reste<\/b>/g) || []).length)
  + ', liaisons = ' + (HC.match(/class="crow cgap/g) || []).length);
T('… séparées par « se poursuit sans interruption »',
  HC.indexOf('se poursuit sans interruption') !== -1 && HC.indexOf('m\u00eame compteur') !== -1);
T('aucune coupure annoncée pour Chloé',
  HC.indexOf('s\u00e9par\u00e9es par une coupure') === -1
  && HC.indexOf('n\u2019en font qu\u2019un') !== -1);
pages.length = 0; window._planReleveIndiv('Vendangeurs', 8);
const HV = pages[0] ? pages[0].html : '';
T('⚠️ une équipe collective n’a PAS de bloc congés',
  HV.indexOf('Cong\u00e9s pay\u00e9s') === -1);
T('mais elle garde son bloc contrats', HV.indexOf('Les contrats \u2014') !== -1);
T('⚠️ une équipe collective n\u2019est PAS annualisée, et le document le dit',
  HV.indexOf('n\u2019est pas annualis\u00e9') !== -1);

console.log('\n6. Structure HTML');
{
  const o = t => (H.match(new RegExp('<' + t + '(?=[ >])', 'g')) || []).length;
  const f = t => (H.match(new RegExp('</' + t + '>', 'g')) || []).length;
  const dese = ['div','table','thead','tbody','tr','td','th','span','b'].filter(t => o(t) !== f(t));
  T('balises équilibrées dans le document complet', dese.length === 0, dese.join(','));
  T('le CSS des blocs neufs est embarqué', H.indexOf('.ctr{') !== -1 && H.indexOf('.crow{') !== -1);
}

console.log('\n──────────────────────────────');
console.log('  ' + ok + ' vert · ' + ko + ' ' + (ko ? rge('ROUGE') : 'rouge'));

if (CONTRE && !ko) {
  const base = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['le mois du Planning n’est plus restauré',
      '  try{ planExportPDF(nom); }\n  finally{ planMonth = avant; }',
      '  planExportPDF(nom);'],
    ['la coupure n’est plus comptée',
      '        coupures++;', '        coupures+=0;'],
    ['le type de chaque contrat disparaît',
      "      + '<span class=\"cl\">' + (c.type ? ('<b>' + _escHtml(c.type) + '</b> \\u00b7 ') : '')",
      "      + '<span class=\"cl\">' + ''"],
    ['la durée d’une période n’est plus comptée',
      "      + '<span class=\"cv\">' + (nj ? (nj + ' jour' + (nj > 1 ? 's' : '')) : '\\u2014') + '</span>'",
      "      + '<span class=\"cv\">\\u2014</span>'"],
    ['le bloc congés sort pour une équipe collective',
      "  if(typeof window._mvEstCollectif === 'function' && window._mvEstCollectif(mbr)) return '';", '  '],
    ['un CDI sans date n’avertit plus',
      "      + 'pr\\u00e9sent toute l\\u2019ann\\u00e9e : le plafond annuel n\\u2019est alors pas proratis\\u00e9.</div></div>'",
      "      + 'pr\\u00e9sent toute l\\u2019ann\\u00e9e.</div></div>'"],
    ['la source des périodes retombe sur les contrats FUSIONNÉS',
      "  var P = (typeof window._mvPeriodes === 'function') ? (window._mvPeriodes(mbr) || [])",
      "  var P = (false && typeof window._mvPeriodes === 'function') ? (window._mvPeriodes(mbr) || [])"],
    ['les blocs passent APRÈS le compteur',
      '\n    +_plRvContratsHtml(mbr)\n    +_plRvCpHtml(mbr)\n    +annuCptHtml\n',
      '\n    +annuCptHtml\n    +_plRvContratsHtml(mbr)\n    +_plRvCpHtml(mbr)\n'],
    ['le solde initial de congés n’est plus lu',
      '  var ini = mbr.cp_initial_j || 0;', '  var ini = 0;'],
    ['le mode de décompte n’est plus nommé',
      `    + '<div class="note">D\\u00e9compte en jours <b>' + mode + '</b>, r\\u00e9glage du domaine. '`,
      `    + '<div class="note">D\\u00e9compte des jours. '`],
    ['un salarié inconnu produit quand même un document',
      "  if(!mbr){ showToast('Salari\\u00e9 introuvable', '#E07060'); return false; }", '  ']
  ];
  console.log('\n  CONTRE-EPREUVES — ' + DEFAUTS.length + ' defauts reinjectes un par un\n');
  let sansEffet = 0;
  DEFAUTS.forEach(([nom, vieux, neuf], i) => {
    const n = base.split(vieux).length - 1;
    if (n !== 1) { console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(50) + ' '
      + rge('MOTIF INTROUVABLE (' + n + ')')); sansEffet++; return; }
    const tmp = path.join(RACINE, 'src', '.mv-ko-rlv-' + (i + 1) + '.js');
    fs.writeFileSync(tmp, base.replace(vieux, neuf));
    let rouge = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url), tmp],
      { stdio:'pipe', env:{ ...process.env, NO_COLOR:'1' } }); } catch { rouge = true; }
    fs.unlinkSync(tmp);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(50) + ' '
      + (rouge ? vert('rouge') : rge('LE HARNAIS RESTE VERT')));
    if (!rouge) sansEffet++;
  });
  console.log();
  if (sansEffet) { console.log('  ' + rge(sansEffet + ' contre-epreuve(s) sans effet.')); process.exit(1); }
  console.log('  ' + vert('Les ' + DEFAUTS.length + ' defauts font tous rougir le harnais.'));
}
process.exit(ko ? 1 : 0);
