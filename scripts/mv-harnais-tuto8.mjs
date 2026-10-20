// HARNAIS — TUTO-8 (§388) : le tuto « noter des mesures de maturité » et la vendange du domaine fictif.
//   node scripts/mv-harnais-tuto8.mjs           → doit être vert
//   node scripts/mv-harnais-tuto8.mjs --contre  → chaque défaut réinjecté doit rougir
// Le tuto lui-même est rejoué pour de vrai par scripts/mv-tutos-jeu.mjs (npm run test:tutos, après le build : téléphone,
// ordinateur, panneau, miroir). Ici : ses étiquettes posées sur les vrais boutons, ce qu'il couvre, et la vendange fictive
// — des dates CALCULÉES à quelques jours d'aujourd'hui (des dates en dur feraient de la vendange une vendange passée l'an
// prochain, et « Noter des mesures » disparaîtrait). _tuJour et _tuCave sont joués pour de vrai.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { tutos: fs.readFileSync('src/tutos.js', 'utf8'), cuv: fs.readFileSync('src/cuvier.js', 'utf8'), html: fs.readFileSync('index.html', 'utf8'),
  couv: fs.readFileSync('scripts/tutos-couverture.json', 'utf8'), utils: fs.readFileSync('src/utils.js', 'utf8') };
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
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

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  /* ══ 1. LE TUTO ══ */
  const i = S.tutos.indexOf("{ id: 'maturites'"), bloc = i < 0 ? '' : S.tutos.slice(i, S.tutos.indexOf("\n    ] }", i));
  t('le tuto des maturités existe, pour l’administrateur, dans la Cave', /module: 'Cave', pages: \['cave'\], pour: 'admin'/.test(bloc));
  t('il couvre ce qu’il enseigne', /couvre: \['selectCaveSection', 'switchVendOng', '_matSaisie', '_matSaisieIn', '_vendAnaAdd'\]/.test(bloc));
  const cibles = [...bloc.matchAll(/cible: '\[data-tuto="([\w.]+)"\]'/g)].map((m) => m[1]);
  t('ses étapes : la Cave, le Cuvier, Maturités, « Noter », taper, enregistrer, regarder', cibles.join(',') === 'cave.cuvier,cuv.maturites,mat.noter,mat.champ,mat.ok,mat.ordre', cibles.join(','));
  /* ══ 2. LES ÉTIQUETTES SUR LES VRAIS BOUTONS ══ */
  t('« Le Cuvier » porte son étiquette (index.html)', /id="cave-sec-vendange" data-tuto="cave.cuvier" onclick="selectCaveSection\(&#39;vendange&#39;\)"/.test(S.html));
  t('l’onglet Maturités, « Noter des mesures », l’enregistrement, l’ordre de maturité portent les leurs', /id="mvv-tab-ana" data-tuto="cuv\.maturites"/.test(S.cuv)
    && /data-tuto="mat\.noter" onclick="_matSaisie\(null\)"/.test(S.cuv) && /id="mat-saisie-ok" data-tuto="mat\.ok"/.test(S.cuv) && /class="mat-carte mat-ordre" data-tuto="mat\.ordre"/.test(S.cuv));
  t('seul le PREMIER champ de la feuille porte l’étiquette', /\(k \? '' : ' data-tuto="mat\.champ"'\)/.test(S.cuv) && /_matSaisieLignes\(\)\.map\(function\(e, k\)/.test(S.cuv));
  /* ══ 3. LA VENDANGE FICTIVE ══ */
  let ctx = { Date };
  try { vm.createContext(ctx); vm.runInContext(fn(S.tutos, '_tuJour') + '\n' + fn(S.tutos, '_tuCave'), ctx); }
  catch (e) { t('la vendange fictive se charge', false, e.message); return L; }
  const cave = ctx._tuCave(), auj = new Date(), an = String(auj.getFullYear());
  const dates = cave.analyses.map((a) => a.date), jours = dates.map((d) => Math.round((auj - new Date(d + 'T12:00:00')) / 86400000));
  t('des mesures datées à quelques jours d’aujourd’hui, jamais en dur', dates.length >= 4 && jours.every((j) => j >= 0 && j <= 7) && !/date: '20\d\d-/.test(fn(S.tutos, '_tuCave')), dates.join(' '));
  t('donc sur la vendange en cours', dates.filter((d) => d.slice(0, 4) === an).length >= dates.length - 1);
  t('des parcelles du domaine fictif, des fourchettes réglées', cave.analyses.every((a) => /"nom":"/.test(S.tutos) && S.tutos.includes('"nom":"' + a.parcelle + '"')) && cave.config.mat_four.r.min === 205);
  t('le domaine fictif reçoit cette vendange', /window\.applyFbData\('cave_vendange', _tuCave\(\)\)/.test(fn(S.tutos, '_charger')));
  /* ══ 4. LE COMPTE ══ */
  t('le plafond des gestes sans tuto est redescendu à 820, et ne remonte pas (815 depuis CHAT-0, §395)', JSON.parse(S.couv).plafond <= 820);
  t('la nouveauté le dit', /\{ v: '9\.50'/.test(S.utils));
  return L;
}

const DEFAUTS = [
  ['une étiquette disparaît', (S) => ({ ...S, cuv: S.cuv.replace(' data-tuto="mat.noter"', '') })],
  ['toutes les lignes de la feuille portent l’étiquette', (S) => ({ ...S, cuv: S.cuv.replace("(k ? '' : ' data-tuto=\"mat.champ\"')", "' data-tuto=\"mat.champ\"'") })],
  ['une date en dur', (S) => ({ ...S, tutos: S.tutos.replace("a(1, 'Les Charmes', -6, 196)", "{ id: 'tu_1', parcelle: 'Les Charmes', date: '2026-09-02', mode: 'sucre', val: 196, spd: 16.83 }") })],
  ['le domaine fictif n’a plus de vendange', (S) => ({ ...S, tutos: S.tutos.replace("window.applyFbData('cave_vendange', _tuCave());", "void 0;") })],
  ['le tuto ne couvre plus l’enregistrement', (S) => ({ ...S, tutos: S.tutos.replace("'_matSaisieIn', '_vendAnaAdd']", "'_matSaisieIn']") })],
  ['le plafond reste haut', (S) => ({ ...S, couv: S.couv.replace(/"plafond": \d+/, '"plafond": 825') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nTUTO-8 — noter des mesures de maturité');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nTUTO-8 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = Object.keys(SAIN).every((k) => S[k] === SAIN[k]);
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
