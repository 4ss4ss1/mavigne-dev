/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-0 (§580) : LE CLIQUET DES MOTS EST BRANCHÉ, ET SA RÉFÉRENCE TIENT DEBOUT
   Lancer :          node scripts/mv-harnais-mots0.mjs
   Contre-épreuves : node scripts/mv-harnais-mots0.mjs --contre

   POURQUOI IL EXISTE
   Le contrôle au rendu (scripts/mv-mots-rendu.mjs) demande un build et un navigateur : il vit hors de `npm run check`,
   comme le gabarit (§456) et l’expérience d’usage (§459), et la CI le joue après eux. Ce harnais, lui, tourne à chaque
   check et garde ce qui ne se voit pas tant que rien ne rougit : que npm et la CI jouent bien le contrôle — UN CLIQUET ÉCRIT
   N’EST PAS UN CLIQUET BRANCHÉ —, que la référence (scripts/mv-mots-baseline.json) couvre les 46 écrans et les deux tailles
   que le contrôle relève, avec des nombres, que son horloge est celle du contrôle ET celle de l’expérience d’usage (la même
   démo, le même jour), que le contrôle pose bien cette horloge, refuse de regraver une hausse sans raison écrite, garde sa
   contre-épreuve et son lexique, ne lit le lexique qu’au Pilotage — et que la LISTE ne le joue pas : il lui faut un build
   et un navigateur, et sous --baseline il écrit dans scripts/.
   ⚠️ Il ne mesure rien à l’écran : la preuve au navigateur, c’est `npm run test:mots` (et `-- --contre`).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pkg: lire('package.json'), ci: lire('.github/workflows/ci.yml'), rendu: lire('scripts/mv-mots-rendu.mjs'), ux: lire('scripts/mv-ux-rendu.mjs'), ref: lire('scripts/mv-mots-baseline.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const nombre = (v) => typeof v === 'number' && Number.isFinite(v);
function jouer(S) {
  let pkg = {}; try { pkg = JSON.parse(S.pkg); } catch (e) { pkg = {}; }
  t('① npm run test:mots joue le contrôle au rendu', (pkg.scripts || {})['test:mots'] === 'node scripts/mv-mots-rendu.mjs', String((pkg.scripts || {})['test:mots']));
  const iU = S.ci.indexOf('run: npm run test:ux'), iM = S.ci.indexOf('run: npm run test:mots');
  t('② la CI le joue sur le build, après l’expérience d’usage', iU > 0 && iM > iU, 'test:ux à ' + iU + ', test:mots à ' + iM);
  // ce que le contrôle relève, lu dans le contrôle lui-même
  const iE = S.rendu.indexOf('const ECRANS = ['), jE = S.rendu.indexOf('\n];', iE);
  const ecrans = iE > 0 ? [...S.rendu.slice(iE, jE).matchAll(/\['([^']+ › [^']+|[^']+)', '([a-z]+)', \[/g)].map((m) => m[1]) : [];
  const iMe = S.rendu.indexOf('const MESURES = {'), jMe = S.rendu.indexOf('\n};', iMe);
  const mesures = iMe > 0 ? [...S.rendu.slice(iMe, jMe).matchAll(/^ {2}([a-z0-9]+): \{ tol:/gm)].map((m) => m[1]) : [];
  const mH = S.rendu.match(/const HORLOGE = '([^']+)'/), mHux = S.ux.match(/const HORLOGE = '([^']+)'/);
  t('③ le contrôle relève 46 écrans, sans doublon, et quatre mesures', ecrans.length === 46 && new Set(ecrans).size === 46 && mesures.join(',') === 'mots,p15,avant,lex', ecrans.length + ' écrans, mesures : ' + mesures.join(','));
  t('③ le Pilotage y a ses quatorze écrans', ecrans.filter((e) => e.startsWith('Pilotage › ')).length === 14, String(ecrans.filter((e) => e.startsWith('Pilotage › ')).length));
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  t('④ la référence se lit (JSON)', !!ref);
  if (ref) {
    t('④ la référence a l’horloge du contrôle', !!mH && ref.horloge === mH[1], (ref.horloge || '(aucune)') + ' contre ' + (mH ? mH[1] : '(aucune)'));
    const manques = [];
    ['téléphone', 'ordinateur'].forEach((e) => ecrans.forEach((c) => { const m = ((ref.mesures || {})[e] || {})[c];
      if (!m) { manques.push(e + ' › ' + c + ' absent'); return; }
      ['mots', 'p15'].forEach((k) => { if (!nombre(m[k])) manques.push(e + ' › ' + c + ' › ' + k + ' = ' + JSON.stringify(m[k])); });
      if (m.avant !== null && !nombre(m.avant)) manques.push(e + ' › ' + c + ' › avant = ' + JSON.stringify(m.avant));
      if (c.startsWith('Pilotage › ') ? !nombre(m.lex) : m.lex !== null) manques.push(e + ' › ' + c + ' › lex = ' + JSON.stringify(m.lex)); }));
    t('④ la référence couvre les deux tailles × 46 écrans, avec des nombres (le lexique au Pilotage seulement)', manques.length === 0, manques.slice(0, 4).join(' · '));
    const enTrop = ['téléphone', 'ordinateur'].flatMap((e) => Object.keys((ref.mesures || {})[e] || {}).filter((c) => !ecrans.includes(c)).map((c) => e + ' › ' + c));
    t('④ la référence ne garde aucun écran que le contrôle ne relève plus', enTrop.length === 0, enTrop.slice(0, 4).join(' · '));
    t('④ chaque regravure dit pourquoi', Array.isArray(ref.regravures) && ref.regravures.length > 0 && ref.regravures.every((r) => r && typeof r.motif === 'string' && r.motif.length > 0));
  }
  t('⑤ le contrôle pose l’horloge, puis la laisse tourner', /await page\.clock\.install\(\{ time: new Date\(HORLOGE\) \}\)/.test(S.rendu) && /await page\.clock\.resume\(\)/.test(S.rendu));
  t('⑤ son horloge est celle de l’expérience d’usage (la même démo, le même jour)', !!mH && !!mHux && mH[1] === mHux[1], (mH ? mH[1] : '(aucune)') + ' contre ' + (mHux ? mHux[1] : '(aucune)'));
  t('⑤ il lit et écrit sa référence là où ce harnais la lit', /path\.join\(ICI, 'mv-mots-baseline\.json'\)/.test(S.rendu));
  t('⑥ il refuse de regraver une hausse sans raison écrite (--accepte), et une référence trouée', /if \(ref && hausses\.length && !ACCEPTE\)/.test(S.rendu) && /if \(nbReleve !== nbAttendu \|\| connexion > 0\)/.test(S.rendu) && /process\.exit\(1\)/.test(S.rendu));
  const mA = S.rendu.match(/const attendus = \[([^\]]+)\]/);
  t('⑦ il garde sa contre-épreuve (une phrase et un mot hors lexique posés à l’écran, quatre mesures attendues)', /const DEFAUT_PHRASE = '/.test(S.rendu) && /const DEFAUT_MOT = '/.test(S.rendu) && !!mA && (mA[1].match(/› téléphone › /g) || []).length === 4 && /h\.after\(d, m\)/.test(S.rendu));
  const iL = S.rendu.indexOf('const HORS_LEXIQUE = ['), jL = S.rendu.indexOf('\n];', iL);
  const lexique = iL > 0 ? (S.rendu.slice(iL, jL).match(/'(?:[^'\\]|\\.)+'/g) || []) : [];
  t('⑨ il garde son lexique (vingt expressions au moins)', lexique.length >= 20, lexique.length + ' expression(s)');
  t('⑨ le lexique ne se lit qu’au Pilotage', /\[cle\.startsWith\('Pilotage'\) \? LEX_SRC : ''\]/.test(S.rendu));
  t('⑨ ni le bandeau ni la ligne d’écran ne sont comptés, ni une fenêtre fermée', /el\.closest\('\.mod-header, \.mv-ecran, script, style'\)/.test(S.rendu) && /!o\.classList\.contains\('open'\)/.test(S.rendu));
  t('⑧ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-mots0.mjs'") > 0 && S.liste.indexOf("mv-harnais-mots0.mjs --contre'") > 0);
  t('⑧ la liste ne joue pas le contrôle au rendu (build et navigateur ; il écrit sous --baseline)', S.liste.indexOf('scripts/mv-mots-rendu.mjs') < 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const avecRef = (S, f) => { const r = JSON.parse(S.ref); f(r); return Object.assign({}, S, { ref: JSON.stringify(r) }); };
  const sur = (S, cle, de, vers) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 40)); return Object.assign({}, S, { [cle]: S[cle].replace(de, vers) }); };
  const mutants = [
    ['npm ne joue plus le contrôle au rendu', (S) => sur(S, 'pkg', '"test:mots"', '"test:mots-off"')],
    ['la CI ne le joue plus', (S) => sur(S, 'ci', 'run: npm run test:mots', 'run: echo rien')],
    ['la CI le joue avant l’expérience d’usage', (S) => sur(sur(S, 'ci', 'run: npm run test:mots', 'run: echo rien'), 'ci', 'run: npm run test:gabarit', 'run: npm run test:mots\n        run: npm run test:gabarit')],
    ['le contrôle perd un écran', (S) => sur(S, 'rendu', "['Réglages › Moi', 'reglages', [J('switchReglTab(\"app\")')]],", '')],
    ['le contrôle relève deux fois le même écran', (S) => sur(S, 'rendu', "['Réglages › Moi', 'reglages',", "['Réglages › Équipe', 'reglages',")],
    ['le contrôle perd une mesure', (S) => sur(S, 'rendu', "  p15: { tol: 0,", "  // p15: { tol: 0,")],
    ['la référence perd un écran', (S) => avecRef(S, (r) => { delete r.mesures['téléphone']['Cave › Le Millésime › Courbes']; })],
    ['la référence garde un écran disparu', (S) => avecRef(S, (r) => { r.mesures['ordinateur']['Pilotage › L’année'] = { mots: 1, p15: 0, avant: null, lex: 0 }; })],
    ['une mesure de la référence devient un texte', (S) => avecRef(S, (r) => { r.mesures['ordinateur']['Vigne › Journal'].mots = '136'; })],
    ['la référence perd le lexique d’un écran du Pilotage', (S) => avecRef(S, (r) => { r.mesures['téléphone']['Pilotage › Travaux'].lex = null; })],
    ['la référence n’a plus l’horloge du contrôle', (S) => avecRef(S, (r) => { r.horloge = '2026-10-25T08:00:00Z'; })],
    ['une regravure sans motif', (S) => avecRef(S, (r) => { r.regravures = [{ date: '2026-11-16', motif: '' }]; })],
    ['le contrôle ne pose plus l’horloge', (S) => sur(S, 'rendu', 'await page.clock.resume()', 'await page.waitForTimeout(0)')],
    ['le contrôle prend une autre horloge que l’expérience d’usage', (S) => avecRef(sur(S, 'rendu', "const HORLOGE = '2026-10-27T08:00:00Z'", "const HORLOGE = '2026-10-28T08:00:00Z'"), (r) => { r.horloge = '2026-10-28T08:00:00Z'; })],
    ['le contrôle regrave une hausse sans raison', (S) => sur(S, 'rendu', 'if (ref && hausses.length && !ACCEPTE)', 'if (false)')],
    ['le contrôle grave un relevé troué', (S) => sur(S, 'rendu', 'if (nbReleve !== nbAttendu || connexion > 0)', 'if (false)')],
    ['le contrôle perd sa contre-épreuve', (S) => sur(S, 'rendu', "const DEFAUT_PHRASE = '", "const SANS_PHRASE = '")],
    ['le contrôle perd son lexique', (S) => { const i = S.rendu.indexOf('const HORS_LEXIQUE = ['), j = S.rendu.indexOf('\n];', i); if (i < 0) throw new Error('lexique absent'); return Object.assign({}, S, { rendu: S.rendu.slice(0, i) + "const HORS_LEXIQUE = [\n  'effectif'," + S.rendu.slice(j) }); }],
    ['le contrôle lit le lexique partout', (S) => sur(S, 'rendu', "[cle.startsWith('Pilotage') ? LEX_SRC : '']", '[LEX_SRC]')],
    ['le contrôle compte le bandeau', (S) => sur(S, 'rendu', "el.closest('.mod-header, .mv-ecran, script, style')", "el.closest('script, style')")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-mots0.mjs'").join("mv-harnais-motsY.mjs'") })],
    ['la liste joue le contrôle au rendu', (S) => sur(S, 'liste', "  ['node scripts/mv-harnais-mots0.mjs'],", "  ['node scripts/mv-mots-rendu.mjs'],\n  ['node scripts/mv-harnais-mots0.mjs'],")],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
