/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-2A (§563) : LE STADE NOTÉ SERT AU REGISTRE ET À L'ALERTE GEL
   Lancer :          node scripts/mv-harnais-pheno2a.mjs
   Contre-épreuves : node scripts/mv-harnais-pheno2a.mjs --contre

   POURQUOI IL EXISTE
   Deux des quatre branchements du plan PHENO-2. Ce harnais JOUE les vraies fonctions (extraites d'app.js) : le registre
   propose le stade des parcelles traitées — l'intitulé du registre qui répond au code BBCH noté, le plus récent AU JOUR DU
   TRAITEMENT, celui qui couvre le plus de surface, les autres dits, les parcelles sans stade comptées ; les parcelles
   débourrées (stade ≥ 09 au jour donné). Il garde la règle de « Gel annoncé » (octobre à février : rien ; de mars à septembre,
   les débourrées dites ; sans aucun stade de l'année, comme avant) et la proposition dans l'assistant de traitement.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), ph: lire('src/phyto.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, pheno) {
  const P = [{ nom: 'Les Crais', pid: 'p1', surface: '0.5' }, { nom: 'Aux Combottes', pid: 'p2', surface: '1.6' }, { nom: 'Clos Prieur', pid: 'p3', surface: '1.2' }, { nom: 'Vieille', pid: 'p4', surface: '1', statut: 'Arrachee' }];
  const ctx = { window: { PARCELLES: P, PHENO: pheno }, todayStr: () => '2026-05-25' };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_PHENO_STADES'), variable(S.app, '_PHENO_REGISTRE'), ...['_phenoStade', '_phenoAn', '_phenoListe', '_phenoAuJour', '_phenoStadeRegistre', '_phenoDebourrees'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nthis.reg=_phenoStadeRegistre; this.deb=_phenoDebourrees;', ctx);
  return ctx;
}
function jouer(S) {
  const N = { 2026: [{ pid: 'p1', b: 61, d: '2026-05-24' }, { pid: 'p1', b: 57, d: '2026-05-15' }, { pid: 'p2', b: 57, d: '2026-05-20' }, { pid: 'p2', b: 65, d: '2026-05-30' }] };
  const C = monde(S, N);
  const r = C.reg(['Les Crais', 'Aux Combottes', 'Clos Prieur'], '2026-05-25');
  t('① au jour du traitement : Aux Combottes en séparés (la note du 30 mai ne compte pas), Les Crais en début floraison ; le registre propose celui qui couvre le plus (1,6 ha)', r && r.stade === 'Pré-floraison (BBCH 57)' && r.divers && r.autres.join() === 'Floraison (BBCH 60–69)' && r.sans === 1);
  t('① le bon intitulé du registre pour chaque code (agglomérés et séparés : pré-floraison ; 61 et 65 : floraison) ; rien sans note', C.reg(['Les Crais'], '2026-05-16').stade === 'Pré-floraison (BBCH 57)' && C.reg(['Les Crais'], '2026-05-26').stade === 'Floraison (BBCH 60–69)' && C.reg(['Clos Prieur'], '2026-05-26') === null);
  const D = monde(S, { 2026: [{ pid: 'p1', b: 9, d: '2026-04-02' }, { pid: 'p2', b: 5, d: '2026-04-02' }, { pid: 'p4', b: 12, d: '2026-04-02' }] });
  const d = D.deb('2026-04-05'), d0 = D.deb('2026-04-01'), dn = monde(S, {}).deb('2026-04-05');
  t('② débourrées : Les Crais (09) — pas Aux Combottes (05), pas l’arrachée ; avant la note, aucune ; sans aucune note, le dit', d.notes === 3 && d.parcelles.map((p) => p.nom).join() === 'Les Crais' && d0.parcelles.length === 0 && dn.notes === 0);
  t('③ « Gel annoncé » : rien d’octobre à février ; de mars à septembre, pas si des stades sont notés et aucune parcelle débourrée ; les débourrées dites ; sinon « stades non notés »', S.app.includes('if(_gm>=3&&_gm<=9&&!(_gD.notes&&!_gD.parcelles.length)) for(var g=0;') && S.app.includes("(_gD.notes?' \\u00b7 '+(_gN.length>3?_gN.length+' parcelles d\\u00e9bourr\\u00e9es'") && S.app.includes("' \\u00b7 stades non not\\u00e9s'"));
  t('④ l’assistant de traitement propose le stade s’il est vide, et le dit sous le choix', S.ph.includes("var _prop=(!_trat.stade&&typeof window._phenoStadeRegistre==='function')?window._phenoStadeRegistre(_trat.parcelles,_trat.date):null;") && S.ph.includes('if(_prop) _trat.stade=_prop.stade;') && S.ph.includes("'Propos\\u00e9 d\\u2019apr\\u00e8s le relev\\u00e9 des stades'"));
  t('⑤ exposée ; la liste joue ce fichier et sa contre-épreuve', S.app.includes('window._phenoStadeRegistre=_phenoStadeRegistre;') && S.liste.indexOf("mv-harnais-pheno2a.mjs'") > 0 && S.liste.indexOf("mv-harnais-pheno2a.mjs --contre'") > 0);
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
    ['une note postérieure au traitement compte', m('app', "&&String(e.d)<=String(d||todayStr()); });", '; });')],
    ['les séparés deviennent floraison au registre', m('app', "57:'Pr\\u00e9-floraison (BBCH 57)',", "57:'Floraison (BBCH 60\\u201369)',")],
    ['la proposition oublie la surface', m('app', 'parS[s]=(parS[s]||0)+(parseFloat(p.surface)||0)+1e-9;', 'parS[s]=(parS[s]||0)+1;')],
    ['le seuil du débourrement à 05', m('app', 'return !!(e&&Number(e.b)>=9);', 'return !!(e&&Number(e.b)>=5);')],
    ['le gel aussi en hiver', m('app', 'if(_gm>=3&&_gm<=9&&!(_gD.notes&&!_gD.parcelles.length)) for(var g=0;', 'if(!(_gD.notes&&!_gD.parcelles.length)) for(var g=0;')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pheno2a.mjs'").join("mv-harnais-phenoZa.mjs'") })],
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
