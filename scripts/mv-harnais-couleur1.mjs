// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS COULEUR-1 (§625) — LA COULEUR DE LA CUVÉE AU CHAI ; LES MÉLANGES QUI NE SE FONT PAS ;
//  LA LISTE DES TUTOS RANGÉE PAR MODULE
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 27/11 : « suite, et l'idéal ce serait de tout faire en un lot » — COULEUR-1 (le reste du §624e, d'après la
//  maquette v2 validée : « Assembler une cuvée rouge et une blanche en “rosé” — Impossible ») et le découpage de
//  src/tutos.js, dû depuis §621.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la règle des mélanges, JOUÉE sur les vraies fonctions de src/cuvier-pratiques.js : un rouge ou un rosé dans un
//      blanc, du blanc dans un rosé — impossible ; du blanc dans un rouge — à vérifier ; un rouge et un rosé — rien ;
//      une couleur inconnue ne tranche rien. La couleur d'une cuvée : la sienne, sinon celle de sa cuve, sinon « ? ».
//      La carte du Chai ne la dit que si le domaine en a plusieurs ;
//   B. le branchement : le décuvage écrit la couleur de la cuve ; « Nouvelle cuvée » la propose et l'écrit ;
//      l'assemblage du Chai et la fusion du Cuvier refusent AVANT toute écriture, notent la confirmation ; la carte,
//      la fiche et le labo lisent la même couleur ; cave.js passe par window (pas d'import du module des pratiques) ;
//   C. le tuto « créer une cuvée en cuve » choisit la couleur ; D. l'aide, le guide, « Quoi de neuf » ;
//   E. le découpage : src/tutos.js n'a plus de tuto, il importe chaque liste et chaque liste est importée ; une liste
//      ne lit que des outils qui lui sont posés, jamais au chargement ; les scripts lisent les tutos par
//      scripts/mv-tutos-sources.mjs ; les listes se chargent dans Node, sans valeur perdue.
//
//  Usage :  node scripts/mv-harnais-couleur1.mjs
//           node scripts/mv-harnais-couleur1.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { fichiersTutos } from './mv-tutos-sources.mjs';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const LISTES = ['vigne', 'tracteur', 'planning', 'phyto', 'reserve', 'cave'];
const MODULE = { vigne: 'Vigne', tracteur: 'Tracteur', planning: 'Planning', phyto: 'Phyto', reserve: 'Réserve', cave: 'Cave' };
// Les scripts qui lisent les tutos (hors du module des sources) : aucun ne doit lire src/tutos.js seul.
const SCRIPTS = readdirSync(new URL('./', import.meta.url)).filter((f) => /\.mjs$/.test(f) && f !== 'mv-tutos-sources.mjs' && f !== 'mv-harnais-couleur1.mjs');
const SAIN = {
  pr: lire('src/cuvier-pratiques.js'), cu: lire('src/cuvier.js'), cave: lire('src/cave.js'), html: lire('index.html'),
  utils: lire('src/utils.js'), wn: lire('src/whats-new.js'), g08: lire('guide/08-cave.html'), cov: lire('scripts/tutos-couverture.json'),
  tu: lire('src/tutos.js'), L: Object.fromEntries(LISTES.map((m) => [m, lire('src/tutos-' + m + '.js')])),
  sc: Object.fromEntries(SCRIPTS.map((f) => [f, lire('scripts/' + f)]))
};

function bornes(src, nom) {
  const re = new RegExp('^(?:export )?(?:async )?function ' + nom + '\\s*\\(', 'gm');
  const m = [...src.matchAll(re)];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);

const PRELUDE = `
var COUL = { Perr: 'b', Clos: 'r' }, SRC = {};
var CAVE_VENDANGE = { config: {}, cuves_vinif: [] };
var window = { CAVE_ELEVAGE: { cuvees: [] }, _caveCuveSource: function (cu) { return SRC[cu && cu.id] || null; } };
function _parcCoul(n){ return COUL[n] || '?'; }
function __pose(o){ CAVE_VENDANGE.config = o.config || {}; window.CAVE_ELEVAGE.cuvees = o.cuvees || []; SRC = o.src || {}; }
`;
const NOMS = ['_pratCfg', '_vendParcCouls', '_vendCoulAuto', '_vendCuveCoul', '_coulOk', '_coulMot', '_cuveeCoul', '_coulMelange', '_chaiMultiCoul', '_chaiCoulHtml'];
function charger(S) {
  const i = S.pr.search(/^var _PRAT_NOM = /m); if (i < 0) throw new Error('_PRAT_NOM introuvable');
  const vars = S.pr.slice(i, S.pr.indexOf('\n', i) + 1);
  const code = PRELUDE + vars + NOMS.map((n) => fn(S.pr, n)).join('\n') + '\n;({ ' + NOMS.join(', ') + ', __pose })';
  return vm.runInNewContext(code, {});
}
const P2 = { actif: { r: true, b: true, o: false }, r: {}, b: {}, o: {} };

// Les outils du moteur que lit une liste : les fonctions de tête de src/tutos.js appelées ou nommées dans sa liste.
const outilsMoteur = (tu) => new Set([...tu.matchAll(/^function (\w+)\(/gm)].map((m) => m[1]));
const sansChaines = (t) => t.replace(/\/\/[^\n]*/g, '').replace(/'(?:\\.|[^'\\])*'/g, "''");
const enTete = (L) => L.slice(0, L.indexOf('export var TU_TUTOS_'));
const varsDe = (L) => { const m = /^var ([^;]+);/m.exec(enTete(L)); return m ? m[1].split(',').map((x) => x.trim().replace(/ = null$/, '')) : []; };
const posesDe = (L) => { const m = /export function _tuOutils\(o\) \{([^}]*)\}/.exec(L); return m ? [...m[1].matchAll(/(\w+) = o\.(\w+);/g)].filter((x) => x[1] === x[2]).map((x) => x[1]) : []; };

const T = {
  // A — la règle, jouée
  A1: ['un rouge ou un rosé dans un blanc : impossible ; du blanc dans un rosé : impossible', (A) =>
    A._coulMelange('b', 'r').niv === 'b' && A._coulMelange('b', 'o').niv === 'b' && A._coulMelange('o', 'b').niv === 'b'
    && /2019\/934/.test(A._coulMelange('b', 'r').d) && /rosé ne se fait pas/.test(A._coulMelange('o', 'b').d)],
  A2: ['du blanc dans un rouge : à vérifier (le cahier des charges) ; un rouge et un rosé : rien', (A) =>
    A._coulMelange('r', 'b').niv === 'w' && /cahier des charges/.test(A._coulMelange('r', 'b').d) && A._coulMelange('r', 'o') === null && A._coulMelange('o', 'r') === null],
  A3: ['la même couleur, ou une couleur inconnue : rien', (A) => A._coulMelange('b', 'b') === null && A._coulMelange('?', 'r') === null && A._coulMelange('b', '?') === null],
  A4: ['la couleur d’une cuvée : la sienne d’abord, puis celle de sa cuve (dite, sinon ses parcelles), sinon « ? »', (A) => {
    A.__pose({ src: { x: { parcelles: ['Perr'] }, y: { couleur: 'o', parcelles: ['Clos'] } } });
    return A._cuveeCoul({ id: 'x', couleur: 'r' }) === 'r' && A._cuveeCoul({ id: 'x' }) === 'b' && A._cuveeCoul({ id: 'y' }) === 'o' && A._cuveeCoul({ id: 'z' }) === '?'; }],
  A5: ['la carte du Chai ne dit la couleur que si le domaine en a plusieurs (ses cuvées, ou ses pratiques)', (A) => {
    A.__pose({ cuvees: [{ id: 'a', couleur: 'r', statut: 'elevage' }, { id: 'b', couleur: 'r', statut: 'elevage' }] });
    const un = A._chaiCoulHtml({ id: 'a', couleur: 'r' });
    A.__pose({ cuvees: [{ id: 'a', couleur: 'r', statut: 'elevage' }, { id: 'b', couleur: 'b', statut: 'elevage' }] });
    const deux = A._chaiCoulHtml({ id: 'b', couleur: 'b' });
    A.__pose({ config: { pratiques: P2 }, cuvees: [{ id: 'a', couleur: 'r', statut: 'elevage' }] });
    const reg = A._chaiCoulHtml({ id: 'a', couleur: 'r' });
    return un === '' && /Blanc/.test(deux) && /mat-pt b/.test(deux) && /Rouge/.test(reg); }],
  // B — le branchement
  B1: ['le décuvage écrit la couleur de la cuve sur la cuvée, avant de la ranger au Chai', (A, S) => {
    const f = fn(S.cu, 'saveVendDecuvage'); return /var _coulC=_vendCuveCoul\(c\); if\(_coulC==='r'\|\|_coulC==='b'\|\|_coulC==='o'\) cuvee\.couleur=_coulC;/.test(f) && avant(f, 'cuvee.couleur=_coulC', 'CAVE_ELEVAGE.cuvees.push(cuvee)'); }],
  B2: ['« Nouvelle cuvée » : la couleur se propose à l’ouverture et s’écrit (nouvelle ou modifiée)', (A, S) => {
    const o = fn(S.cave, 'openOvCavee'), s = fn(S.cave, 'saveCuvee');
    return o.includes('window._cuvCoulOuvrir(cuv)') && s.includes('window._cuvCoulPrise()') && s.includes('if(_coulN) _prevC.couleur=_coulN; else delete _prevC.couleur;')
      && s.includes('if(_coulN) CAVE_ELEVAGE.cuvees[CAVE_ELEVAGE.cuvees.length-1].couleur=_coulN;') && avant(S.html, 'id="cuv-coul-body"', 'id="cuv-cont-body"'); }],
  B3: ['l’assemblage du Chai : les sources portent leur couleur ; impossible ou pas confirmé = refusé ; la confirmation est notée', (A, S) => {
    const r = fn(S.cave, '_asmRefus'), v = fn(S.cave, '_asmValider'), src = fn(S.cave, '_asmSources');
    return (src.match(/coul:\(typeof window\._(vendCuveCoul|cuveeCoul)==='function'\)/g) || []).length === 2
      && /if\(_mel&&_mel\.niv==='b'\) return/.test(r) && /if\(_mel&&_asmCoulOk!==_mel\.id\) return/.test(r)
      && avant(v, 'var err=_asmRefus(cu,s,L);', 'CAVE_ELEVAGE.operations.push(op)') && /op\.data\.couleur_conf=\{k:_melV\.id/.test(v)
      && fn(S.cave, '_asmChoisir').includes('_asmCoulOk=null'); }],
  B4: ['la fusion du Cuvier : refusée AVANT toute écriture, le bouton éteint, la confirmation notée', (A, S) => {
    const f = fn(S.cu, 'saveVendFusion'), rc = fn(S.cu, '_vendFusRecap'), h = fn(S.cu, '_vendFusHtml');
    return avant(f, "if(_mel&&(_mel.niv==='b'||_vendFusCoulOk!==_mel.id))", 'porteuse.cuve_ref=d.id') && avant(f, "if(_mel&&(_mel.niv==='b'||_vendFusCoulOk!==_mel.id))", 'r.cuve_id=porteuse.id')
      && rc.includes('_vendFusMelBloque()') && h.includes("_vendFusMelBloque()?' disabled':''") && f.includes('couleur_conf={k:_mel.id'); }],
  B5: ['la porteuse de la fusion se lit comme saveVendFusion la choisit (la cuve d’arrivée, sinon la première)', (A, S) => {
    const m = fn(S.cu, '_vendFusMel'), f = fn(S.cu, 'saveVendFusion');
    return m.includes("(d.kind==='cuve')?p.filter(function(c){ return c.id===d.id; })[0]:p[0]") && f.includes("(d.kind==='cuve')\n    ? p.filter(function(c){ return c.id===d.id; })[0]\n    : p[0]"); }],
  B6: ['la carte, la fiche et le labo lisent la même couleur', (A, S) =>
    fn(S.cave, '_caveCuvCardHtml').includes('window._chaiCoulHtml(c)') && fn(S.cave, 'openCuveeDetail').includes('window._coulMot(window._cuveeCoul(cuv))')
    && fn(S.cave, '_laboOrigine').includes('window._cuveeCoul(_laboCuveeDe(id))') && !fn(S.cave, '_laboOrigine').includes('_parcCoul(')],
  B7: ['cave.js passe par window, n’importe pas le module des pratiques ; le module les expose', (A, S) =>
    !/from '\.\/cuvier-pratiques\.js'/.test(S.cave) && S.cave.includes('window._caveCuveSource = _caveCuveSource;')
    && ['_cuvCoulSet', '_cuveeCoul', '_vendCuveCoul', '_coulMelange', '_coulMelHtml', '_coulMot', '_chaiCoulHtml', '_cuvCoulOuvrir', '_cuvCoulPrise'].every((n) => new RegExp('^window\\.' + n + ' += ' + n + ';', 'm').test(S.pr))
    && /_coulMelange, _coulMelHtml[\s\S]{0,400}?\} from '\.\/cuvier-pratiques\.js'/.test(S.cu)],
  B8: ['les deux « C’est voulu » sont écrits en toutes lettres (le compte des gestes les voit) et exemptés avec leur raison', (A, S) => {
    const h = fn(S.pr, '_coulMelHtml'), c = JSON.parse(S.cov);
    return h.includes('onclick="_vendFusCoulOkSet(this.dataset.id)"') && h.includes('onclick="_asmCoulOkSet(this.dataset.id)"')
      && /COULEUR-1/.test(c.exempts._asmCoulOkSet || '') && /COULEUR-1/.test(c.exempts._vendFusCoulOkSet || '') && c.plafond <= 788; }],   // PRATIQUES-3 (§626) : le plafond descend
  // C — le tuto
  C1: ['le tuto « créer une cuvée en cuve » choisit Blanc, le couvre, et finit sur une cuvée blanche', (A, S) => {
    const t = S.L.cave.slice(S.L.cave.indexOf("{ id: 'cuvee-cuve'"), S.L.cave.indexOf("{ id: 'pratiques'"));
    return t.includes("'_cuvCoulSet'") && t.includes("cible: '[data-tuto=\"cuv.coul.b\"]'") && t.includes("c.couleur === 'b'")
      && avant(t, "cible: '[data-tuto=\"cuv.coul.b\"]'", "cible: '[data-tuto=\"cuv.encuve\"]'") &&/'cuv\.coul\.b':'data-tuto="cuv\.coul\.b"'/.test(S.pr); }],
  // D — l'aide, le guide, Quoi de neuf
  D1: ['l’aide, le guide et « Quoi de neuf » disent la couleur et les mélanges refusés', (A, S) =>
    S.utils.includes("['La couleur d’une cuvée', ") && S.g08.includes('<b>La couleur d’une cuvée</b>') && /v: '11\.45'[^\n]*COULEUR-1/.test(S.wn)
    && /un rosé ne se fait pas en mélangeant un rouge et un blanc/.test(S.wn)],
  // E — le découpage des tutos
  E1: ['src/tutos.js ne porte plus aucun tuto : il importe les six listes, dans l’ordre du catalogue', (A, S) =>
    !/var TU_TUTOS(?:_[A-Z]+)? = \[\n/.test(S.tu) && !/\n {2}\{ id: '/.test(S.tu)
    && S.tu.includes('var TU_TUTOS = TU_TUTOS_VIGNE.concat(TU_TUTOS_TRACTEUR, TU_TUTOS_PLANNING, TU_TUTOS_PHYTO, TU_TUTOS_RESERVE, TU_TUTOS_CAVE);')
    && LISTES.every((m) => S.tu.includes("import { _tuOutils as _tuOutils" + m[0].toUpperCase() + m.slice(1) + ", TU_TUTOS_" + m.toUpperCase() + " } from './tutos-" + m + ".js';"))],
  E2: ['chaque liste est importée, et le moteur n’importe que ses listes (mv-tutos-sources les lit dans cet ordre)', (A, S) => {
    const lus = fichiersTutos((f) => (f === 'src/tutos.js' ? S.tu : (S.L[f.slice(10, -3)] || null)));
    return lus.join() === ['src/tutos.js'].concat(LISTES.map((m) => 'src/tutos-' + m + '.js')).join()
      && readdirSync(new URL('../src/', import.meta.url)).filter((f) => /^tutos-[a-z]+\.js$/.test(f)).sort().join() === LISTES.map((m) => 'tutos-' + m + '.js').sort().join(); }],
  E3: ['une liste ne lit que des outils qui lui sont posés (sa tête et _TU_OUTILS), et rien d’autre du moteur', (A, S) => {
    const O = outilsMoteur(S.tu), poses = new Set([...(/var _TU_OUTILS = \{([^}]*)\};/.exec(S.tu) || ['', ''])[1].matchAll(/(\w+): (\w+)/g)].filter((x) => x[1] === x[2]).map((x) => x[1]));
    // _TU_OUTILS ne pose que des fonctions du moteur : un nom disparu y casserait le chargement de tout le module (ReferenceError).
    if (!poses.size || ![...poses].every((n) => O.has(n))) return false;
    return LISTES.every((m) => {
      const L = S.L[m], liste = sansChaines(L.slice(L.indexOf('export var TU_TUTOS_'))), v = varsDe(L), p = posesDe(L);
      const lus = [...O].filter((n) => new RegExp('(?<![\\w.$])' + n.replace('$', '\\$') + '(?![\\w$])').test(liste));
      return lus.every((n) => v.includes(n) && p.includes(n) && poses.has(n)) && v.every((n) => p.includes(n));
    }); }],
  E4: ['aucune liste ne lit un outil AU CHARGEMENT (une valeur de propriété nue serait perdue)', (A, S) =>
    LISTES.every((m) => { const v = varsDe(S.L[m]), liste = S.L[m].slice(S.L[m].indexOf('export var TU_TUTOS_'));
      return !v.some((n) => new RegExp('[:,\\[]\\s*' + n.replace('$', '\\$') + '\\s*[,}\\]\\n]').test(sansChaines(liste))); })],
  E5: ['trente tutos au moins (PRATIQUES-3 : trente et un), chacun une fois, chacun dans la liste de son module', (A, S) => {
    const ids = [];
    const ok = LISTES.every((m) => [...S.L[m].matchAll(/\n {2}\{ id: '([^']+)'[\s\S]*?module: '([^']+)'/g)].every((x) => { ids.push(x[1]); return x[2] === MODULE[m]; }));
    return ok && ids.length >= 30 && new Set(ids).size === ids.length; }],
  E6: ['les scripts lisent les tutos par mv-tutos-sources (aucun ne lit src/tutos.js seul)', (A, S) =>
    Object.entries(S.sc).every(([f, t]) => !/(?:lire|L|readFileSync)\(\s*'src\/tutos\.js'/.test(t) || f === 'mv-harnais-tuto10.mjs')],
};

async function chargeListes(S) {
  const bad = []; let n = 0;
  for (const m of LISTES) {
    const M = await import('data:text/javascript;base64,' + Buffer.from(S.L[m]).toString('base64') + '#' + Math.random());
    const T0 = M['TU_TUTOS_' + m.toUpperCase()]; if (!Array.isArray(T0)) { bad.push(m + ' : pas de liste'); continue; }
    const voir = (v, p) => { if (v === undefined) bad.push(p); else if (v && typeof v === 'object') for (const k of Object.keys(v)) { const d = Object.getOwnPropertyDescriptor(v, k); if ('value' in d) voir(d.value, p + '.' + k); } };
    voir(T0, m); n += T0.length;
  }
  return { n, bad };
}

async function jouer(S) {
  const L = [];
  let A = null;
  try { A = charger(S); } catch (e) { L.push(['chargement des fonctions', false, e.message]); return L; }
  for (const [k, [lib, f]] of Object.entries(T)) {
    let ok = false, err = '';
    try { ok = !!f(A, S); } catch (e) { err = e.message; }
    L.push([k + ' · ' + lib, ok, err]);
  }
  try { const r = await chargeListes(S); L.push(['E7 · les six listes se chargent dans Node, ' + r.n + ' tutos, aucune valeur perdue' + (r.bad.length ? ' (' + r.bad.slice(0, 3).join(', ') + ')' : ''), r.n >= 30 && !r.bad.length, '']); }
  catch (e) { L.push(['E7 · les six listes se chargent dans Node', false, e.message]); }
  return L;
}

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
const remp = (t, a, b) => { if (!t.includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 60)); return t.replace(a, b); };
const DEFAUTS = [
  ['du rouge dans un blanc accepté', (S) => ({ ...S, pr: remp(S.pr, "if(kVers==='b') return {id:'mel-b-'", "if(false) return {id:'mel-b-'") })],
  ['du blanc dans un rosé accepté', (S) => ({ ...S, pr: remp(S.pr, "if(kVers==='o'&&kDe==='b') return", "if(false) return") })],
  ['du blanc dans un rouge passe sans confirmer', (S) => ({ ...S, pr: remp(S.pr, "if(kVers==='r'&&kDe==='b') return {id:'mel-r-b', niv:'w'", "if(kVers==='r'&&kDe==='b') return null; if(0) return {id:'mel-r-b', niv:'w'") })],
  ['la couleur dite d’une cuvée ignorée', (S) => ({ ...S, pr: remp(S.pr, "  if(cu&&_coulOk(cu.couleur)) return cu.couleur;\n", '') })],
  ['la carte dit la couleur d’un domaine qui n’en fait qu’une', (S) => ({ ...S, pr: remp(S.pr, "if(k==='?'||!_chaiMultiCoul()) return '';", "if(k==='?') return '';") })],
  ['le décuvage oublie la couleur', (S) => ({ ...S, cu: remp(S.cu, 'if(_coulC===\'r\'||_coulC===\'b\'||_coulC===\'o\') cuvee.couleur=_coulC;', '') })],
  ['« Nouvelle cuvée » n’écrit pas la couleur', (S) => ({ ...S, cave: remp(S.cave, "    if(_coulN) CAVE_ELEVAGE.cuvees[CAVE_ELEVAGE.cuvees.length-1].couleur=_coulN;", '') })],
  ['l’assemblage passe un « à vérifier » non confirmé', (S) => ({ ...S, cave: remp(S.cave, "  if(_mel&&_asmCoulOk!==_mel.id) return", "  if(false) return") })],
  ['la fusion refuse APRÈS avoir écrit', (S) => {
    const a = "  if(_mel&&(_mel.niv==='b'||_vendFusCoulOk!==_mel.id)){";
    const i = S.cu.indexOf(a), j = S.cu.indexOf('\n', S.cu.indexOf('return; }', i)) + 1, bloc = S.cu.slice(i, j);
    const t = S.cu.slice(0, i) + S.cu.slice(j); const k = t.indexOf('  _vendTriOps(porteuse);'); return { ...S, cu: t.slice(0, k) + bloc + t.slice(k) }; }],
  ['le labo relit les parcelles', (S) => ({ ...S, cave: remp(S.cave, "window._cuveeCoul(_laboCuveeDe(id))", "_parcCoul(id)") })],
  ['cave.js importe le module des pratiques', (S) => ({ ...S, cave: "import { _coulMot } from './cuvier-pratiques.js';\n" + S.cave })],
  ['un « C’est voulu » écrit par variable (invisible au compte des gestes)', (S) => ({ ...S, pr: remp(S.pr, "(ou==='fus'?'onclick=\"_vendFusCoulOkSet(this.dataset.id)\"':ou==='cuv'?'onclick=\"_cuvCoulOkSet(this.dataset.id)\"':'onclick=\"_asmCoulOkSet(this.dataset.id)\"')", "'onclick=\"'+ou+'(this.dataset.id)\"'") })],
  ['le tuto ne choisit plus la couleur', (S) => ({ ...S, L: { ...S.L, cave: remp(S.L.cave, "'_cuvCoulSet', ", '') } })],
  ['« Quoi de neuf » oublié', (S) => ({ ...S, wn: remp(S.wn, "v: '11.45'", "v: '11.4x'") })],
  ['un tuto resté dans le moteur', (S) => ({ ...S, tu: remp(S.tu, 'var TU_TUTOS = TU_TUTOS_VIGNE.concat(', "var TU_X = [\n  { id: 'reste', module: 'Vigne' }\n];\nvar TU_TUTOS = TU_TUTOS_VIGNE.concat(") })],
  ['une liste que le moteur n’importe plus', (S) => ({ ...S, tu: remp(S.tu, "import { _tuOutils as _tuOutilsReserve, TU_TUTOS_RESERVE } from './tutos-reserve.js';\n", '') })],
  ['une liste qui lit un outil qu’on ne lui pose pas', (S) => ({ ...S, L: { ...S.L, reserve: remp(S.L.reserve, "fait: function () { return _ouvert(", "fait: function () { return _tuSess() && _ouvert(") } })],
  ['un outil posé qui a disparu du moteur', (S) => ({ ...S, tu: remp(S.tu, 'var _TU_OUTILS = { ', 'var _TU_OUTILS = { _tuDisparu: _tuDisparu, ') })],
  ['une liste qui lit un outil au chargement', (S) => ({ ...S, L: { ...S.L, cave: remp(S.L.cave, "{ type: 'toucher', cible: '[data-tuto=\"cuv.coul.b\"]',", "{ type: 'toucher', zone: _ouvert, cible: '[data-tuto=\"cuv.coul.b\"]',") } })],
  ['un tuto rangé dans la liste d’un autre module', (S) => ({ ...S, L: { ...S.L, reserve: remp(S.L.reserve, "module: 'Réserve'", "module: 'Cave'") } })],
  ['un script qui relit src/tutos.js seul', (S) => ({ ...S, sc: { ...S.sc, 'mv-harnais-pratiques1.mjs': remp(S.sc['mv-harnais-pratiques1.mjs'], 'texteTutosDepot()', "lire('src/tutos.js')") } })],
];

if (!CONTRE) {
  const L = await jouer(SAIN);
  console.log('\nCOULEUR-1 — la couleur de la cuvée au Chai, les mélanges refusés ; les tutos rangés par module');
  for (const [lib, ok, err] of L) console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + lib + (err ? c.d('  → ' + err) : ''));
  const ko = L.filter((x) => !x[1]).length;
  console.log('\n  ' + (ko ? c.r(ko + ' rouge(s)') : c.v('✓ ' + L.length + ' vertes, 0 rouge')) + '\n');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\nCOULEUR-1 — contre-épreuves (chaque défaut doit rougir)');
  let rate = 0;
  for (const [lib, f] of DEFAUTS) {
    let S2 = null; try { S2 = f(SAIN); } catch (e) { console.log('  ' + c.r('✗') + ' ' + lib + c.d('  → ' + e.message)); rate++; continue; }
    const L = await jouer(S2), rouges = L.filter((x) => !x[1]);
    if (rouges.length) console.log('  ' + c.v('DÉTECTÉ') + '  ' + lib + c.d(' (' + rouges.length + ' rouge)'));
    else { console.log('  ' + c.r('MANQUÉ ') + '  ' + lib); rate++; }
  }
  console.log('\n  ' + (rate ? c.r(rate + ' défaut(s) passé(s) inaperçu(s)') : c.v('✓ ' + DEFAUTS.length + '/' + DEFAUTS.length + ' défauts détectés')) + '\n');
  process.exit(rate ? 1 : 0);
}
