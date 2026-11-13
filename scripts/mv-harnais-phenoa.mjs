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
const S0 = { app: lire('src/app.js'), fb: lire('src/firebase.js'), rules: lire('firestore.rules'), html: lire('index.html'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };   // PHENO-1A2 (§506) : le relevé, la cuvée
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1', cepages: ['Pinot noir'], commune: 'Gevrey', surface: '0.5' }, { nom: 'Aux Combottes', pid: 'p2', cepage: 'Pinot noir', commune: 'Gevrey', surface: '1.6' },
    { nom: 'Clos Prieur', pid: 'p3', cepage: 'Pinot noir', commune: 'Gevrey', surface: '1.2' }, { nom: 'Les Evocelles', pid: 'p4', cepage: 'Pinot noir', commune: 'Brochon', surface: '0.8' },
    { nom: 'Champerrier', pid: 'p5', cepage: 'Chardonnay', commune: 'Gevrey', surface: '0.5' }, { nom: 'Vieille', pid: 'p6', cepage: 'Pinot noir', commune: 'Gevrey', statut: 'Arrachee', surface: '1' }];
  const el = {}; const toasts = []; let saves = 0;
  const ctx = { window: { PARCELLES: P, PHENO: o.pheno || {}, currentUser: { nom: 'Nico' }, CAVE_ELEVAGE: { cuvees: o.cuvees || [] } }, isAdmin: () => o.adm !== false, todayStr: () => o.auj || '2026-05-25',
    document: { getElementById: (id) => el[id] || null }, saveData: () => { saves++; }, _escHtml: (x) => String(x), _escAttr: (x) => String(x),
    showToastAnnuler: (m, f) => toasts.push({ m, f }), _phenoRafraichir() {} };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_PHENO_STADES'), variable(S.app, '_PHENO_MOIS'), variable(S.app, '_PHENO_MOIS_L'), variable(S.app, '_PHENO_SEM'), "var _phenoOuverte='', _phenoQuestion=null, _phenoRelJour='auj', _phenoRelAutre='', _phenoRelDu='', _phenoMenu=false;",   // PHENO-1D (§509) : la date du relevé
    ...['_phenoAdm', '_phenoStade', '_phenoAn', '_phenoListe', '_phenoDernier', '_phenoCepages', '_phenoEnSaison', '_phenoGroupe', '_phenoCuvees', '_phenoLignes', '_phenoVue', '_phenoAjouter', '_phenoNoterDirect',
      '_phenoJour', '_phenoLib', '_phenoIso', '_phenoDecale', '_phenoEcart', '_phenoJm', '_phenoRel', '_phenoDateDe', '_phenoGarde', '_phenoPermis', '_phenoSaut', '_phenoReleveRaz', '_phenoReleveDate'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + "\nthis.dernier=_phenoDernier; this.cuvees=_phenoCuvees; this.vue=_phenoVue; this.ajouter=_phenoAjouter; this.direct=_phenoNoterDirect; this.ouvrir=function(n){ _phenoOuverte=n; }; this.rel=function(k,a){ _phenoRelJour=k; _phenoRelAutre=a||''; _phenoRelDu=todayStr(); }; _phenoRendreVue=function(){};", ctx);
  return { ctx, toasts, saves: () => saves, P };
}
function jouer(S) {
  const A = monde(S, { pheno: { 2026: [{ pid: 'p1', nom: 'Ancien nom', b: 57, d: '2026-05-20', t: 'a' }, { pid: 'p1', nom: 'Les Crais', b: 61, d: '2026-05-24', t: 'b' }, { pid: 'p2', nom: 'Aux Combottes', b: 99, d: '2026-05-24' }] } });
  const d1 = A.ctx.dernier(A.P[0], '2026');
  t('① le dernier stade d’une parcelle : par son identifiant (un renommage ne casse rien), le plus récent ; un code inconnu ignoré', d1 && d1.b === 61 && A.ctx.dernier(A.P[1], '2026') === null);
  const C = monde(S, { cuvees: [{ nom: 'Gevrey village', millesime: '2024', parcelles: ['Les Crais', 'Champerrier'] }, { nom: 'Gevrey Combottes', millesime: '2025', parcelles: [{ nom: 'Les Crais' }, 'Aux Combottes'] }, { nom: 'Vide', millesime: '2025', parcelles: [] }] });
  const cv = C.ctx.cuvees();
  t('② les cuvées de la Cave rangent les parcelles : la plus récente qui les cite l’emporte (noms ou objets)', cv['Les Crais'] === 'Gevrey Combottes' && cv['Aux Combottes'] === 'Gevrey Combottes' && cv['Champerrier'] === 'Gevrey village' && !('Clos Prieur' in cv));
  const B = monde(S, {}); B.ctx.ajouter([B.P[0], B.P[1]], 61, '2026-05-25');
  const L = B.ctx.window.PHENO['2026'] || [];
  t('③ noter : une note par parcelle, la même date, l’auteur et un instant commun ; « Annuler » nomme ce qui est noté', L.length === 2 && L.every((e) => e.b === 61 && e.d === '2026-05-25' && e.par === 'Nico' && e.t === L[0].t) && B.saves() === 1 && B.toasts[0].m === '2 parcelles · début floraison (61)');
  B.toasts[0].f(); t('③ Annuler retire ces notes-là (par leur instant, même revenues du serveur)', (B.ctx.window.PHENO['2026'] || []).length === 0 && B.saves() === 2);
  const D = monde(S, { adm: false }); D.ctx.ajouter([D.P[0]], 61, '2026-05-25'); D.ctx.direct('Les Crais', 61);
  t('③ hors administrateur : rien ne s’écrit, ni par le relevé ni autrement', !(D.ctx.window.PHENO['2026']) && D.saves() === 0);
  const E = monde(S, {}); E.ctx.direct('Les Crais', 57); const E2 = monde(S, {}); E2.ctx.rel('hier'); E2.ctx.direct('Les Crais', 57); const E3 = monde(S, {}); E3.ctx.rel('autre', '2026-09-30'); E3.ctx.direct('Les Crais', 57); const E4 = monde(S, {}); E4.ctx.rel('autre', '2025-05-20'); E4.ctx.direct('Les Crais', 57);
  t('④ le relevé note à sa date (PHENO-1D) : aujourd’hui d’office, hier choisi en tête ; jamais dans le futur ni d’une autre année', E.ctx.window.PHENO['2026'][0].d === '2026-05-25' && E2.ctx.window.PHENO['2026'][0].d === '2026-05-24' && E3.ctx.window.PHENO['2026'][0].d === '2026-05-25' && E4.ctx.window.PHENO['2026'][0].d === '2026-05-25');
  const F = monde(S, { auj: '2026-06-08', pheno: { 2026: [{ pid: 'p1', b: 61, d: '2026-06-06' }, { pid: 'p2', b: 57, d: '2026-06-06' }, { pid: 'p3', b: 57, d: '2026-05-28' }] } });
  const v = F.ctx.vue('2026', '2026-06-08');
  t('⑤ la vue : les surfaces par groupe (boutons 2,8 ha, floraison 0,5) et sans note (1,3) ; la dernière note', Math.abs(v.parG[2] - 2.8) < 1e-9 && Math.abs(v.parG[3] - 0.5) < 1e-9 && Math.abs(v.sansS - 1.3) < 1e-9 && v.der === '2026-06-06');
  t('⑤ « à noter » en saison : Clos Prieur (11 jours), Les Evocelles et Champerrier (jamais) — pas les arrachées ; rien en novembre', v.aNoter.map((x) => x.p.nom).join() === 'Clos Prieur,Les Evocelles,Champerrier' && F.ctx.vue('2026', '2026-11-08').aNoter.length === 0);
  t('⑥ le document `pheno` : déclaré, en temps réel, nommé, pesé, connu de saveData ; la règle le réserve à l’administrateur', /'intrants',[\s\S]{0,400}'pheno',\n[\s\S]{0,500}\/\/ `paie`/.test(S.fb) && S.fb.includes("'intrants','pheno','recolte'];") && S.fb.includes("pheno:'Les stades'") && S.fb.includes('pheno: 2,')
    && S.app.includes("pheno:              window.PHENO || (window.PHENO={}),") && /'intrants', 'paie',\n\s*'pheno',\s*\/\/ ★ PHENO-1A/.test(S.rules));
  t('⑦ l’écran : l’onglet, la vue, la fiche, la fenêtre, la carte de l’Accueil ; le report par cépage retiré ; la bascule et « Filtres » connaissent les stades', S.html.includes('id="tbs" onclick="switchPTab(\'stades\')"') && S.html.includes('id="pwrapstades"') && S.html.includes('id="dp-pheno"') && S.html.includes('id="ovPheno"') && S.html.includes('id="home-pheno-note"')
    && !S.app.includes('function _phenoVoisines(') && !S.app.includes('phn-rep') && S.app.includes("if(tab==='stades'){ _phenoReleveRaz(); _phenoRendreVue(); }") && S.app.includes('data-v="stades" onclick="_pFxVue(this.dataset.v)"') && S.app.includes('  _phenoAccueil();    // ★ PHENO-1A2'));
  t('⑦ l’affichage sobre : le filet, la pastille du code en chiffres tabulaires, le titre de la charte ; Liste / Carte revient en haut au téléphone', S.css.includes('.phr-f{align-self:stretch;width:4px;background:var(--phc);}') && S.css.includes('font-variant-numeric:tabular-nums;text-align:center;}') && S.css.includes('.phr-t{font-family:var(--font-titre,Georgia,serif);') && S.css.includes('#page-parcelles.p-vue-stades .tabs2{display:flex!important;}'));
  t('⑧ exposées ; la liste joue ce fichier et sa contre-épreuve', S.app.includes('window._phenoNoter=_phenoNoter; window._phenoChoisir=_phenoChoisir; window._phenoEnregistrer=_phenoEnregistrer;') && S.app.includes('window._phenoNoterDirect=_phenoNoterDirect;') && S.liste.indexOf("mv-harnais-phenoa.mjs'") > 0 && S.liste.indexOf("mv-harnais-phenoa.mjs --contre'") > 0);
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
    ['les cuvées anciennes l’emportent', m('app', "return String(b.millesime||b.mil||'').localeCompare(String(a.millesime||a.mil||''));", "return String(a.millesime||a.mil||'').localeCompare(String(b.millesime||b.mil||''));")],
    ['la date du relevé ignorée (toujours aujourd’hui)', m('app', "var auj=todayStr(), d=_phenoReleveDate(auj), g=_phenoGarde(p,d);", "var auj=todayStr(), d=auj, g=_phenoGarde(p,d);")],
    ['une date dans le futur passe par le relevé', m('app', "if(k==='autre'&&autre&&String(autre)<=auj&&String(autre).slice(0,4)===String(auj).slice(0,4)) return String(autre);", "if(k==='autre'&&autre) return String(autre);")],
    ['noter ouvert à tous', m('app', "  if(!_phenoAdm()||!cibles||!cibles.length||!_phenoStade(b)) return 0;", "  if(!cibles||!cibles.length||!_phenoStade(b)) return 0;")],
    ['Annuler ne retire rien', m('app', "Q[an]=Q[an].filter(function(e){ return !(e&&e.t===t); }).concat(retires);", "Q[an]=Q[an].concat(retires);")],
    ['« à noter » aussi en hiver', m('app', 'aNoter:_phenoEnSaison(auj)?L.filter(function(x){ return x.vieux; }):[]', 'aNoter:L.filter(function(x){ return x.vieux; })')],
    ['la règle ne réserve plus `pheno` à l’administrateur', m('rules', "'intrants', 'paie',\n                   'pheno',    // ★ PHENO-1A (§505)", "'intrants', 'paie',\n                   // ★ PHENO-1A (§505)")],   // RECOLTE-1A (§568) : 'recolte' suit 'pheno' dans la liste
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
