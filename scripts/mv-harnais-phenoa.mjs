/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-1A (§505) : LE STADE PAR PARCELLE, LA VUE « STADES » (docs/maquettes/maquette-niveau-au-dessus-v1.html, partie 1)
   Lancer :          node scripts/mv-harnais-phenoa.mjs
   Contre-épreuves : node scripts/mv-harnais-phenoa.mjs --contre

   POURQUOI IL EXISTE
   Le stade se note maintenant par parcelle — par l'administrateur seul (décision de Nico, 31/10). Ce harnais JOUE les vraies
   fonctions (extraites d'app.js) : le dernier stade d'une parcelle (par son identifiant stable, pas son nom), les voisines
   (même cépage, même commune), l'enregistrement (une note par parcelle, la date jamais dans le futur, refusé hors admin) et
   son Annuler, la lecture de la vue (le stade dominant en surface, le plus avancé, les parcelles sans stade depuis 12 jours
   pendant la pousse seulement) ; il garde le document `pheno` déclaré partout où un document doit l'être, et sa règle.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), fb: lire('src/firebase.js'), rules: lire('firestore.rules'), html: lire('index.html'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1', cepages: ['Pinot noir'], commune: 'Gevrey', surface: '0.5' }, { nom: 'Aux Combottes', pid: 'p2', cepage: 'Pinot noir', commune: 'Gevrey', surface: '1.6' },
    { nom: 'Clos Prieur', pid: 'p3', cepage: 'Pinot noir', commune: 'Gevrey', surface: '1.2' }, { nom: 'Les Evocelles', pid: 'p4', cepage: 'Pinot noir', commune: 'Brochon', surface: '0.8' },
    { nom: 'Champerrier', pid: 'p5', cepage: 'Chardonnay', commune: 'Gevrey', surface: '0.5' }, { nom: 'Vieille', pid: 'p6', cepage: 'Pinot noir', commune: 'Gevrey', statut: 'Arrachee', surface: '1' }];
  const el = { 'phn-date': { value: o.date || '2026-05-25' }, 'phn-rep': { checked: !!o.rep } }; const toasts = []; let saves = 0;
  const ctx = { window: { PARCELLES: P, PHENO: o.pheno || {}, currentUser: { nom: 'Nico' } }, isAdmin: () => o.adm !== false, todayStr: () => o.auj || '2026-05-25',
    document: { getElementById: (id) => el[id] || null }, saveData: () => { saves++; }, closeOv() {}, _escHtml: (x) => String(x), _escAttr: (x) => String(x),
    showToastAnnuler: (m, f) => toasts.push({ m, f }), _phenoRafraichir() {} };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_PHENO_STADES'), 'var _phenoP=null, _phenoB=null;', ...['_phenoAdm', '_phenoStade', '_phenoAn', '_phenoListe', '_phenoDernier', '_phenoCepages', '_phenoVoisines', '_phenoEnregistrer', '_phenoVue'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nthis.P=function(){return window.PARCELLES;}; this.set=function(p,b){_phenoP=p;_phenoB=b;}; this.dernier=_phenoDernier; this.voisines=_phenoVoisines; this.enreg=_phenoEnregistrer; this.vue=_phenoVue;', ctx);
  return { ctx, toasts, saves: () => saves, P };
}
function jouer(S) {
  const A = monde(S, { pheno: { 2026: [{ pid: 'p1', nom: 'Ancien nom', b: 57, d: '2026-05-20', t: 'a' }, { pid: 'p1', nom: 'Les Crais', b: 61, d: '2026-05-24', t: 'b' }, { pid: 'p2', nom: 'Aux Combottes', b: 99, d: '2026-05-24' }] } });
  const d1 = A.ctx.dernier(A.P[0], '2026');
  t('① le dernier stade d’une parcelle : par son identifiant (un renommage ne casse rien), le plus récent ; un code inconnu ignoré', d1 && d1.b === 61 && A.ctx.dernier(A.P[1], '2026') === null);
  t('① les voisines : même cépage, même commune, pas les arrachées, pas elle-même', A.ctx.voisines(A.P[0]).map((x) => x.nom).join() === 'Aux Combottes,Clos Prieur');
  const B = monde(S, { rep: true, date: '2026-06-30' }); B.ctx.set(B.P[0], 57); B.ctx.enreg();
  const L = (B.ctx.window.PHENO['2026'] || []);
  t('② enregistrer avec le report : trois notes (la parcelle et ses deux voisines), la date ramenée à aujourd’hui, l’auteur et l’instant', L.length === 3 && L.every((e) => e.b === 57 && e.d === '2026-05-25' && e.par === 'Nico' && e.t === L[0].t) && L.map((e) => e.pid).join() === 'p1,p2,p3' && B.saves() === 1 && /^Boutons séparés noté sur 3 parcelles$/.test(B.toasts[0].m));
  B.toasts[0].f();
  t('② Annuler retire ces trois notes-là (par leur instant, même si la donnée est revenue du serveur)', (B.ctx.window.PHENO['2026'] || []).length === 0 && B.saves() === 2);
  const C = monde(S, { adm: false }); C.ctx.set(C.P[0], 57); C.ctx.enreg();
  t('② hors administrateur : rien ne s’écrit', !(C.ctx.window.PHENO['2026']) && C.saves() === 0);
  const D = monde(S, { auj: '2026-06-08', pheno: { 2026: [{ pid: 'p1', b: 61, d: '2026-06-06' }, { pid: 'p2', b: 57, d: '2026-06-06' }, { pid: 'p3', b: 57, d: '2026-05-20' }] } });
  const v = D.ctx.vue('2026', '2026-06-08');
  t('③ la vue : le stade qui couvre le plus de surface (séparés : 2,8 ha), le plus avancé (Les Crais, 61)', v.bMax === 57 && Math.abs(v.parB[57] - 2.8) < 1e-9 && v.plusAv.p.nom === 'Les Crais');
  t('③ sans stade depuis 12 jours, pendant la pousse : Clos Prieur (19 jours), Les Evocelles, Champerrier (jamais) — pas les arrachées', v.sans.map((x) => x.p.nom).join() === 'Clos Prieur,Les Evocelles,Champerrier');
  t('③ en novembre, plus d’alerte', D.ctx.vue('2026', '2026-11-08').sans.length === 0);
  t('④ le document `pheno` : déclaré, en temps réel, nommé, pesé, connu de saveData ; la règle le réserve à l’administrateur', /'intrants',[\s\S]{0,400}'pheno',\n  \/\/ `paie`/.test(S.fb) && S.fb.includes("'intrants','pheno'];") && S.fb.includes("pheno:'Les stades'") && S.fb.includes('pheno: 2,')
    && S.app.includes("pheno:              window.PHENO || (window.PHENO={}),") && /'intrants', 'paie',\n\s*'pheno'\];/.test(S.rules));
  t('④ l’écran : l’onglet, la vue, la ligne de la fiche, la fenêtre ; la bascule et la feuille « Filtres » connaissent les stades ; Liste / Carte revient en haut au téléphone', S.html.includes('id="tbs" onclick="switchPTab(\'stades\')"') && S.html.includes('id="pwrapstades"') && S.html.includes('id="dp-pheno"') && S.html.includes('id="ovPheno"')
    && S.app.includes("if(tab==='stades') _phenoRendreVue();") && S.app.includes('data-v="stades" onclick="_pFxVue(this.dataset.v)"') && S.css.includes('#page-parcelles.p-vue-stades .tabs2{display:flex!important;}'));
  t('⑤ exposées ; la liste joue ce fichier et sa contre-épreuve', S.app.includes('window._phenoNoter=_phenoNoter; window._phenoChoisir=_phenoChoisir; window._phenoEnregistrer=_phenoEnregistrer;') && S.liste.indexOf("mv-harnais-phenoa.mjs'") > 0 && S.liste.indexOf("mv-harnais-phenoa.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['le dernier stade cherché par le nom (un renommage le perd)', m('app', 'return p.pid&&e.pid?e.pid===p.pid:e.nom===p.nom;', 'return e.nom===p.nom;')],
    ['les voisines sans la commune', m('app', "&&String(x.commune||'')===String(p.commune||'');", ';')],
    ['une date dans le futur passe', m('app', 'if(d>auj) d=auj;', '')],
    ['l’enregistrement ouvert à tous', m('app', "  if(!_phenoAdm()||!_phenoP||_phenoB==null||!_phenoStade(_phenoB)) return;\n  var auj=todayStr()", "  if(!_phenoP||_phenoB==null||!_phenoStade(_phenoB)) return;\n  var auj=todayStr()")],
    ['Annuler ne retire rien', m('app', 'Q[an]=Q[an].filter(function(e){ return !(e&&e.t===t); });', '')],
    ['l’alerte aussi en hiver', m('app', 'enPousse=mois>=3&&mois<=9,', 'enPousse=true,')],
    ['la règle ne réserve plus `pheno` à l’administrateur', m('rules', "'intrants', 'paie',\n                   'pheno'];", "'intrants', 'paie'];")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-phenoa.mjs'").join("mv-harnais-phenoZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
