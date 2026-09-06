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
import { fileURLToPath, pathToFileURL } from 'node:url';
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
const win = { document:doc, location:{ hostname:'test', href:'https://test/', origin:'https://test', search:'', pathname:'/' },
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

/* ⚠️⚠️⚠️ WINDOWS. `import()` attend une URL, pas un chemin : sous Windows,
   path.resolve() rend « C:\… » et Node lit « c: » comme un SCHÉMA d'URL —
   ERR_UNSUPPORTED_ESM_URL_SCHEME, et le harnais plante avant sa première
   assertion. Le bac à sable est Linux, la machine de Nico est Windows : aucun
   essai côté Claude ne peut attraper ça. C'est la TROISIÈME fois (§53).
   pathToFileURL() est la seule forme correcte des deux côtés. */
await import(pathToFileURL(CIBLE).href);

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
// ⚠️ « du 1 septembre » : cette attente portait la faute. Le premier du mois est
//    un ordinal, et l'assertion la figeait sur un document signé.
T('la seconde période est datée elle aussi, au 1ER',
  H.indexOf('du 1er septembre ' + AN + ' au 30 novembre ' + AN) !== -1,
  (H.match(/du 1[^<]{0,24}septembre/) || ['(absent)'])[0]);
T('la durée de chaque période est comptée', /145 jours/.test(H), 'du 2/03 au 24/07 = 145 j');
T('⚠️ la COUPURE est nommée, et comptée en jours',
  H.indexOf('s\u00e9par\u00e9es par une coupure') !== -1 && /coupure de 38 jours/.test(H),
  (H.match(/coupure de \d+ jours?/)||['(absente)'])[0]);
// ★★ ASSERTION CORRIGEE LE 02/09 — ELLE COMPTAIT LA MAUVAISE CHOSE.
//    « /cnow/g <= 1 » comptait la chaine sur TOUT le document, feuille de style
//    comprise : la regle « .cnow{...} » fait deja 1 a elle seule. Le plafond de 1
//    voulait donc dire « AUCUN badge rendu » — vrai onze mois sur douze, faux des
//    qu'une periode du scenario couvre la date du jour. Le harnais est passe au
//    ROUGE tout seul le 1er septembre 2026, sans qu'aucune ligne de code ne bouge,
//    et il BLOQUAIT `npm run build` (prebuild joue la meme chaine).
//    ⚠️ Verifie rouge sur la base d'origine avant correction : ce n'etait pas un lot.
//    On compte desormais les BADGES, pas les occurrences du mot. Le plafond reste 1 :
//    selon la date, zero ou une periode du scenario couvre aujourd'hui, jamais deux.
T('la période qui couvre aujourd\u2019hui est marquée « en cours »',
  (H.match(/<b class="cnow">/g) || []).length <= 1,
  (H.match(/<b class="cnow">/g) || []).length + ' badge(s) rendu(s)');
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


/* ═══════════════════════════════════════════════════════════════════════════
   7. LA FEUILLE IMPRIMÉE — typographie, polices, pied de page
   Aucun preflight ne lit une mise en page (§42). Ce qui suit est donc ce qu'on
   PEUT tenir par mesure : les tailles, les graisses, les marges, la présence
   d'un endroit où signer. Le reste se regarde à l'œil, sur une vraie impression.
   ══════════════════════════════════════════════════════════════════════════ */

/* Un modèle avec FERMETURE D'ÉTÉ : août n'ouvre qu'au 24. Clés par DATE, comme
   PLAN_DEF — donc aucune dépendance au jour de la semaine, et le verdict est le
   même quelle que soit l'année où le harnais tourne. */
const tplF = {};
for (let m = 0; m < 12; m++) {
  tplF[m] = {};
  const nd = new Date(AN, m + 1, 0).getDate();
  for (let d = 1; d <= nd; d++) {
    const dow = new Date(AN, m, d).getDay();
    tplF[m][d] = (dow >= 1 && dow <= 5) ? 7 : 0;
  }
}
tplF[7] = { 24:8.5, 25:8.5, 26:8.5, 27:8.5, 28:5, 31:8.5 };
window.PLANNING_TEMPLATES.ferme = tplF;

const T7 = { debut:'07:00', fin:'16:30', continu:false };   // 8h30
const T5 = { debut:'07:00', fin:'12:00', continu:false };   // 5h

/* Victor2 = la feuille d'août 2026 de Victor, reconstituée. CDI ouvert le 17
   pendant la fermeture ; la semaine 17→21 est travaillée EN REMPLACEMENT ;
   le 19 en retard (arrivée 07:30) ; le 20 absent sans justification. */
window.MEMBRES.push({
  nom:'Victor2', statut:'Actif', type_contrat:'CDI', planning_id:'ferme', cp_initial_j:0,
  contrats:[{ debut:A + '-01-02', fin:A + '-06-30', type:'CDD' }],
  debut_contrat:A + '-08-17'
});
window.PLANNING_ENTRIES['Victor2'] = { [AN]: { 7: {
  17:{ timing:T7, remplacement:true },
  18:{ timing:T7, remplacement:true },
  19:{ absent:true, motif:'retard', motif_t:'07:30', motif_h:0.5, timing:T7, remplacement:true },
  20:{ absent:true, motif:'injustifie', timing:T7, remplacement:true },
  21:{ timing:T5, remplacement:true }
} } };

pages.length = 0;
window._planReleveIndiv('Victor2', 7);
const HL = pages[0] ? pages[0].html : '';

const nb = (re, h) => (h.match(re) || []).length;

T('un document est produit pour le contrat de mi-mois', HL.length > 2000);

/* 7a. Les deux colonnes de jours */
{
  const tb = [...HL.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].map(m => nb(/<tr/g, m[1]));
  T('⚠️ la colonne de gauche n’est plus vide (contrat ouvert le 17)',
    tb[0] > 0, 'colonne 1 = ' + tb[0] + ' ligne(s)');
  T('⚠️ les deux colonnes sont équilibrées à une ligne près',
    tb.length >= 2 && Math.abs(tb[0] - tb[1]) <= 1, 'colonnes = ' + tb[0] + ' / ' + tb[1]);
}

/* 7b. Polices et tailles */
T('aucune graisse 800 (Outfit ne monte qu’à 700)', HL.indexOf('font-weight:800') === -1);
T('plus de monospace du navigateur sur les horaires', HL.indexOf('monospace') === -1);
{
  const tailles = [...HL.matchAll(/font-size:([\d.]+)px/g)].map(m => parseFloat(m[1]));
  T('⚠️ plancher de police à 8,5 px', tailles.length > 0 && Math.min(...tailles) >= 8.5,
    'plus petite = ' + Math.min(...tailles) + 'px');
}
T('⚠️ une base absolue est posée pour /fonts (iOS, about:blank)',
  /<base href="https?:\/\/[^"]+">/.test(HL), (HL.match(/<base[^>]*>/) || ['(absente)'])[0]);
T('⚠️ on attend le chargement de la police avant d’imprimer',
  HL.indexOf('document.fonts') !== -1);

/* 7c. Le pied de page */
T('⚠️ @page sans marge : plus de « about:blank » imprimé par le navigateur',
  HL.indexOf('@page{size:A4;margin:0}') !== -1 && HL.indexOf('margin:10mm') === -1);
T('⚠️ il y a un endroit où signer (deux cadres)', nb(/class="sb"/g, HL) === 2);
T('les deux libellés de signature sont conservés',
  HL.indexOf('Signature salari\u00e9') !== -1 && HL.indexOf('Signature employeur') !== -1);
T('la date d’édition est portée par le document', /\u00e9dit\u00e9 le \d\d\/\d\d\/\d{4}/.test(HL));
T('le document se nomme lui-même en pied (2 pages sans en-tête navigateur)',
  HL.indexOf('<div class="credit"><span>Victor2 \u00b7 Ao\u00fbt') !== -1);

/* 7d. Typographie */
T('⚠️ ni « Jun » ni « Jul » : les mois sont abrégés en français',
  !/\bJun\b|\bJul\b/.test(HL));
T('la période des congés est datée en français', H.indexOf('Juin ' + AN) !== -1,
  (H.match(/Cong\u00e9s pay\u00e9s[^<]{0,40}/) || [''])[0]);
T('⚠️ « ETP 1.12 » a disparu (point décimal + terme faux)',
  HL.indexOf('ETP ') === -1 && /R\u00e9alisation \d+/.test(HL),
  (HL.match(/class="etp">[^<]*/) || ['(absent)'])[0]);
T('le même total d’heures n’est plus écrit deux fois',
  HL.indexOf('dont au<br>domaine') === -1);
T('la référence annonce sur combien de jours elle porte',
  /R\u00e9f\u00e9rence <b>[^<]+<\/b> \u00b7 \d+ jours? pr\u00e9vus?/.test(HL),
  (HL.match(/R\u00e9f\u00e9rence[^\u00b7]*\u00b7[^<]*/) || [''])[0]);
T('plus d’émoji dans les titres de section',
  ['\u23f1', '\ud83d\udcc5', '\ud83d\udcc4', '\ud83c\udf34', '\ud83d\udcb6']
    .every(e => HL.indexOf(e) === -1));
T('… mais le raisin de l’en-tête reste', HL.indexOf('\ud83c\udf47') !== -1);
T('⚠️ un retard n’est plus peint en rouge sang',
  HL.indexOf('#fff7ed') !== -1, 'orange du retard absent du document');

/* 7e. Le tableau d’année s’arrête aux bornes du contrat */
T('⚠️ plus de « Janvier 0h » sur un contrat ouvert en août',
  !/<td[^>]*>Janvier<\/td>/.test(HL));
T('… et août, lui, y est bien', /<td[^>]*>Ao\u00fbt<\/td>/.test(HL));
T('… et le document dit pourquoi le compteur commence là',
  HL.indexOf('s\u2019ouvre le 17/08/' + AN) !== -1);
T('un contrat couvrant toute l’année garde ses douze mois',
  /<td[^>]*>Janvier<\/td>/.test(HN), 'HN = Nico, CDI sans date, juin');

/* ═══════════════════════════════════════════════════════════════════════════
   8. LE JOUR DE REMPLACEMENT — la règle métier
   ★★★ « Les remplacements comptent comme les heures normales, c'est-à-dire comme
       si le planning était déjà prévu comme ça, puisque ça ira en remplacement
       d'un autre moment. » (Nico, 23/08/2026 — et ce n'est pas la première fois.)
   Conséquence directe et non négociable : sur un jour d'échange, une absence ou
   un retard CREUSENT l'écart. La feuille d'août de Victor doit être NÉGATIVE.
   ══════════════════════════════════════════════════════════════════════════ */

const tuile = (h, l) => {
  const m = h.match(new RegExp('<div class="n"[^>]*>([^<]+)</div><div class="l">' + l));
  return m ? m[1] : '(introuvable)';
};

T('les heures faites du mois : 77h30', HL.indexOf('<div class="big">77h30</div>') !== -1,
  (HL.match(/class="big">[^<]*/) || [''])[0]);
/* ★★★ DEUX RÉFÉRENCES, DEUX QUESTIONS. Ce qui est AFFICHÉ est le planning brut :
   47,5 (modèle) + 39 (la semaine d'échange, en entier) = 86 h 30 attendues, 77 h 30
   faites, donc −9 h. La référence NETTE (77 h 30, absences neutralisées) ne sert qu'au
   COMPTEUR, pour qu'une absence déjà portée aux « heures dues » ne soit pas retranchée
   une seconde fois des heures supplémentaires.
   ⚠️ Avant le 23/08, seule la nette existait et c'est elle qu'on affichait : la feuille
   sortait « écart = » sur un mois où il manquait 9 h. Le document affirmait le contraire
   de ce qu'il montrait trois lignes plus bas. */
T('★★ la référence AFFICHÉE est le planning brut : 86h30',
  HL.indexOf('R\u00e9f\u00e9rence <b>86h30</b>') !== -1,
  (HL.match(/R\u00e9f\u00e9rence <b>[^<]*/) || [''])[0]);
T('★★ … sur 11 jours prévus — les 5 jours d’échange en font partie',
  /R\u00e9f\u00e9rence <b>86h30<\/b> \u00b7 11 jours pr\u00e9vus/.test(HL),
  (HL.match(/R\u00e9f\u00e9rence[^<]*<b>[^<]*<\/b>[^<]*/) || [''])[0]);
T('★ le retard compte comme jour travaillé : 10 jours, pas 9',
  tuile(HL, 'jours?<br>au domaine') === '10', 'jours = ' + tuile(HL, 'jours?<br>au domaine'));
T('★★★ les 8h30 de l’absence injustifiée SONT dues, pas seulement le retard',
  /Heures dues/.test(HL) && HL.indexOf('\u22129h') !== -1,
  (HL.match(/heures dues <b>[^<]*/) || ['(colonne absente)'])[0]);
T('★★★ … et elles descendent le compteur : reste à prendre \u22129h',
  /reste \u00e0 prendre <b>\u22129h<\/b>/.test(HL),
  (HL.match(/reste \u00e0 prendre <b>[^<]*/) || [''])[0]);
T('★ la ligne « Ce mois » explique le \u22129h au lieu de le laisser tomber du ciel',
  /Ce mois[^<]*heures suppl[\s\S]{0,200}heures dues <b>\u22129h<\/b>/.test(HL));
T('la note nomme LES DEUX motifs, puisque les deux comptent',
  HL.indexOf('heures dues (absence injustifi\u00e9e ou retard)') !== -1);
T('le signe moins est typographique (\u2212), pas un trait d’union',
  HL.indexOf('-9h<') === -1 && HL.indexOf('\u22129h') !== -1);
T('★★★ l’écart au prévu vaut \u22129h — il compte l’absence ET le retard',
  tuile(HL, '\u00e9cart au') === '\u22129h', 'écart = ' + tuile(HL, '\u00e9cart au'));
T('★ l’écart et les heures dues disent LE MÊME chiffre',
  tuile(HL, '\u00e9cart au') === '\u22129h' && /heures dues <b>\u22129h<\/b>/.test(HL));
T('la réalisation suit la référence brute (90 %, pas 100 %)',
  /R\u00e9alisation 90/.test(HL), (HL.match(/class="etp">[^<]*/) || [''])[0]);

/* 8a bis. ⚠️⚠️ LE CAS POUR LEQUEL LA NEUTRALISATION EXISTE — un mois qui porte À LA FOIS
   des heures supplémentaires ET une absence. Il ne doit PAS être pénalisé deux fois :
   l'absence est déjà au débit des « heures dues », elle ne doit pas en plus rogner les
   heures sup. C'est ce que la référence NETTE protège, et c'est pour ça qu'on la garde
   même si on ne l'affiche plus. */
window.MEMBRES.push({
  nom:'Victor5', statut:'Actif', type_contrat:'CDI', planning_id:'ferme', cp_initial_j:0,
  contrats:[{ debut:A + '-01-02', fin:A + '-06-30', type:'CDD' }],
  debut_contrat:A + '-08-17'
});
window.PLANNING_ENTRIES['Victor5'] = { [AN]: { 7: {
  17:{ timing:T7, remplacement:true },
  18:{ timing:T7, remplacement:true },
  19:{ absent:true, motif:'retard', motif_t:'07:30', motif_h:0.5, timing:T7, remplacement:true },
  20:{ absent:true, motif:'injustifie', timing:T7, remplacement:true },
  21:{ timing:T5, remplacement:true },
  22:{ timing:T7 }, 29:{ timing:T7 }          // deux samedis travaillés : heures sup
} } };
pages.length = 0;
window._planReleveIndiv('Victor5', 7);
const HP = pages[0] ? pages[0].html : '';
T('mois à écart POSITIF : 94h30 faites pour 86h30 prévues',
  HP.indexOf('<div class="big">94h30</div>') !== -1
  && HP.indexOf('R\u00e9f\u00e9rence <b>86h30</b>') !== -1,
  (HP.match(/class="big">[^<]*/) || [''])[0]);
T('★ l’écart affiché est +8h', tuile(HP, '\u00e9cart au') === '+8h',
  'écart = ' + tuile(HP, '\u00e9cart au'));
T('★★ heures sup 17h — l’absence n’en a PAS rogné 9 de plus',
  /heures suppl\u00e9mentaires <b>17h<\/b>/.test(HP),
  (HP.match(/heures suppl\u00e9mentaires <b>[^<]*/) || [''])[0]);
T('★★★ pas de double peine : 17h \u2212 9h = +8h de reste à prendre',
  /reste \u00e0 prendre <b>\+8h<\/b>/.test(HP),
  (HP.match(/reste \u00e0 prendre <b>[^<]*/) || [''])[0]);
T('★ et l’écart affiché ÉGALE le reste à prendre',
  tuile(HP, '\u00e9cart au') === '+8h' && /reste \u00e0 prendre <b>\+8h<\/b>/.test(HP));

/* 8b. LA PREUVE DÉTRUITE — ce que l'enregistrement effaçait avant ce lot.
   Victor3 porte EXACTEMENT les entrées telles qu'elles sont enregistrées
   aujourd'hui chez le domaine de référence : le 19 a gardé son horaire (le retard le
   préservait déjà), le 20 n'a plus rien. Aucun calcul ne peut les rattraper —
   c'est pour ça que ces deux jours doivent être reposés à la main. */
window.MEMBRES.push({
  nom:'Victor3', statut:'Actif', type_contrat:'CDI', planning_id:'ferme', cp_initial_j:0,
  contrats:[{ debut:A + '-01-02', fin:A + '-06-30', type:'CDD' }],
  debut_contrat:A + '-08-17'
});
window.PLANNING_ENTRIES['Victor3'] = { [AN]: { 7: {
  17:{ timing:T7, remplacement:true },
  18:{ timing:T7, remplacement:true },
  19:{ absent:true, motif:'retard', motif_t:'07:30', motif_h:0.5, timing:T7 },
  20:{ absent:true, motif:'injustifie' },
  21:{ timing:T5, remplacement:true }
} } };
pages.length = 0;
window._planReleveIndiv('Victor3', 7);
const HD = pages[0] ? pages[0].html : '';
T('drapeaux perdus : la référence retombe à 69h30',
  HD.indexOf('R\u00e9f\u00e9rence <b>69h30</b>') !== -1,
  (HD.match(/R\u00e9f\u00e9rence <b>[^<]*/) || [''])[0]);
T('⚠️ … et l’écart redevient positif — il FAUT reposer les deux jours',
  tuile(HD, '\u00e9cart au') === '+8h', 'écart = ' + tuile(HD, '\u00e9cart au'));
T('⚠️⚠️ drapeaux perdus : l’absence du 20 ne doit RIEN — sa référence a disparu',
  HD.indexOf('\u22129h') === -1 && HD.indexOf('\u22120h30') !== -1,
  'seul le retard reste dû, ce qui est la preuve que la donnée est perdue');
T('★ mais la référence ne descend plus SOUS ZÉRO (+8h et non +8h30)',
  tuile(HD, '\u00e9cart au') !== '+8h30');
T('le retard y compte quand même comme jour travaillé',
  tuile(HD, 'jours?<br>au domaine') === '10');
/* ⚠️ CETTE ASSERTION EXISTE POUR TENIR LA BORNE de _planAbsLostH, et rien d'autre.
   Le 19 est ici un JOUR SUPPLÉMENTAIRE (drapeau perdu) : il ne pèse rien dans la
   référence, donc ses 8 h faites sont de l'extra pur (+8 h d'écart) et le retard lui
   coûte ses 30 min → +7 h 30 au compteur. Sans la borne, la neutralisation retirerait
   0 h 30 d'une référence où ce jour n'a rien mis : les heures sup passeraient à 8 h 30
   pour 8 h faites, et le retard ne coûterait plus rien (+8 h). L'écart affiché, lui, ne
   bouge pas — c'est pourquoi seule CETTE ligne fait rougir la contre-épreuve nº14. */
T('★ borne de neutralisation : reste à prendre +7h30, pas +8h',
  /reste \u00e0 prendre <b>\+7h30<\/b>/.test(HD),
  (HD.match(/reste \u00e0 prendre <b>[^<]*/) || [''])[0]);

/* 8c. Le moteur, interrogé directement */
T('_planRefPart est exposé', typeof window._planRefPart === 'function');
T('un jour d’échange pèse son horaire',
  window._planRefPart('ferme', 7, 17, { timing:T7, remplacement:true }) === 8.5);
T('un jour supplémentaire ne pèse rien',
  window._planRefPart('ferme', 7, 17, { timing:T7 }) === 0);
T('un jour au modèle pèse le modèle',
  window._planRefPart('ferme', 7, 24, null) === 8.5);
T('une récup ne pèse rien', window._planRefPart('ferme', 7, 24, { type:'recup' }) === 0);
/* 8d. LA CAUSE RACINE, empruntée par son VRAI chemin : _planApplyAbs.
   ⚠️ Les fixtures ci-dessus écrivent PLANNING_ENTRIES à la main — elles ne
   traversent donc jamais l'enregistrement, et une contre-épreuve posée sur lui
   restait verte. Un harnais qui ne passe pas par la fonction qu'il prétend
   couvrir ne prouve rien : on l'appelle. */
{
  const MP = window._planReleveMois();     // le mois que le module tient réellement
  window.MEMBRES.push({ nom:'Victor4', statut:'Actif', type_contrat:'CDI',
    planning_id:'ferme', debut_contrat:A + '-01-01' });
  let jS = 0;
  for (let d = 1; d <= new Date(AN, MP + 1, 0).getDate(); d++) {
    if ((tplF[MP][d] || 0) === 0) { jS = d; break; }
  }
  T('un jour à 0 h a été trouvé dans le mois courant', jS > 0, 'mois ' + MP);
  window.PLANNING_ENTRIES['Victor4'] = { [AN]: { [MP]: { [jS]: { timing:T7, remplacement:true } } } };
  window._planApplyAbs(['Victor4|' + jS], 'injustifie', '', null, null);
  const eV4 = window.PLANNING_ENTRIES['Victor4'][AN][MP][jS] || {};
  T('★★★ poser une absence sur un jour d’échange ne détruit plus le drapeau',
    !!eV4.remplacement, JSON.stringify(eV4));
  T('★★★ … ni l’horaire, seule trace de ce qui était attendu',
    !!(eV4.timing && eV4.timing.debut === '07:00'), JSON.stringify(eV4));
  T('l’absence reste bien une absence', !!eV4.absent && eV4.motif === 'injustifie');
  // Non-régression : un jour SUPPLÉMENTAIRE (sans échange) est toujours effacé.
  window.PLANNING_ENTRIES['Victor4'][AN][MP][jS] = { timing:T7 };
  window._planApplyAbs(['Victor4|' + jS], 'injustifie', '', null, null);
  const eV5 = window.PLANNING_ENTRIES['Victor4'][AN][MP][jS] || {};
  T('⚠️ un jour supplémentaire, lui, perd bien son horaire',
    eV5.timing === undefined && !eV5.remplacement, JSON.stringify(eV5));
}

T('★ _planRempH mesure l’ATTENDU par défaut, le FAIT sur demande',
  Math.abs(window._planRempH(window.MEMBRES.find(m => m.nom === 'Victor2'), 7)
         - window._planRempH(window.MEMBRES.find(m => m.nom === 'Victor2'), 7, true)) > 0.4,
  'attendu et fait donnent le même chiffre');

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
      "  if(!mbr){ showToast('Salari\\u00e9 introuvable', '#E07060'); return false; }", '  '],
    // ── Lot du 23/08/2026 ──────────────────────────────────────────────────
    ['★ la référence d’un jour d’échange redevient le FAIT',
      '    h+=fait?_planDayH(plId,m,d,e):_planRefH(plId,m,d,e);',
      '    h+=_planDayH(plId,m,d,e);'],
    ['★ l’enregistrement d’une absence reperd le drapeau d’échange',
      '    if(_remp)e.remplacement=true;', '    if(false)e.remplacement=true;'],
    ['★ la neutralisation n’est plus bornée (référence négative)',
      '    h+=duesOnly?_perdu:Math.min(_perdu,_planRefPart(plId,m,d,e));',
      '    h+=_perdu;'],
    ['★★ l’absence injustifiée redevient gratuite hors fenêtre',
      '    var _du=(mo.heures||mo.id===\'injustifie\');', '    var _du=mo.heures;'],
    ['les heures dues disparaissent de la ligne « Ce mois »',
      "      +(_duesM>0.0001?(' \\u00b7 heures dues <b>\\u2212'+_planFmt(_duesM)+'</b>'):'')", "      +''"],
    ['★★ l’écart affiché repasse sur la référence NETTE (il redit « = »)',
      "          +(s.ecartBrut>0?'#b45309':(s.ecartBrut<0?'#dc2626':'#15803d'))+'\">'+_planFmtE(s.ecartBrut)+'</div>'",
      "          +(s.ecart>0?'#b45309':(s.ecart<0?'#dc2626':'#15803d'))+'\">'+_planFmtE(s.ecart)+'</div>'"],
    ['★ la référence affichée repasse sur la nette',
      "        +'<div class=\"tsub\">R\\u00e9f\\u00e9rence <b>'+_planFmt(s.refBrute)+'</b>'",
      "        +'<div class=\"tsub\">R\\u00e9f\\u00e9rence <b>'+_planFmt(s.ref)+'</b>'"],
    ['« jours prévus » recompte le modèle seul',
      '    if(_planRefPart(plId,planMonth,_kj,ent[_kj])>0.0001)_refJ++;',
      '    if(_planPlanned(plId,planMonth,_kj)>0.0001)_refJ++;'],
    ['★ le retard ressort du compte des jours travaillés',
      '    if(_PLAN_ST_OFFDAY[st.t]&&!st.retard)continue;',
      '    if(_PLAN_ST_OFFDAY[st.t])continue;'],
    ['le tableau d’année repart de janvier',
      '    if(parseInt(_cdA[0],10)===planYear)_anM0=Math.min(11,Math.max(0,parseInt(_cdA[1],10)-1)); }',
      '    if(false)_anM0=0; }'],
    ['les colonnes recoupent au jour 15',
      '  var _cut=(_rows.length<=3)?_rows.length:Math.ceil(_rows.length/2);',
      '  var _cut=15;'],
    ['la marge de page rend sa place à « about:blank »',
      "    +'@page{size:A4;margin:0}'", "    +'@page{size:A4;margin:10mm}'"],
    ['le premier du mois reperd son ordinal',
      "  return (jj === 1 ? '1er' : String(jj)) + ' '",
      "  return String(jj) + ' '"],
    ['les mois redeviennent anglais',
      "'Mai','Juin','Juil'", "'Mai','Jun','Jul'"],
    ['on n’attend plus la police avant d’imprimer',
      "if(document.fonts&&document.fonts.ready){document.fonts.ready.then(p);setTimeout(p,2500);}else{setTimeout(p,500);}",
      "setTimeout(p,400);"],
    ['la base absolue des polices disparaît',
      "    +(_base?('<base href=\"'+_escAttr(_base)+'\">'):'')", "    +''"]
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
