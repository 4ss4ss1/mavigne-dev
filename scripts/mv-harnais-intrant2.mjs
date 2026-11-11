/* ───────────────────────────────────────────────────────────────────────────────────────────────────────────
   HARNAIS — INTRANT-2 (§561) : « SUPPRIMER L'INTRANT » PASSE LA PROTECTION ANTI-PERTE, ET RIEN D'AUTRE
   Lancer :          node scripts/mv-harnais-intrant2.mjs
   Contre-épreuves : node scripts/mv-harnais-intrant2.mjs --contre

   POURQUOI IL EXISTE
   Vécu le 10/11 (un domaine client) : « fbSave intrants BLOQUE (anti-ecrasement) · cur=3 new=0 ». La garde refuse une
   chute de plus de moitié en une écriture ; « Supprimer l'intrant » (INTRANT-1) retire une fiche avec ses achats en une
   écriture. Le harnais d'INTRANT-1 remplaçait l'enregistrement par un faux, et les tutos s'arrêtent avant la garde :
   personne n'avait fait passer la suppression par la VRAIE protection. Celui-ci le fait : il joue le vrai _rsvDelProd
   (reserve.js), puis la vraie ligne de garde de la fusion et la vraie _mvBlockDestructive (firebase.js), avec le compte
   réel (_mvDocSize) et une horloge qu'on avance. Il vérifie aussi que la porte ne s'ouvre pas plus large : un autre
   compte, une autre clé, une échéance passée restent refusés.
   ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { fb: lire('src/firebase.js'), rsv: lire('src/reserve.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

// Un bloc par comptage d'accolades (chaînes et commentaires sautés), depuis la première occurrence d'un motif.
function bloc(src, motif) {
  const i = src.search(motif); if (i < 0) throw new Error('introuvable : ' + motif);
  let k = src.indexOf('{', i), p = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') p++; else if (c === '}') { p--; if (p === 0) return src.slice(i, k + 1) + (src[k + 1] === ';' ? ';' : ''); }
  }
  throw new Error('fin introuvable : ' + motif);
}
const fn = (src, nom) => bloc(src, new RegExp('(async )?function ' + nom + '\\s*\\('));
const decl = (src, nom) => { const m = new RegExp('var ' + nom + '\\s*=[\\s\\S]*?;[^\\n]*\\n').exec(src); if (!m) throw new Error('déclaration : ' + nom); return m[0]; };

function monter(S) {
  const j = { crit: [], info: [], sauv: [] };
  let horloge = 1_000_000;
  const ctx = { console: { log() {} }, Date: { now: () => horloge }, Object, Array, JSON, Math, Number, String,
    isAdmin: () => true, showToast() {}, _rsvRenderBody() {}, _mvGardeEcran: () => ({}),
    _escHtml: (s) => String(s), _fmt: (n) => String(n), _frDate: (s) => String(s) };
  ctx.window = { logError: (e) => (e.level === 'critical' ? j.crit : j.info).push(e), closeOv() {}, showToastAnnuler() {}, CAVE_VENDANGE: null, CAVE_ELEVAGE: null, _mvAvale() {} };
  ctx.fbDocRef = (k) => k; ctx.getDoc = async (k) => ({ exists: () => !!ctx.SERVEUR, data: () => ({ value: ctx.SERVEUR }) });
  vm.createContext(ctx);
  const ligne = S.fb.split('\n').find((l) => l.includes('return { bloque: true, curN: curN, newN: newN };'));
  if (!ligne) throw new Error('ligne de garde de la fusion introuvable');
  const code = [
    fn(S.fb, '_mvParcProgCount'), fn(S.fb, '_mvIntrantsCount'), fn(S.fb, '_mvPaieCount'), fn(S.fb, '_mvModelesCount'), fn(S.fb, '_mvDocSize'),
    decl(S.fb, '_mvBaisses'), decl(S.fb, '_MV_BAISSE_MS'), bloc(S.fb, /window\._mvAnnoncerBaisse\s*=\s*function/), fn(S.fb, '_mvBaisseAnnoncee'),
    decl(S.fb, '_MV_GUARD_FLOORS'), fn(S.fb, '_mvBlockDestructive'),
    'function _gardeFusion(key, distant, fusion){ var curN=_mvDocSize(key, distant), newN=_mvDocSize(key, fusion);\n' + ligne + '\n return null; }',
    decl(S.rsv, '_rsvPfId'), fn(S.rsv, '_rsvPfProd'), fn(S.rsv, '_rsvProdRefs'), fn(S.rsv, '_rsvDelProd'),
    'function saveIntrants(){ SAUV.push(JSON.parse(JSON.stringify(INTRANTS))); }',
    'this.T = { gardeFusion:_gardeFusion, bloque:_mvBlockDestructive, annoncer:window._mvAnnoncerBaisse, taille:_mvDocSize, delProd:_rsvDelProd, ouvrir:function(id){ _rsvPfId=id; } };',
  ].join('\n');
  ctx.SAUV = j.sauv;
  vm.runInContext(code, ctx);
  return { ctx, T: ctx.T, j, avancer: (ms) => { horloge += ms; } };
}
const copie = (x) => JSON.parse(JSON.stringify(x));
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
const vide = () => ({ produits: [], achats: [], inventaires: [], futs: [], fertil: [] });
// Le cas du signalement : une fiche et ses deux achats — 3 éléments.
const casSignale = () => Object.assign(vide(), { produits: [{ id: 'P1', nom: 'Piquets', cat: 'vigne', unite: 'kg' }],
  achats: [{ id: 'a1', prodId: 'P1', q: 300 }, { id: 'a2', prodId: 'P1', q: 200 }] });
// La fiche fantôme d'INTRANT-1 : deux « Piquets », l'une vide, l'autre avec son achat — 3 éléments.
const casFantome = () => Object.assign(vide(), { produits: [{ id: 'A', nom: 'Piquets' }, { id: 'B', nom: 'Piquets' }], achats: [{ id: 'aB', prodId: 'B', q: 500 }] });

async function jouer(S) {
  // ── A. LE CAS DU SIGNALEMENT, PAR LA VRAIE GARDE ──
  let M = monter(S); M.ctx.INTRANTS = casSignale(); M.ctx.SERVEUR = casSignale();
  M.T.ouvrir('P1'); M.T.delProd();
  const local = M.j.sauv[0];
  t('A · la suppression écrit bien 0 élément (la fiche et ses deux achats), d’une seule écriture', M.j.sauv.length === 1 && M.T.taille('intrants', local) === 0);
  t('A · la vraie ligne de garde de la fusion la laisse passer (serveur 3, écrit 0 : annoncé)', M.T.gardeFusion('intrants', M.ctx.SERVEUR, local) === null);
  t('A · une trace « Baisse annoncée acceptée » reste au journal (info, pas critique)', M.j.info.some((e) => /Baisse annoncée acceptée : intrants/.test(e.msg)) && M.j.crit.length === 0);
  M = monter(S); M.ctx.SERVEUR = casSignale();
  const sans = M.T.gardeFusion('intrants', M.ctx.SERVEUR, vide());
  t('A · sans annonce, la garde refuse exactement comme le 10/11 (cur=3 new=0)', !!(sans && sans.bloque && sans.curN === 3 && sans.newN === 0));

  // ── B. LA FICHE FANTÔME : SUPPRIMER LA FICHE PLEINE ──
  M = monter(S); M.ctx.INTRANTS = casFantome(); M.ctx.SERVEUR = casFantome();
  M.T.ouvrir('B'); M.T.delProd();
  t('B · deux fiches et un achat, la pleine supprimée (3 → 1) : passe', M.T.taille('intrants', M.j.sauv[0]) === 1 && M.T.gardeFusion('intrants', M.ctx.SERVEUR, M.j.sauv[0]) === null);

  // ── C. LA PORTE NE S'OUVRE PAS PLUS LARGE ──
  M = monter(S); M.ctx.SERVEUR = casFantome(); M.T.annoncer('intrants', { produits: [{ id: 'A' }] });   // annonce : 1
  const ecr = M.T.gardeFusion('intrants', M.ctx.SERVEUR, vide());
  t('C · un état VIDE écrit pendant l’annonce d’un autre compte (1) : refusé', !!(ecr && ecr.bloque && ecr.newN === 0));
  M.avancer(16000);
  const tard = M.T.gardeFusion('intrants', M.ctx.SERVEUR, { produits: [{ id: 'A' }] });
  t('C · le bon compte, mais après quinze secondes : refusé (l’annonce a expiré)', !!(tard && tard.bloque));
  M = monter(S); M.ctx.SERVEUR = casSignale(); M.T.annoncer('intrants', vide());
  const trt = M.T.gardeFusion('traitements', [1, 2, 3, 4, 5, 6], []);
  t('C · une annonce de La Réserve n’ouvre pas une autre clé (registre phyto 6 → 0 : refusé)', !!(trt && trt.bloque));
  M = monter(S); M.ctx.SERVEUR = Object.assign(vide(), { produits: [1, 2, 3, 4, 5, 6] });
  M.T.annoncer('intrants', { produits: [1] }); M.T.annoncer('intrants', vide());
  t('C · deux suppressions coup sur coup : les deux comptes annoncés passent (1 puis 0)',
    M.T.gardeFusion('intrants', M.ctx.SERVEUR, { produits: [1] }) === null && M.T.gardeFusion('intrants', M.ctx.SERVEUR, vide()) === null);
  const autre = M.T.gardeFusion('intrants', M.ctx.SERVEUR, { produits: [1, 2] });
  t('C · … et un compte que personne n’a annoncé reste refusé (6 → 2)', !!(autre && autre.bloque && autre.newN === 2));

  // ── D. LA GARDE DIRECTE (lecture avant écriture) SUIT LA MÊME RÈGLE ──
  M = monter(S); M.ctx.SERVEUR = casSignale();
  const b1 = await M.T.bloque('intrants', vide());
  t('D · _mvBlockDestructive, sans annonce : bloque et le note en critique (cur=3 new=0)', b1 === true && M.j.crit.some((e) => e.detail === 'cur=3 new=0'));
  M.T.annoncer('intrants', vide());
  const b2 = await M.T.bloque('intrants', vide());
  t('D · … avec l’annonce : laisse passer', b2 === false);

  // ── E. LE CÂBLAGE ──
  const corps = fn(S.rsv, '_rsvDelProd');
  const iA = corps.indexOf("window._mvAnnoncerBaisse('intrants', INTRANTS)"), iF = corps.indexOf('INTRANTS.inventaires=INTRANTS.inventaires.filter'), iS = corps.indexOf('saveIntrants();');
  t('E · « Supprimer l’intrant » annonce APRÈS avoir tout retiré, AVANT d’enregistrer', iA > iF && iF > 0 && iS > iA);
  t('E · les deux lignes de garde de firebase.js connaissent l’annonce', (S.fb.match(/newN < curN \* 0\.5 && !\(typeof _mvBaisseAnnoncee === 'function' && _mvBaisseAnnoncee\(key, newN\)\)/g) || []).length === 2);
  t('E · la liste joue ce fichier et sa contre-épreuve', S.liste.includes("mv-harnais-intrant2.mjs'") && S.liste.includes("mv-harnais-intrant2.mjs --contre'"));
}

async function verdict(S) { ok = 0; ko = 0; try { await jouer(S); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); } return ko; }
if (!CONTRE) {
  await verdict(S0);
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['« Supprimer l’intrant » n’annonce plus rien', m('rsv', "  if(typeof window._mvAnnoncerBaisse==='function') window._mvAnnoncerBaisse('intrants', INTRANTS);\n", '')],
    ['la garde de la fusion ignore l’annonce', m('fb', " && !(typeof _mvBaisseAnnoncee === 'function' && _mvBaisseAnnoncee(key, newN))) return { bloque: true", ') return { bloque: true')],
    ['n’importe quel compte passe', m('fb', 'return a.n === newN; });', 'return true; });')],
    ['l’annonce n’expire jamais', m('fb', 'var now = Date.now(), l = (_mvBaisses[key] || []).filter(function (a) { return a.jusqu > now; });', 'var now = Date.now(), l = (_mvBaisses[key] || []).filter(function (a) { return true; });')],
    ['une seule annonce gardée (la dernière écrase)', m('fb', "var l = (_mvBaisses[key] || []).filter(function (a) { return a.jusqu > now; });\n    l.push(", 'var l = [];\n    l.push(')],
    ['l’annonce vaut pour toutes les clés', m('fb', '    _mvBaisses[key] = l;\n  } catch', "    _mvBaisses[key] = l; _mvBaisses.traitements = l;\n  } catch")],
    ['l’annonce porte un autre compte que ce qui s’écrit', m('rsv', "window._mvAnnoncerBaisse('intrants', INTRANTS);", "window._mvAnnoncerBaisse('intrants', {produits:[1,2,3]});")],
    ['la garde directe ignore l’annonce', m('fb', " && !(typeof _mvBaisseAnnoncee === 'function' && _mvBaisseAnnoncee(key, newN))) {", ') {')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-intrant2.mjs'").join("mv-harnais-intrantZ.mjs'") })],
  ];
  { const log = console.log; console.log = () => {}; const k = await verdict(S0); console.log = log;
    if (k) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + k + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    const log = console.log; console.log = () => {}; const k = await verdict(S); console.log = log;
    if (k > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
