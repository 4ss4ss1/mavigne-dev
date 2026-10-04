#!/usr/bin/env node
// ── HARNAIS — GESTES-1 (§239) : DÉGUSTATION, TRAITEMENT, FILTRATION ─────────────────────────────────────
//   node scripts/mv-harnais-gestes.mjs           → doit être vert
//   node scripts/mv-harnais-gestes.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions (extraites des fichiers, jamais bouchonnées) : les lignes lisibles des trois gestes,
// la famille d'un traitement au registre, le détail du registre, et la sortie de stock des traitements du Chai
// dans La Réserve. Vérifie aussi que chaque geste neuf est câblé partout (formulaire, journal, export, registre),
// que chaque handler du formulaire est posé sur window (§24, piège 1), et les deux correctifs (×82, « · »).
// ⚠️ §34g : on lit le CODE sans ses commentaires. La Cave se lit par mv-cave-src (CAVE_FICHIERS).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { CAVE_FICHIERS } from './mv-cave-src.mjs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const rd = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
function fn(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), n = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') n++; else if (c === '}') { n--; if (n === 0) break; }
  }
  return src.slice(i, k + 1);
}
const vr = (src, nom) => { const m = src.match(new RegExp('var ' + nom + '=\\[[^;]*\\];')); if (!m) throw new Error('var introuvable : ' + nom); return m[0]; };
const BASE = { cave: CAVE_FICHIERS.map(rd).join('\n'), caveJs: rd('src/cave.js'), reserve: rd('src/reserve.js'), index: rd('index.html') };

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const C = sansCom(S.caveJs), X = S.index;
  // 1. le formulaire, le journal, l'export
  for (const [k, ic] of [['degustation', 'verre'], ['traitement', 'fiole'], ['filtration', 'entonnoir']]) {
    T('index : bouton ' + k, X.includes('id="cot-' + k + '"') && X.includes("selCaveOpType('" + k + "')"));
    T('index : champs ' + k, X.includes('id="cop-fields-' + k + '"'));
    T('index : filtre du journal ' + k, X.includes('data-f="' + k + '"'));
    T('index : case d\u2019export ' + k, X.includes('id="cexp-type-' + k + '"'));
    T('index : icône #ic-' + ic + ' déclarée', X.includes('<symbol id="ic-' + ic + '"'));
    for (const motif of ["'" + k + "'", k + ':']) T('cave.js : « ' + motif + ' » présent', C.includes(motif));
  }
  T('selCaveOpType connaît les huit types', /\['ouillage','soutirage','soufre','analyse','degustation','traitement','filtration','autre'\]\.forEach\(function\(t\) \{/.test(C));
  T('export : « Tous types » compte huit types', C.includes("_caveExpTypes.size===8?'Tous types'"));
  T('saveCaveOp passe par _copNouvData', /_caveOpType==='filtration'\)\{\s*var _nd=_copNouvData\(cuvees\);/.test(C));
  T('une dégustation porte sur UNE cuvée (toggleCopCuvee)', C.includes("function toggleCopCuvee(id){if(_caveOpType==='degustation'){_copAllCuv=false;_copCuvSel=new Set([id]);"));
  T('« goûter la suivante » câblé', X.includes('id="cop-dg-next"') && C.includes('_copDgOuvrirSuivante(firstId)'));
  // 2. chaque handler du formulaire neuf est posé sur window
  // Deux sources : le HTML statique d'index.html, et les boutons que cave.js fabrique (onclick en chaîne).
  const nX = [...new Set([...X.matchAll(/on(?:click|input|change)="(_cop(?:Dg|Tr|Fi)\w+)\(/g)].map(m => m[1]))];
  const nC = [...new Set([...C.matchAll(/["'](_cop(?:Dg|Tr|Fi)\w+)\(/g)].map(m => m[1]))];
  const noms = [...new Set(nX.concat(nC))];
  T('handlers lus : ' + nX.length + ' dans index.html (≥ 8), ' + nC.length + ' fabriqués par cave.js (≥ 6)', nX.length >= 8 && nC.length >= 6);
  for (const n of noms) T('window.' + n + ' posé', new RegExp('window\\.' + n + '\\s*=').test(C));
  // 3. les deux correctifs
  T('pastille de cuvée : espace avant le point', C.includes("+' \\u00b7 '+nbT+'</button>'"));
  T('soufre : plus de 82 fûts écrits en dur', !/_copGetNbFuts\(\)\s*\|\|\s*82/.test(C));
  // 4. registre : types, familles, hors registre
  T('RM_TYPES : filtration en pratiques de cave', /filtration:\s*\{fam:'pratique'/.test(C));
  T('RM_HORS : la dégustation est comptée en pied', /RM_HORS = \{[^}]*degustation:/.test(C));
  T('RM_FAMILLES : corrections d\u2019acidité', C.includes("{k:'acidite'"));
  T('registre Chai : la famille d\u2019un traitement suit sa nature', C.includes("if(o.type === 'traitement') T = _rmTraitT(o.data);"));
  // 5. exécution des vraies fonctions
  let L = null, W = {};
  try {
    const code = [vr(S.cave, '_COP_DG_ETATS'), vr(S.cave, '_COP_DG_SIG'), vr(S.cave, '_COP_DG_SUITE'), vr(S.cave, '_COP_TR_NAT'),
      fn(S.cave, '_copNf'), fn(S.cave, '_copQteTxt'), fn(S.cave, '_copNouvLignes'), fn(S.cave, '_rmTraitT'),
      fn(S.cave, '_rmNum'), fn(S.cave, '_rmF'), fn(S.cave, '_rmDetail'), fn(S.cave, '_vendIntrQteTxt'), fn(S.reserve, '_consoCuvier')].join('\n');
    L = new Function('window', code + '\nwindow._vendIntrQteTxt=_vendIntrQteTxt;\nreturn {lignes:_copNouvLignes, traitT:_rmTraitT, detail:_rmDetail, conso:_consoCuvier};')(W);
  } catch (e) { T('extraction des fonctions : ' + e.message, false); return out; }
  const tr = L.lignes({ type: 'traitement', data: { nature: 'col', produit: 'Gélatine liquide', dose: 60, dose_unit: 'mL/hL', volume_hl: 31.92, qte: 1.915, qte_unite: 'L' } });
  T('traitement : « Collage · Gélatine liquide · 60 mL/hL × 31,9 hL · = 1,92 L »', tr[0] === 'Collage \u00b7 Gélatine liquide \u00b7 60 mL/hL \u00d7 31,9 hL \u00b7 = 1,92 L');
  const fi = L.lignes({ type: 'filtration', data: { ftype_lbl: 'Plaques', seuil_um: 1, volume_hl: 20.52, perte_l: 12 } });
  T('filtration : « Plaques · 1 µm · 20,5 hL · perte 12 L (0,6 %) »', fi[0] === 'Plaques \u00b7 1 \u00b5m \u00b7 20,5 hL \u00b7 perte 12 L (0,6 %)');
  const dg = L.lignes({ type: 'degustation', data: { etat: 's', signaux: ['red', 'ferm'], suite: 'sout', fut: { annee: 2023, four: 'Taransaud', ref: '', repere: 'n°7' } } });
  T('dégustation : état, remarques, suite', dg[0] === 'À surveiller \u00b7 Réduit, Fermé \u00b7 Suite : soutirer');
  T('dégustation : le fût désigné par son lot et son repère', dg[1] === 'Sur un fût \u00b7 2023 \u00b7 Taransaud \u2014 n°7');
  T('dégustation sur la cuvée : aucune ligne « fût »', L.lignes({ type: 'degustation', data: { etat: 'b', fut: null } }).length === 1);
  let robuste = true; try { L.lignes({ type: 'traitement', data: null }); L.lignes({ type: 'degustation', data: { signaux: 'x', fut: 'y' } }); L.lignes({ type: 'filtration' }); } catch (e) { robuste = false; }
  T('donnée incomplète ou d\u2019une autre forme : aucune exception (§24, piège 20)', robuste);
  T('famille : acidité à part', L.traitT({ nature: 'aci' }).fam === 'acidite');
  T('famille : collage en adjonctions', L.traitT({ nature: 'col' }).fam === 'intrant' && L.traitT(null).fam === 'intrant');
  T('registre : détail de la filtration', L.detail({ type: 'filtration', ftype_lbl: 'Plaques', seuil_um: 1, volume_hl: 20.5, perte_l: 12 }).includes('perte 12 L'));
  T('registre : détail du traitement (quantité)', L.detail({ type: 'traitement', produit: 'Bentonite', dose: 40, dose_unit: 'g/hL', volume_hl: 10, qte: 0.4, qte_unite: 'kg' }).includes('soit'));
  W.CAVE_VENDANGE = { cuves_vinif: [{ operations: [{ id: 'v1', prod_id: 'p1', qte: 1 }] }] };
  W.CAVE_ELEVAGE = { operations: [{ id: 'op_1', type: 'traitement', data: { prod_id: 'p1', qte: 2 } }, { id: 'op_2', type: 'traitement', data: { prod_id: 'p2', qte: 5 } }, { id: 'op_3', type: 'soutirage', data: { prod_id: 'p1', qte: 9 } }] };
  T('Réserve : Cuvier + traitements du Chai sortent du même stock (1 + 2)', L.conso('p1') === 3);
  T('Réserve : l\u2019opération en cours d\u2019édition est exclue', L.conso('p1', 'op_1') === 1);
  W.CAVE_VENDANGE = undefined;
  T('Réserve : sans Cuvier, le Chai compte quand même', L.conso('p1') === 2);
  return out;
}
const rouge = r => r.filter(x => !x[1]);
if (!CONTRE) {
  const r = suite(BASE); r.forEach(([n, ok]) => console.log((ok ? '  \u2713 ' : '  \u2717 ') + n));
  const k = rouge(r).length; console.log('\n  ' + (r.length - k) + ' vertes, ' + k + ' rouge(s)'); process.exit(k ? 1 : 0);
}
const DEF = [
  ['la sortie de stock du Chai retirée', S => ({ ...S, reserve: S.reserve.replace("o.type!=='traitement'", "o.type!=='rien'") })],
  ['les 82 fûts revenus', S => ({ ...S, caveJs: S.caveJs.replace('var nbFuts=_copGetNbFuts();', 'var nbFuts=_copGetNbFuts()||82;') })],
  ['l\u2019acidité rangée en adjonctions', S => ({ ...S, cave: S.cave.replace("(n === 'aci') ? 'acidite'", "(n === 'aci') ? 'intrant'") })],
  ['l\u2019espace avant le point perdu', S => ({ ...S, caveJs: S.caveJs.replace("+' \\u00b7 '+nbT", "+'\\u00b7 '+nbT") })],
  ['un handler non posé sur window', S => ({ ...S, caveJs: S.caveJs.replace('window._copDgMode=function', 'var _copDgModeX=function') })],
  ['la ligne du fût oubliée', S => ({ ...S, cave: S.cave.replace("out.push(g.join(' \\u00b7 ')", "void(g.join(' \\u00b7 ')") })],
  ['la dégustation entrée au registre', S => ({ ...S, caveJs: S.caveJs.replace("degustation:'D\\u00e9gustations', ", '') })],
];
let ko = 0;
for (const [nom, f] of DEF) {
  const S = f(BASE), mute = Object.keys(S).some(k => S[k] !== BASE[k]);
  const rg = mute && rouge(suite(S)).length > 0;
  console.log((rg ? '  \u2713 rougit : ' : '  \u2717 NE ROUGIT PAS : ') + nom + (mute ? '' : ' (défaut non injecté)'));
  if (!rg) ko++;
}
console.log('\n  ' + (DEF.length - ko) + '/' + DEF.length + ' contre-épreuves rougissent'); process.exit(ko ? 1 : 0);
